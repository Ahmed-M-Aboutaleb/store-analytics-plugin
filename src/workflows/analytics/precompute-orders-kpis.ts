import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import StoreAnalyticsModuleService from "../../modules/store-analytics/service";
import { STORE_ANALYTICS_MODULE } from "../../modules/store-analytics";
import { mapToSeries } from "../../utils";

export type PrecomputeOrdersKpisInput = {
  from: Date | string;
  to: Date | string;
};

export type PrecomputeOrdersKpisOutput = {
  totals: {
    total_orders: number;
    total_sales: number;
  };
  series: {
    orders: { date: string; value: number }[];
    sales: { date: string; value: number }[];
  };
};

export const precomputeOrdersKpisStep = createStep(
  "precompute-orders-kpis",
  async (input: PrecomputeOrdersKpisInput, { container }) => {
    const storeAnalytics = container.resolve<StoreAnalyticsModuleService>(
      STORE_ANALYTICS_MODULE
    );

    const from = new Date(input.from);
    const to = new Date(input.to);
    const { totalOrders, totalSales, ordersOverTime, salesOverTime } =
      await storeAnalytics.getOrdersKpis(from, to);

    const output: PrecomputeOrdersKpisOutput = {
      totals: {
        total_orders: totalOrders,
        total_sales: totalSales,
      },
      series: {
        orders: mapToSeries(ordersOverTime),
        sales: mapToSeries(salesOverTime),
      },
    };

    return new StepResponse(output);
  }
);

const precomputeOrdersKpisWorkflow = createWorkflow(
  "precompute-orders-kpis",
  (input: PrecomputeOrdersKpisInput) => {
    const result = precomputeOrdersKpisStep(input);
    return new WorkflowResponse(result);
  }
);

export default precomputeOrdersKpisWorkflow;
