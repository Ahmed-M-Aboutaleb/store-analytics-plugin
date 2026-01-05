import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { FilterableOrderProps, IOrderModuleService } from "@medusajs/types";
import { Modules } from "@medusajs/utils";

import { fetchOrdersPage } from "../../utils/fetch-orders";

export type OrdersPageInput = {
  filters: FilterableOrderProps;
  limit: number;
  offset: number;
};

export const fetchOrdersPageStep = createStep(
  "fetch-orders-page",
  async (input: OrdersPageInput, { container }) => {
    const orderService = container.resolve<IOrderModuleService>(Modules.ORDER);
    const result = await fetchOrdersPage(
      orderService,
      input.filters,
      input.limit,
      input.offset
    );

    return new StepResponse(result);
  }
);

const ordersPageWorkflow = createWorkflow(
  "orders-page",
  (input: OrdersPageInput) => {
    const page = fetchOrdersPageStep(input);
    return new WorkflowResponse(page);
  }
);

export default ordersPageWorkflow;
