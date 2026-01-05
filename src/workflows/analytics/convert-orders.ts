import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";

import { CurrencySelector, OrdersResponse } from "../../types";
import { resolveConverter } from "../../utils/converter";
import { convertOrderAmounts } from "../../utils/conversions";

export type ConvertOrdersInput = {
  orders: OrdersResponse["orders"]["data"];
  currency: CurrencySelector;
};

export type ConvertOrdersOutput = {
  orders: OrdersResponse["orders"]["data"];
  warnings: string[];
};

export const convertOrdersStep = createStep(
  "convert-orders",
  async (input: ConvertOrdersInput, { container }) => {
    const warnings: string[] = [];
    const converter = resolveConverter(
      container as any,
      input.currency,
      warnings
    );

    if (!converter || input.currency === "original") {
      return new StepResponse<ConvertOrdersOutput>({
        orders: input.orders,
        warnings,
      });
    }

    const converted = await Promise.all(
      input.orders.map(async (order) => {
        const orderDate = new Date(order.created_at);
        return convertOrderAmounts(order, input.currency, converter, orderDate);
      })
    );

    return new StepResponse<ConvertOrdersOutput>({
      orders: converted,
      warnings,
    });
  }
);

const convertOrdersWorkflow = createWorkflow(
  "convert-orders",
  (input: ConvertOrdersInput) => {
    const result = convertOrdersStep(input);
    return new WorkflowResponse(result);
  }
);

export default convertOrdersWorkflow;
