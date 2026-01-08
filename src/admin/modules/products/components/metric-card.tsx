import { ChartPie } from "@medusajs/icons";
import Surface from "../../dashboard/components/surface";
import { Text } from "@medusajs/ui";

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
}

function MetricCard({ value, label, icon = <ChartPie /> }: MetricCardProps) {
  return (
    <Surface className="w-full max-w-[250px]">
      <div className="flex items-start justify-between">
        {/* Left side: Icon and value */}
        <div className="flex items-start gap-4">
          <div className="text-ui-fg-base mt-1">{icon}</div>
          <div>
            <Text size="base" weight="plus" className="text-ui-fg-base">
              {label}
            </Text>
            <Text size="large" weight="plus" className="text-ui-fg-base">
              {value}
            </Text>
          </div>
        </div>
      </div>
    </Surface>
  );
}

export default MetricCard;
