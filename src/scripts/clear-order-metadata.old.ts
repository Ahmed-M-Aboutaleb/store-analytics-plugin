import {
  type ExecArgs,
  type IOrderModuleService,
  type Logger,
} from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { FilterableOrderProps } from "@medusajs/types";

type Options = {
  pageSize: number;
  concurrency: number;
  dryRun: boolean;
  keys: string[];
  removeAll: boolean;
  after?: string;
  before?: string;
  maxOrders?: number;
};

type OrderRecord = {
  id: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string | Date | null;
};

type Stats = {
  processed: number;
  updated: number;
  skippedMissing: number;
  skippedUnchanged: number;
  errors: number;
};

const DEFAULT_OPTIONS: Options = {
  pageSize: 50,
  concurrency: 3,
  dryRun: false,
  keys: [],
  removeAll: false,
};

export default async function clearOrderMetadata({
  container,
  args,
}: ExecArgs): Promise<void> {
  const logger = container.resolve<Logger>("logger");
  const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);

  const options = parseOptions(args ?? []);

  if (!options.removeAll && options.keys.length === 0) {
    logger.warn(
      `[clear-order-metadata] No keys provided and --all not set. Nothing to do. Args: ${
        args?.join(" ") ?? "<none>"
      }`
    );
    return;
  }

  const filters = buildFilters(options);
  const total = await countOrders(orderService, filters);

  logger.info(
    `[clear-order-metadata] Starting (total orders in range: ${total}, pageSize=${
      options.pageSize
    }, concurrency=${options.concurrency}, dryRun=${
      options.dryRun
    }, removeAll=${options.removeAll}, keys=${options.keys.join(",")})`
  );

  let offset = 0;
  const stats: Stats = {
    processed: 0,
    updated: 0,
    skippedMissing: 0,
    skippedUnchanged: 0,
    errors: 0,
  };

  while (true) {
    const orders = await fetchOrderBatch(
      orderService,
      filters,
      options.pageSize,
      offset
    );
    if (!orders.length) {
      break;
    }

    await runWithConcurrency(orders, options.concurrency, async (order) => {
      try {
        const result = await processOrder(order, orderService, options, logger);
        stats.processed += 1;
        stats[result] += 1;
      } catch (err) {
        stats.errors += 1;
        const error = err as Error;
        logger.error(
          `[clear-order-metadata] Failed to process order ${order.id}: ${error.message}`
        );
      }
    });

    offset += orders.length;

    if (options.maxOrders && stats.processed >= options.maxOrders) {
      logger.info(
        `[clear-order-metadata] Reached maxOrders=${options.maxOrders}; stopping early.`
      );
      break;
    }

    if (orders.length < options.pageSize) {
      break;
    }
  }

  logger.info(
    `[clear-order-metadata] Completed. updated=${stats.updated}, skippedMissing=${stats.skippedMissing}, skippedUnchanged=${stats.skippedUnchanged}, errors=${stats.errors}`
  );
}

function parseOptions(rawArgs: string[]): Options {
  const options: Options = { ...DEFAULT_OPTIONS };
  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--all") {
      options.removeAll = true;
      continue;
    }

    // Support --keys=a,b or --keys a,b
    if (arg === "--keys") {
      const next = rawArgs[i + 1];
      if (next && !next.startsWith("--")) {
        options.keys = parseKeyList(next);
        i += 1;
      }
      continue;
    }

    const trimmed = arg.startsWith("--") ? arg.slice(2) : arg;

    const [rawKey, rawValue] = trimmed.split("=");
    const key = rawKey ?? "";
    const value = rawValue ?? "";

    if (!key) {
      continue;
    }

    switch (key) {
      case "keys": {
        if (value) {
          options.keys = parseKeyList(value);
        }
        break;
      }
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

  // Env fallbacks if CLI args didn’t specify
  if (!options.removeAll && options.keys.length === 0) {
    const envKeys = process.env.CLEAR_ORDER_METADATA_KEYS;
    if (envKeys) {
      options.keys = parseKeyList(envKeys);
    }
    if (process.env.CLEAR_ORDER_METADATA_ALL === "1") {
      options.removeAll = true;
    }
  }

  return options;
}

function parseKeyList(value: string): string[] {
  return value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function buildFilters(options: Options): FilterableOrderProps {
  const filters: FilterableOrderProps = {};
  if (options.after || options.before) {
    const createdAt: { $gt?: string; $lt?: string } = {};
    if (options.after) createdAt.$gt = options.after;
    if (options.before) createdAt.$lt = options.before;
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
  orderService: IOrderModuleService,
  filters: FilterableOrderProps,
  pageSize: number,
  offset: number
): Promise<OrderRecord[]> {
  const [orders] = await orderService.listAndCountOrders(filters, {
    select: ["id", "metadata", "created_at"],
    take: pageSize,
    skip: offset,
    order: { created_at: "ASC" },
  });

  return orders as unknown as OrderRecord[];
}

async function processOrder(
  order: OrderRecord,
  orderService: IOrderModuleService,
  options: Options,
  logger: Logger
): Promise<keyof Stats> {
  const metadata = (order.metadata as Record<string, unknown> | null) ?? null;

  if (!metadata || Object.keys(metadata).length === 0) {
    return "skippedMissing";
  }

  let updated: Record<string, unknown> = {};
  const removedKeys: string[] = [];

  if (options.removeAll) {
    updated = {};
  } else {
    updated = { ...metadata };
    for (const key of options.keys) {
      if (key in updated) {
        delete (updated as any)[key];
        removedKeys.push(key);
      }
    }
  }

  const changed = Object.keys(updated).length !== Object.keys(metadata).length;
  if (!changed) {
    return "skippedUnchanged";
  }

  if (!options.dryRun) {
    const metadataPayload = options.removeAll
      ? null
      : {
          ...updated,
          // Ensure removal even if the service merges metadata by overriding removed keys with null.
          ...Object.fromEntries(removedKeys.map((k) => [k, null])),
        };

    await orderService.updateOrders([
      {
        id: order.id,
        metadata: metadataPayload,
      } as any,
    ]);
  }

  return "updated";
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
