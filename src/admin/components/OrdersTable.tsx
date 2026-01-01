import { useMemo } from "react";
import { Badge, Button, Divider, Text } from "@medusajs/ui";
import { ChevronLeft, ChevronRight } from "@medusajs/icons";
import {
	ALLOWED_CURRENCIES,
	CurrencySelector,
} from "../../api/admin/analytics/orders/types";
import { formatCurrency } from "../../utils/money";
import { useAnalyticsDate } from "../providers/analytics-date-provider";
import { useGlobalAnalyticsData } from "../providers/data-provider";

type MoneyKey = "subtotal" | "tax_total" | "total" | "stripe_fees";

const toTitle = (value: string) =>
	value
		.split("-")
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");

const OrdersTable = () => {
	const { currency, setCurrency } = useAnalyticsDate();
	const {
		ordersData,
		loading,
		error,
		refreshOrdersData,
		limit,
		offset,
	} = useGlobalAnalyticsData();

	const orders = ordersData?.orders.data ?? [];
	const total = ordersData?.orders.count ?? 0;
	const currentLimit = Math.max(1, ordersData?.orders.limit ?? limit ?? 10);
	const currentOffset = ordersData?.orders.offset ?? offset ?? 0;

	const totalPages = Math.max(1, Math.ceil(total / currentLimit));
	const currentPage = Math.min(totalPages, Math.floor(currentOffset / currentLimit) + 1);
	const start = total === 0 ? 0 : currentOffset + 1;
	const end = total === 0 ? 0 : Math.min(total, currentOffset + currentLimit);

	const formatDate = (value: Date | string | number) => {
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return "—";
		return new Intl.DateTimeFormat(undefined, {
			year: "numeric",
			month: "short",
			day: "2-digit",
		}).format(d);
	};

	const formatMoney = (amount: number | null | undefined, code?: string | null) => {
		if (amount === null || amount === undefined) {
			return "—";
		}
		return formatCurrency(amount, code ?? "USD", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	const resolveMoney = (
		order: (typeof orders)[number],
		key: MoneyKey
	): { value: number | null | undefined; currency: string | null | undefined } => {
		const isConverted = ordersData?.currency !== "original";
		if (isConverted && order.converted) {
			return {
				value: order.converted[key],
				currency: order.converted.currency,
			};
		}

		if (key === "subtotal") {
			return { value: order.subtotal, currency: order.currency_code };
		}
		if (key === "tax_total") {
			return { value: order.tax_total, currency: order.currency_code };
		}
		if (key === "total") {
			return { value: order.total, currency: order.currency_code };
		}
		return {
			value: order.stripe_fees,
			currency: order.stripe_fees_currency ?? order.currency_code,
		};
	};

	const handlePrev = () => {
		const nextOffset = Math.max(0, currentOffset - currentLimit);
		if (nextOffset === currentOffset) return;
		refreshOrdersData({ offset: nextOffset });
	};

	const handleNext = () => {
		const nextOffset = currentOffset + currentLimit;
		if (nextOffset >= total) return;
		refreshOrdersData({ offset: nextOffset });
	};

	const currencyLabel = useMemo(() => toTitle(currency), [currency]);

	const countryNames = useMemo(
		() => new Intl.DisplayNames(undefined, { type: "region" }),
		[]
	);

	const formatCountry = (code?: string | null) => {
		if (!code) return "—";
		const upper = code.toUpperCase();
		const name = countryNames.of(upper);
		if (name && name !== upper) {
			return `${name} (${upper})`;
		}
		return upper;
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-2">
					<Text size="small" weight="plus" className="text-ui-fg-subtle">
						Orders
					</Text>
					{loading && <Badge color="blue">Loading</Badge>}
					{error && <Badge color="red">Error</Badge>}
				</div>
				<div className="flex items-center gap-2">
					<Text size="small" className="text-ui-fg-subtle">
						Currency
					</Text>
					<select
						className="rounded-md border border-ui-border-base bg-ui-bg-subtle px-2 py-1 text-sm"
						value={currency}
						onChange={(e) => setCurrency(e.target.value as CurrencySelector)}
						disabled={loading}
					>
						{ALLOWED_CURRENCIES.map((c) => (
							<option key={c} value={c}>
								{toTitle(c)}
							</option>
						))}
					</select>
					<Badge color="green">
						{ordersData?.currency === "original"
							? "Original prices"
							: `Converted to ${currencyLabel}`}
					</Badge>
				</div>
			</div>

			<Divider className="my-2" />

			<div className="overflow-x-auto">
				<table className="min-w-full table-auto text-left text-sm">
					<thead className="border-b border-ui-border-base bg-ui-bg-field">
						<tr>
							<th className="px-3 py-2 font-semibold">Order ID</th>
							<th className="px-3 py-2 font-semibold">Date</th>
							<th className="px-3 py-2 font-semibold">Country</th>
							<th className="px-3 py-2 font-semibold">Subtotal (before tax)</th>
							<th className="px-3 py-2 font-semibold">Customer Tax</th>
							<th className="px-3 py-2 font-semibold">Gross</th>
							<th className="px-3 py-2 font-semibold">Stripe Fees</th>
						</tr>
					</thead>
					<tbody>
						{orders.length === 0 ? (
							<tr>
								<td className="px-3 py-4 text-ui-fg-subtle" colSpan={7}>
									{loading ? "Loading orders..." : "No orders found"}
								</td>
							</tr>
						) : (
							orders.map((order) => {
								const subtotal = resolveMoney(order, "subtotal");
								const tax = resolveMoney(order, "tax_total");
								const gross = resolveMoney(order, "total");
								const fees = resolveMoney(order, "stripe_fees");

								return (
									<tr key={order.id} className="border-b border-ui-border-base last:border-0">
										<td className="px-3 py-3 font-medium">
											{order.display_id ? `#${order.display_id}` : order.id}
										</td>
										<td className="px-3 py-3">{formatDate(order.created_at)}</td>
										<td className="px-3 py-3">
											{formatCountry(order.country_code)}
										</td>
										<td className="px-3 py-3">
											{formatMoney(subtotal.value, subtotal.currency)}
										</td>
										<td className="px-3 py-3">
											{formatMoney(tax.value, tax.currency)}
										</td>
										<td className="px-3 py-3">
											{formatMoney(gross.value, gross.currency)}
										</td>
										<td className="px-3 py-3">
											{formatMoney(fees.value, fees.currency)}
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<Text size="small" className="text-ui-fg-subtle">
					{`Showing ${start}-${end} of ${total}`}
				</Text>

				<div className="flex items-center gap-2">
					<Button
						size="small"
						variant="secondary"
						disabled={currentOffset === 0 || loading}
						onClick={handlePrev}
					>
						<ChevronLeft className="h-4 w-4" />
						Prev
					</Button>
					<Text size="small" className="text-ui-fg-subtle">
						Page {currentPage} of {totalPages}
					</Text>
					<Button
						size="small"
						variant="secondary"
						disabled={currentOffset + currentLimit >= total || loading}
						onClick={handleNext}
					>
						Next
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
};

export default OrdersTable;
