import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import StoreAnalyticsModuleService from "../../modules/store-analytics/service";
import { STORE_ANALYTICS_MODULE } from "../../modules/store-analytics";

export type OrdersKpisInput = {
  from: Date | string;
  to: Date | string;
};

export const fetchOrdersKpisStep = createStep(
  "fetch-orders-kpis",
  async (input: OrdersKpisInput, { container }) => {
    const storeAnalytics = container.resolve<StoreAnalyticsModuleService>(
      STORE_ANALYTICS_MODULE
    );

    const from = new Date(input.from);
    const to = new Date(input.to);
    const result = await storeAnalytics.getOrdersKpis(from, to);

    return new StepResponse(result);
  }
);

const ordersKpisWorkflow = createWorkflow(
  "orders-kpis",
  (input: OrdersKpisInput) => {
    const kpis = fetchOrdersKpisStep(input);
    return new WorkflowResponse(kpis);
  }
);

export default ordersKpisWorkflow;
