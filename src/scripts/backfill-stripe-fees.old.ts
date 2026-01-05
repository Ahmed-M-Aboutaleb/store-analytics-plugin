import {
  type ExecArgs,
  type IOrderModuleService,
  type Logger,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import Stripe from "stripe";
import { parseStripeFees } from "../utils.old";
import { FilterableOrderProps } from "@medusajs/types";
import { fawazAhmedConverter } from "../utils.old/fawaz-ahmed-converter";

type BackfillOptions = {
  pageSize: number;
  concurrency: number;
  stripeDelayMs: number;
  dryRun: boolean;
  after?: string;
  before?: string;
  maxOrders?: number;
};

type OrderRecord = {
  id: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string | Date | null;
  currency_code?: string | null;
  payment_collections?: Array<{
    payments?: Array<{
      id: string;
      provider_id?: string | null;
      data?: unknown;
      metadata?: Record<string, unknown> | null;
    }>;
  }>;
};

type BatchStats = {
  processed: number;
  updated: number;
  skippedExisting: number;
  skippedNoStripe: number;
  skippedCharge: number;
  skippedBalance: number;
  skippedCurrency: number;
  errors: number;
};

const DEFAULT_OPTIONS: BackfillOptions = {
  pageSize: 50,
  concurrency: 3,
  stripeDelayMs: 60,
  dryRun: false,
};

const STRIPE_ID_PREFIXES = ["ch_", "pi_"];

export default async function backfillStripeFees({
  container,
  args,
}: ExecArgs): Promise<void> {
  const logger = container.resolve<Logger>("logger");

  const options = parseOptions(args ?? []);

  const stripeKey = process.env.STRIPE_API_KEY;
  if (!stripeKey) {
    logger.warn(
      "[backfill-stripe-fees] STRIPE_API_KEY is missing. Aborting backfill."
    );
    return;
  }

  const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const filters = buildFilters(options);

  const stripe = new Stripe(stripeKey);
  const chargeCache = new Map<string, Stripe.BalanceTransaction | null>();

  const totalOrders = await countOrders(orderService, filters);
  logger.info(
    `[backfill-stripe-fees] Starting backfill (total orders in range: ${totalOrders}, pageSize=${options.pageSize}, concurrency=${options.concurrency}, dryRun=${options.dryRun})`
  );

  let offset = 0;
  const stats: BatchStats = {
    processed: 0,
    updated: 0,
    skippedExisting: 0,
    skippedNoStripe: 0,
    skippedCharge: 0,
    skippedBalance: 0,
    skippedCurrency: 0,
    errors: 0,
  };

  while (true) {
    const orders = await fetchOrderBatch(
      query,
      filters,
      options.pageSize,
      offset
    );

    if (!orders.length) {
      break;
    }

    await runWithConcurrency(orders, options.concurrency, async (order) => {
      try {
        const result = await processOrder({
          order,
          orderService,
          stripe,
          chargeCache,
          logger,
          options,
        });

        stats.processed += 1;
        stats[result] += 1;
      } catch (err) {
        stats.errors += 1;
        const error = err as Error;
        logger.error(
          `[backfill-stripe-fees] Failed to process order ${order.id}: ${error.message}`
        );
      }
    });

    offset += orders.length;

    if (options.maxOrders && stats.processed >= options.maxOrders) {
      logger.info(
        `[backfill-stripe-fees] Reached maxOrders=${options.maxOrders}. Stopping early.`
      );
      break;
    }

    if (orders.length < options.pageSize) {
      break;
    }
  }

  logger.info(
    `[backfill-stripe-fees] Completed. updated=${stats.updated}, skippedExisting=${stats.skippedExisting}, skippedNoStripe=${stats.skippedNoStripe}, skippedCharge=${stats.skippedCharge}, skippedBalance=${stats.skippedBalance}, skippedCurrency=${stats.skippedCurrency}, errors=${stats.errors}`
  );
}

function parseOptions(rawArgs: string[]): BackfillOptions {
  const options: BackfillOptions = { ...DEFAULT_OPTIONS };

  for (const arg of rawArgs) {
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (!arg.startsWith("--") || !arg.includes("=")) {
      continue;
    }

    const [key, value] = arg.slice(2).split("=");

    if (!key || value === undefined) {
      continue;
    }

    switch (key) {
      case "page-size": {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          options.pageSize = Math.min(parsed, 500);
        }
        break;
      }
      case "concurrency": {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          options.concurrency = Math.min(parsed, 10);
        }
        break;
      }
      case "stripe-delay-ms": {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed >= 0) {
          options.stripeDelayMs = parsed;
        }
        break;
      }
      case "after": {
        const iso = toValidDateIso(value);
        if (iso) {
          options.after = iso;
        }
        break;
      }
      case "before": {
        const iso = toValidDateIso(value);
        if (iso) {
          options.before = iso;
        }
        break;
      }
      case "max-orders": {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
          options.maxOrders = parsed;
        }
        break;
      }
      default:
        break;
    }
  }

  return options;
}

function buildFilters(options: BackfillOptions): FilterableOrderProps {
  const filters: FilterableOrderProps = {};

  if (options.after || options.before) {
    const createdAt: { $gt?: string; $lt?: string } = {};
    if (options.after) {
      createdAt.$gt = options.after;
    }
    if (options.before) {
      createdAt.$lt = options.before;
    }
    filters.created_at = createdAt;
  }

  return filters;
}

async function countOrders(
  orderService: IOrderModuleService,
  filters: FilterableOrderProps
): Promise<number> {
  const [, count] = await orderService.listAndCountOrders(filters, {
    select: ["id"],
    take: 1,
    skip: 0,
  });
  return count;
}

async function fetchOrderBatch(
  query: any,
  filters: FilterableOrderProps,
  pageSize: number,
  offset: number
): Promise<OrderRecord[]> {
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "created_at",
      "currency_code",
      "metadata",
      "payment_collections.id",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.data",
      "payment_collections.payments.metadata",
    ],
    filters,
    take: pageSize,
    skip: offset,
    order: {
      created_at: "ASC",
    },
  });

  return (data as OrderRecord[]) ?? [];
}

async function processOrder({
  order,
  orderService,
  stripe,
  chargeCache,
  logger,
  options,
}: {
  order: OrderRecord;
  orderService: IOrderModuleService;
  stripe: Stripe;
  chargeCache: Map<string, Stripe.BalanceTransaction | null>;
  logger: Logger;
  options: BackfillOptions;
}): Promise<keyof BatchStats> {
  const metadata = (order.metadata as Record<string, unknown> | null) ?? {};
  const existingFee = parseStripeFees(metadata);

  if (existingFee !== null) {
    return "skippedExisting";
  }

  const stripePayments = extractStripePayments(order);
  if (!stripePayments.length) {
    return "skippedNoStripe";
  }

  let feeTotal = 0;
  let grossTotal = 0;
  let netTotal = 0;
  let feeCurrency: string | null = null;
  let processedCharges = 0;
  let balanceCount = 0;

  for (const payment of stripePayments) {
    const chargeId = await resolveChargeId(payment.data, stripe);
    if (!chargeId) {
      logger.warn(
        `[backfill-stripe-fees] Could not resolve charge for payment ${payment.id} (order ${order.id})`
      );
      continue;
    }

    processedCharges += 1;

    const balanceTx = await getBalanceTransaction(
      chargeId,
      stripe,
      chargeCache,
      options.stripeDelayMs
    );

    if (!balanceTx) {
      logger.warn(
        `[backfill-stripe-fees] No balance transaction found for charge ${chargeId} (order ${order.id})`
      );
      continue;
    }

    balanceCount += 1;

    feeTotal += balanceTx.fee ?? 0;
    grossTotal += balanceTx.amount ?? 0;
    netTotal += balanceTx.net ?? 0;

    const txCurrency = balanceTx.currency?.toUpperCase?.() ?? null;
    if (txCurrency && !feeCurrency) {
      feeCurrency = txCurrency;
    }
  }

  if (processedCharges === 0) {
    return "skippedCharge";
  }

  if (balanceCount === 0) {
    return "skippedBalance";
  }

  if (!feeCurrency) {
    return "skippedCurrency";
  }

  // Convert from Stripe's smallest unit (e.g., cents) to major units.
  const feeTotalMajor = feeTotal / 100;
  const orderCurrency = order.currency_code?.toUpperCase?.() ?? null;
  const orderDate = order.created_at ? new Date(order.created_at) : new Date();

  let targetFee = feeTotalMajor;
  let targetCurrency = feeCurrency;

  if (orderCurrency && feeCurrency && orderCurrency !== feeCurrency) {
    const converted = await convertMajorAmount(
      feeTotalMajor,
      feeCurrency,
      orderCurrency,
      orderDate,
      logger
    );
    if (converted !== null) {
      targetFee = converted;
      targetCurrency = orderCurrency;
    } else {
      logger.warn(
        `[backfill-stripe-fees] Could not convert ${feeCurrency} -> ${orderCurrency} for order ${order.id}; keeping original currency.`
      );
    }
  }

  const updatedMetadata = {
    ...metadata,
    stripe_fee_amount: targetFee,
    stripe_fee_currency: targetCurrency,
  };

  if (!options.dryRun) {
    await orderService.updateOrders([
      {
        id: order.id,
        metadata: updatedMetadata,
      } as any,
    ]);
  }

  return "updated";
}

function extractStripePayments(order: OrderRecord) {
  return (order.payment_collections ?? [])
    .flatMap((pc) => pc?.payments ?? [])
    .filter(
      (payment) =>
        typeof payment?.provider_id === "string" &&
        (payment.provider_id as string).toLowerCase().includes("stripe")
    )
    .filter(Boolean);
}

async function resolveChargeId(paymentData: any, stripe: Stripe) {
  if (typeof paymentData === "object" && paymentData !== null) {
    if (paymentData.latest_charge) {
      return paymentData.latest_charge as string;
    }
    if (
      paymentData.id &&
      typeof paymentData.id === "string" &&
      STRIPE_ID_PREFIXES.some((prefix) => paymentData.id.startsWith(prefix))
    ) {
      return paymentData.id as string;
    }
    if (paymentData.id && String(paymentData.id).startsWith("pi_")) {
      const pi = await stripe.paymentIntents.retrieve(
        paymentData.id as string,
        {
          expand: ["latest_charge"],
        }
      );
      const charge = pi.latest_charge as Stripe.Charge;
      return charge?.id;
    }
  }
  return undefined;
}

async function convertMajorAmount(
  amount: number,
  from: string,
  to: string,
  at: Date,
  logger: Logger
): Promise<number | null> {
  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (fromLower === toLower) {
    return amount;
  }

  if (process.env.BACKFILL_SKIP_STRIPE_FX === "1") {
    return null;
  }

  try {
    const converted = await fawazAhmedConverter.convert(amount, from, to, at);
    return converted;
  } catch (err) {
    const error = err as Error;
    logger.warn(
      `[backfill-stripe-fees] FX conversion failed ${from.toUpperCase()} -> ${to.toUpperCase()}: ${
        error.message
      }`
    );
    return null;
  }
}

async function getBalanceTransaction(
  chargeId: string,
  stripe: Stripe,
  cache: Map<string, Stripe.BalanceTransaction | null>,
  delayMs: number
): Promise<Stripe.BalanceTransaction | null> {
  if (cache.has(chargeId)) {
    return cache.get(chargeId) ?? null;
  }

  const charge = await stripe.charges.retrieve(chargeId, {
    expand: ["balance_transaction"],
  });

  const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

  cache.set(chargeId, balanceTx ?? null);

  if (delayMs > 0) {
    await sleep(delayMs);
  }

  return balanceTx ?? null;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  const limit = Math.max(1, concurrency);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const current = items[cursor];
        cursor += 1;
        await worker(current);
      }
    }
  );

  await Promise.all(runners);
}

function toValidDateIso(value: string): string | undefined {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
