import { useEffect, useMemo, useState } from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types";
import { Badge, Button, Input, Label, Text } from "@medusajs/ui";

const PaymentGatewayFeeEditorWidget = ({
  data: order,
}: DetailWidgetProps<AdminOrder>) => {
  const currentFee = useMemo(() => {
    const meta = (order as any)?.metadata as Record<string, unknown> | null;
    const rawAmount =
      (meta?.stripe_fee_amount as number | string | undefined) ??
      (meta?.stripe_fee as number | string | undefined) ??
      (meta?.stripe_fees as number | string | undefined);
    const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
    const currencyRaw =
      (meta?.stripe_fee_currency as string | undefined) ??
      (meta?.stripe_currency as string | undefined) ??
      (meta?.stripe_fees_currency as string | undefined) ??
      (order.currency_code as string | undefined);
    return {
      amount: Number.isFinite(amount) ? amount : null,
      currency: currencyRaw ? currencyRaw.toUpperCase() : null,
    };
  }, [order]);

  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentFee.amount !== null && currentFee.amount !== undefined) {
      setAmount(String(currentFee.amount));
    }
    if (currentFee.currency) {
      setCurrency(currentFee.currency);
    }
  }, [currentFee.amount, currentFee.currency]);

  const isValid = useMemo(() => {
    const parsed = Number(amount);
    return order?.id && Number.isFinite(parsed) && currency.trim().length > 0;
  }, [order?.id, amount, currency]);

  const handleSave = async () => {
    if (!isValid || !order?.id) return;
    setSaving(true);
    setStatus("idle");
    setMessage(null);
    try {
      await fetch("/admin/analytics/orders/stripe-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          amount: Number(amount),
          currency: currency.trim().toUpperCase(),
        }),
      });
      setStatus("success");
      setMessage("Stripe fees saved. Refresh to see updated values.");
    } catch (err) {
      setStatus("error");
      const text = err instanceof Error ? err.message : "Failed to save";
      setMessage(text);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-md bg-ui-bg-subtle">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Payment Gateway Fees</h3>
          <p className="text-sm text-ui-fg-subtle">
            Edit metadata.stripe_fee_amount and metadata.stripe_fee_currency for this order.
          </p>
        </div>
        {saving && <Badge color="blue">Saving</Badge>}
        {status === "success" && <Badge color="green">Saved</Badge>}
        {status === "error" && <Badge color="red">Error</Badge>}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="stripe-fee-amount">Fee Amount</Label>
          <Input
            id="stripe-fee-amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="stripe-fee-currency">Currency</Label>
          <Input
            id="stripe-fee-currency"
            value={currency}
            disabled
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            placeholder="USD"
            maxLength={3}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Current</Label>
          <Text className="text-sm text-ui-fg-subtle">
            {currentFee.amount !== null ? currentFee.amount : "—"} {currentFee.currency ?? ""}
          </Text>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button disabled={!isValid || saving} onClick={handleSave}>
          Save Stripe Fees
        </Button>
        {message && (
          <Text size="small" className="text-ui-fg-subtle">
            {message}
          </Text>
        )}
      </div>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default PaymentGatewayFeeEditorWidget;