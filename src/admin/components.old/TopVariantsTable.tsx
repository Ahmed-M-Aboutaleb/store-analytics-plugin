import { Table, Text } from "@medusajs/ui";
import { useMemo } from "react";
import { useGlobalAnalyticsData } from "../providers/data-provider.old";
import { createCurrencyFormatter } from "../../utils.old"; // Adjust path
import { useAnalyticsDate } from "../providers/analytics-date-provider.old";

const TopVariantsTable = () => {
  const { productsData } = useGlobalAnalyticsData();
  const { currency } = useAnalyticsDate();

  const variants = productsData?.top_variants || [];

  const currencyFormatter = useMemo(
    () => createCurrencyFormatter(currency === "original" ? "USD" : currency),
    [currency]
  );

  if (!variants.length) {
    return (
      <div className="py-4 text-center">
        <Text className="text-ui-fg-subtle">
          No variants found for this period.
        </Text>
      </div>
    );
  }

  return (
    <Table>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>Variant Title</Table.HeaderCell>
          <Table.HeaderCell>Product</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Sold</Table.HeaderCell>
          <Table.HeaderCell className="text-right">Revenue</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {variants.map((variant) => (
          <Table.Row key={variant.variant_id}>
            <Table.Cell>
              <Text size="small" weight="plus">
                {variant.variant_title}
              </Text>
            </Table.Cell>
            <Table.Cell>
              <Text size="small" className="text-ui-fg-subtle">
                {variant.product_title}
              </Text>
            </Table.Cell>
            <Table.Cell className="text-right">{variant.quantity}</Table.Cell>
            <Table.Cell className="text-right">
              {currencyFormatter.format(variant.revenue)}
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );
};

export default TopVariantsTable;
