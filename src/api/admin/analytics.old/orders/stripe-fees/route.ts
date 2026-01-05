import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { IOrderModuleService } from "@medusajs/types";
import { Modules } from "@medusajs/utils";

// Allows admins to set Stripe fee metadata on an order.
type Body = {
  order_id?: string;
  amount?: number | string;
  currency?: string;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { order_id, amount, currency } = req.body as Body;

    if (!order_id || typeof order_id !== "string") {
      return res.status(400).json({ message: "order_id is required" });
    }

    const parsedAmount =
      typeof amount === "string" ? Number(amount) : amount;
    if (!Number.isFinite(parsedAmount)) {
      return res
        .status(400)
        .json({ message: "amount must be a valid number" });
    }

    const normalizedCurrency =
      typeof currency === "string" && currency.trim().length
        ? currency.trim().toUpperCase()
        : null;
    if (!normalizedCurrency) {
      return res.status(400).json({ message: "currency is required" });
    }

    const orderService = req.scope.resolve<IOrderModuleService>(Modules.ORDER);
    const order = await orderService.retrieveOrder(order_id, {
      select: ["id", "metadata"],
    });

    const currentMetadata = (order as any).metadata as
      | Record<string, unknown>
      | null
      | undefined;
    const nextMetadata = {
      ...(currentMetadata ?? {}),
      stripe_fee_amount: parsedAmount,
      stripe_fee_currency: normalizedCurrency,
    } as Record<string, unknown>;

    await orderService.updateOrders([
      {
        id: order_id,
        metadata: nextMetadata,
      },
    ]);

    return res.status(200).json({
      order_id,
      stripe_fee_amount: parsedAmount,
      stripe_fee_currency: normalizedCurrency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return res.status(400).json({ message });
  }
}
