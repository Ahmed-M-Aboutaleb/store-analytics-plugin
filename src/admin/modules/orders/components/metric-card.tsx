import { ChartPie } from "@medusajs/icons";

interface MetricCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

function MetricCard({ value, label, icon = <ChartPie /> }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        {/* Left side: Icon and value */}
        <div className="flex items-start gap-4">
          <div className="text-gray-400 mt-1">{icon}</div>
          <div>
            <p className="text-sm text-gray-400 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricCard;
