import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import Stripe from "stripe";
import { ANALYSIS_MODULE } from "../modules/analysis";
import AnalysisModuleService from "../modules/analysis/service";

// --- Types ---
type OrderWithPayments = {
  id: string;
  currency_code: string;
  payment_collections: {
    payments: {
      id: string;
      provider_id: string;
      data: Record<string, any>;
    }[];
  }[];
};

type StripeFeeResult = {
  amount: number;
  currency: string;
};

// --- Main Handler ---
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger");
  const orderId = data.id;

  try {
    // 1. Fetch Order Data
    const order = await fetchOrderWithPayments(container, orderId);
    if (!order) {
      logger.warn(`[stripe-fee-sync] Order ${orderId} not found.`);
      return;
    }

    // 2. Validate Stripe Config
    const apiKey = process.env.STRIPE_API_KEY;
    if (!apiKey) {
      logger.warn(`[stripe-fee-sync] STRIPE_API_KEY is not set.`);
      return;
    }

    // 3. Find Stripe Payment ID
    const stripePaymentId = extractStripePaymentId(order);
    if (!stripePaymentId) {
      logger.info(
        `[stripe-fee-sync] No Stripe payment found for order ${orderId}`
      );
      return;
    }

    // 4. Fetch Fee from Stripe
    const stripe = new Stripe(apiKey, { apiVersion: "2023-10-16" as any });
    const feeData = await fetchStripeFee(stripe, stripePaymentId);

    if (!feeData) {
      logger.warn(
        `[stripe-fee-sync] No fee data found for payment ${stripePaymentId}`
      );
      return;
    }

    logger.info(
      `[stripe-fee-sync] Retrieved fee: ${feeData.amount} ${feeData.currency}`
    );

    // 5. Process & Convert Fee
    const finalFee = await processFeeCurrency(container, order, feeData);

    // 6. Save to Order Metadata
    const orderModuleService = container.resolve(Modules.ORDER);
    await orderModuleService.updateOrders(order.id, {
      metadata: {
        payment_gateway_fee: finalFee.amount,
        payment_gateway_currency: finalFee.currency,
      },
    });

    logger.info(
      `[stripe-fee-sync] Successfully saved fee for order ${orderId}`
    );
  } catch (error) {
    logger.error(
      `[stripe-fee-sync] Failed to process fees for order ${orderId}: ${error}`
    );
  }
}

export const config: SubscriberConfig = {
  context: {
    subscriberId: "stripe-payment-gateway-fees-order-placed",
  },
  event: "order.placed",
};

// ==========================================
// --- Helper Functions ---
// ==========================================

/**
 * Fetches the order and its payment hierarchy via Remote Query
 */
async function fetchOrderWithPayments(
  container: any,
  orderId: string
): Promise<OrderWithPayments | null> {
  const query = container.resolve("query");
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "currency_code",
      "payment_collections.payments.id",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.data",
    ],
    filters: { id: orderId },
  });
  return order || null;
}

/**
 * Extracts the Stripe Payment Intent ID (pi_...) from the order's payments
 */
function extractStripePaymentId(order: OrderWithPayments): string | undefined {
  const payments =
    order.payment_collections?.flatMap((pc) => pc.payments) || [];

  const stripePayment = payments.find(
    (p) =>
      typeof p?.provider_id === "string" && p.provider_id.includes("stripe")
  );

  const id = stripePayment?.data?.id;
  return typeof id === "string" && id.startsWith("pi_") ? id : undefined;
}

/**
 * Interacts with Stripe API to get the Balance Transaction Fee
 */
async function fetchStripeFee(
  stripe: Stripe,
  piId: string
): Promise<StripeFeeResult | null> {
  const paymentIntent = await stripe.paymentIntents.retrieve(piId, {
    expand: ["latest_charge.balance_transaction"],
  });

  const charge = paymentIntent.latest_charge as unknown as Stripe.Charge | null;

  // Resolve Balance Transaction (it might be an expanded object or just an ID string)
  let balanceTx: Stripe.BalanceTransaction | null = null;

  if (
    charge?.balance_transaction &&
    typeof charge.balance_transaction !== "string"
  ) {
    balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;
  } else if (typeof charge?.balance_transaction === "string") {
    balanceTx = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction
    );
  }

  if (!balanceTx?.fee || !balanceTx?.currency) {
    return null;
  }

  return {
    amount: balanceTx.fee / 100, // Convert cents to whole units
    currency: balanceTx.currency.toUpperCase(),
  };
}

/**
 * Handles currency conversion logic if the fee currency differs from order currency
 */
async function processFeeCurrency(
  container: any,
  order: OrderWithPayments,
  fee: StripeFeeResult
): Promise<StripeFeeResult> {
  const logger = container.resolve("logger");

  // If currencies match, return original
  if (fee.currency === order.currency_code) {
    return fee;
  }

  // Attempt Conversion
  try {
    const analysisModule: AnalysisModuleService =
      container.resolve(ANALYSIS_MODULE);
    const converter = analysisModule.resolveCurrencyConverter(container, "AED");

    if (converter) {
      logger.info(
        `[stripe-fee-sync] Converting fee from ${fee.currency} to ${order.currency_code}`
      );

      const convertedAmount = await converter.convert(
        fee.amount,
        fee.currency.toLowerCase(),
        order.currency_code.toLowerCase(),
        new Date()
      );

      return {
        amount: convertedAmount,
        currency: order.currency_code,
      };
    }
  } catch (err) {
    logger.warn(
      `[stripe-fee-sync] Conversion failed. Saving in original currency. Error: ${err}`
    );
  }

  // Fallback to original
  return fee;
}
