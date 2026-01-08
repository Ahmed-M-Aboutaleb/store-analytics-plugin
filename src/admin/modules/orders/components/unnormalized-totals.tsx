import { Badge, Text } from "@medusajs/ui";
import { formatMoney } from "../../../../utils/money";

const UnnormalizedTotals = ({
  totals,
}: {
  totals: { currency: string; amount: number; net: number }[];
}) => (
  <div className="rounded-md bg-ui-bg-subtle p-3 text-xs">
    <Text className="font-medium mb-2 text-ui-fg-base">
      Totals by Original Currency:
    </Text>
    <div className="flex flex-wrap gap-2">
      {totals.map((t) => (
        <Badge key={t.currency} color="grey" className="tabular-nums">
          {t.currency}: {formatMoney(t.amount, t.currency)} (Net:{" "}
          {formatMoney(t.net, t.currency)})
        </Badge>
      ))}
    </div>
  </div>
);

export default UnnormalizedTotals;
