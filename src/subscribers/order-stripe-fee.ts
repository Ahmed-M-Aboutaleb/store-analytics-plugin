import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { IOrderModuleService, Logger } from "@medusajs/framework/types";
import Stripe from "stripe";

type OrderPlacedEvent = {
  id: string; // Order ID
};

async function resolveChargeId(paymentData: any, stripe: Stripe) {
  if (typeof paymentData === "object" && paymentData !== null) {
    if (paymentData.latest_charge) {
      return paymentData.latest_charge as string;
    }
    if (paymentData.id && String(paymentData.id).startsWith("ch_")) {
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

export default async function orderStripeFeeHandler({
  event: { data },
  container,
}: SubscriberArgs<OrderPlacedEvent>) {
  const orderId = data.id;
  const logger = container.resolve<Logger>("logger");

  const stripeKey = process.env.STRIPE_API_KEY;

  if (!stripeKey) {
    logger.warn(
      `[stripe-fee] STRIPE_API_KEY not found. Skipping fee capture for order ${orderId}.`
    );
    return;
  }

  const stripe = new Stripe(stripeKey);

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);

    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "payment_collections.id",
        "payment_collections.payments.id",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.data",
        "payment_collections.payments.metadata",
      ],
      filters: { id: orderId },
    });

    const order = orders?.[0];
    if (!order) {
      logger.warn(
        `[stripe-fee] Order ${orderId} not found when capturing fees.`
      );
      return;
    }

    const payments = (order.payment_collections ?? [])
      .flatMap((pc: any) => pc?.payments ?? [])
      .filter(Boolean);

    const stripePayments = payments.filter(
      (payment: any) =>
        typeof payment.provider_id === "string" &&
        payment.provider_id.includes("stripe")
    );

    if (!stripePayments.length) {
      logger.warn(
        `[stripe-fee] No Stripe payments found for order ${orderId}. Skipping fee capture.`
      );
      return;
    }

    let feeTotal = 0;
    let grossTotal = 0;
    let netTotal = 0;
    let feeCurrency: string | null = null;

    for (const payment of stripePayments) {
      const chargeId = await resolveChargeId(payment.data, stripe);
      if (!chargeId) {
        logger.warn(
          `[stripe-fee] Could not resolve Stripe Charge ID for payment ${payment.id} on order ${orderId}`
        );
        continue;
      }

      const charge = await stripe.charges.retrieve(chargeId, {
        expand: ["balance_transaction"],
      });

      const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;
      if (!balanceTx) {
        logger.warn(
          `[stripe-fee] No balance transaction found for charge ${chargeId} (order ${orderId})`
        );
        continue;
      }

      feeTotal += balanceTx.fee ?? 0;
      grossTotal += balanceTx.amount ?? 0;
      netTotal += balanceTx.net ?? 0;

      const txCurrency = balanceTx.currency?.toUpperCase?.() ?? null;
      if (txCurrency && !feeCurrency) {
        feeCurrency = txCurrency;
      } else if (txCurrency && feeCurrency && feeCurrency !== txCurrency) {
        logger.warn(
          `[stripe-fee] Multiple fee currencies detected for order ${orderId}; keeping ${feeCurrency}`
        );
      }
    }

    if (!feeCurrency) {
      logger.warn(
        `[stripe-fee] Could not determine Stripe fee currency for order ${orderId}. Skipping update.`
      );
      return;
    }

    const existingOrder = await orderService.retrieveOrder(orderId, {
      select: ["id", "metadata"],
    });
    const existingMetadata = (existingOrder as any).metadata ?? {};

    await orderService.updateOrders([
      {
        id: orderId,
        metadata: {
          ...existingMetadata,
          stripe_fee_amount: feeTotal,
          stripe_fee_currency: feeCurrency,
          stripe_fees: feeTotal,
          stripe_gross_amount: grossTotal,
          stripe_net_amount: netTotal,
        },
      } as any,
    ]);

    logger.info(
      `[stripe-fee] Captured Stripe fees (${feeTotal} ${feeCurrency}) for order ${orderId}`
    );
  } catch (error) {
    const err = error as Error;
    logger.error(
      `[stripe-fee] Failed to capture Stripe fees for order ${orderId}: ${err.message}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
