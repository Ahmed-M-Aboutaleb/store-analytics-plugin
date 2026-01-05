import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework";
import { Modules } from "@medusajs/framework/utils";
import { IPaymentModuleService } from "@medusajs/framework/types";
import Stripe from "stripe";

type PaymentCapturedEvent = {
  id: string; // Payment ID
};

export default async function stripeFeeHandler({
  event: { data },
  container,
}: SubscriberArgs<PaymentCapturedEvent>) {
  const paymentId = data.id;
  const logger = container.resolve("logger");

  try {
    const paymentModule = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    );

    const stripeKey = process.env.STRIPE_API_KEY;

    if (!stripeKey) {
      logger.warn(
        `[stripe-fee] STRIPE_API_KEY not found. Skipping fee capture for payment ${paymentId}.`
      );
      return;
    }

    const payment = await paymentModule.retrievePayment(paymentId, {
      select: ["id", "data", "metadata", "provider_id"],
    });

    const existingMetadata = (payment as any).metadata || {};

    if (!payment.provider_id.includes("stripe")) {
      return;
    }

    const stripe = new Stripe(stripeKey);

    // Extract stripe transaction ID
    let chargeId: string | undefined;

    const paymentData = payment.data as any;

    if (typeof paymentData === "object" && paymentData !== null) {
      if (paymentData.latest_charge) {
        chargeId = paymentData.latest_charge as string;
      } else if (paymentData.id && String(paymentData.id).startsWith("ch_")) {
        chargeId = paymentData.id;
      } else if (paymentData.id && String(paymentData.id).startsWith("pi_")) {
        const pi = await stripe.paymentIntents.retrieve(paymentData.id, {
          expand: ["latest_charge"],
        });
        const charge = pi.latest_charge as Stripe.Charge;
        chargeId = charge?.id;
      }
    }

    if (!chargeId) {
      logger.warn(
        `[stripe-fee] Could not resolve Stripe Charge ID for payment ${paymentId}`
      );
      return;
    }

    const charge = await stripe.charges.retrieve(chargeId, {
      expand: ["balance_transaction"],
    });

    const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

    if (!balanceTx) {
      logger.warn(
        `[stripe-fee] No balance transaction found for charge ${chargeId}`
      );
      return;
    }

    // Update payment metadata
    await paymentModule.updatePayment({
      id: paymentId,
      metadata: {
        ...existingMetadata,
        stripe_fee_amount: balanceTx.fee,
        stripe_fee_currency: balanceTx.currency,
        stripe_gross_amount: balanceTx.amount,
        stripe_net_amount: balanceTx.net,
      },
    } as any);

    logger.info(
      `[stripe-fee] Successfully captured Stripe fee (${balanceTx.fee} ${balanceTx.currency}) for payment ${paymentId}`
    );
  } catch (error) {
    const err = error as Error;
    logger.error(
      `[stripe-fee] Failed to capture Stripe fee for payment ${paymentId}: ${err.message}`
    );
  }
}

export const config: SubscriberConfig = {
  event: "payment.captured",
};
