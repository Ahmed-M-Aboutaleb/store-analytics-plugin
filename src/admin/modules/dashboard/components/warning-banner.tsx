import { Badge, clx } from "@medusajs/ui";

const WarningBanner = ({
  warning,
  className,
}: {
  warning: string;
  className?: string;
}) => {
  return (
    <Badge
      color="orange"
      className={clx("w-fit text-xs p-2 sm:text-sm h-fit", className)}
    >
      ⚠ {warning}
    </Badge>
  );
};
export default WarningBanner;
