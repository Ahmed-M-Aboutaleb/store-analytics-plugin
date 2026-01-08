import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  getOrdersKPIsStep,
  GetOrdersKPIsWorkflowInput,
} from "./steps/get-kpis";
import { OrderDTO, OrderLineItemDTO } from "@medusajs/framework/types";
import { CurrencySelector } from "../../types";
import { getOrdersSeriesStep } from "./steps/get-series";

type GetOrdersAnalysisWorkflowOutput = {
  fromDate: string;
  toDate: string;
  currencyCode: CurrencySelector;
};

const ORDERS: OrderDTO[] = [
  {
    id: "order_01JSNXDH9BPJWWKVW03B9E9KW8",
    metadata: {
      payment_gateway_fee: 200,
      payment_gateway_currency: "aed",
    },
    display_id: 1001,
    version: 1,
    status: "pending",
    email: "customer@example.com",
    currency_code: "usd",
    region_id: "reg_01JSNXD6VQC1YH56E4TGC81NWX",
    customer_id: "cus_01JSNXD6VQC1YH56E4TGC81NWX",
    sales_channel_id: "sc_01JSNXD6VQC1YH56E4TGC81NWX",
    total: 5500,
    subtotal: 5000,
    tax_total: 500,
    discount_total: 0,
    discount_subtotal: 0,
    discount_tax_total: 0,
    shipping_total: 0,
    shipping_subtotal: 0,
    shipping_tax_total: 0,
    original_item_total: 5000,
    original_item_subtotal: 5000,
    original_item_tax_total: 500,
    item_total: 5000,
    item_subtotal: 5000,
    item_tax_total: 500,
    original_total: 5500,
    original_tax_total: 500,
    created_at: "2024-03-15T10:00:00.000Z",
    updated_at: "2024-03-15T10:00:00.000Z",
    items: [] as OrderLineItemDTO[],
    shipping_address: {
      id: "addr_01JSNXDH9C47KZ43WQ3TBFXZA1",
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Main St",
      city: "New York",
      country_code: "us",
      postal_code: "10001",
      phone: "+15550123456",
      created_at: "2024-03-15T10:00:00.000Z",
      updated_at: "2024-03-15T10:00:00.000Z",
    },
    billing_address: {
      id: "addr_01JSNXDH9C47KZ43WQ3TBFXZA2",
      first_name: "John",
      last_name: "Doe",
      address_1: "123 Main St",
      city: "New York",
      country_code: "us",
      postal_code: "10001",
      phone: "+15550123456",
      created_at: "2024-03-15T10:00:00.000Z",
      updated_at: "2024-03-15T10:00:00.000Z",
    },
    shipping_methods: [],
    transactions: [],
    item_discount_total: "",
    original_subtotal: "",
    credit_line_total: "",
    gift_card_total: "",
    gift_card_tax_total: "",
    shipping_discount_total: "",
    original_shipping_total: "",
    original_shipping_subtotal: "",
    original_shipping_tax_total: "",
    raw_original_item_total: {
      value: "",
    },
    raw_original_item_subtotal: {
      value: "",
    },
    raw_original_item_tax_total: {
      value: "",
    },
    raw_item_total: {
      value: "",
    },
    raw_item_subtotal: {
      value: "",
    },
    raw_item_tax_total: {
      value: "",
    },
    raw_original_total: {
      value: "",
    },
    raw_original_subtotal: {
      value: "",
    },
    raw_original_tax_total: {
      value: "",
    },
    raw_total: {
      value: "",
    },
    raw_subtotal: {
      value: "",
    },
    raw_tax_total: {
      value: "",
    },
    raw_discount_total: {
      value: "",
    },
    raw_discount_tax_total: {
      value: "",
    },
    raw_credit_line_total: {
      value: "",
    },
    raw_gift_card_total: {
      value: "",
    },
    raw_gift_card_tax_total: {
      value: "",
    },
    raw_shipping_total: {
      value: "",
    },
    raw_shipping_subtotal: {
      value: "",
    },
    raw_shipping_tax_total: {
      value: "",
    },
    raw_original_shipping_total: {
      value: "",
    },
    raw_original_shipping_subtotal: {
      value: "",
    },
    raw_original_shipping_tax_total: {
      value: "",
    },
  },
];

const COUNTRYKPIS_MOCK = [
  {
    country_code: "US",
    currency: "usd",
    amount: 30000,
    fees: 1200,
    net: 28800,
  },
  {
    country_code: "IT",
    currency: "eur",
    amount: 15000,
    fees: 600,
    net: 14400,
  },
  {
    country_code: "AE",
    currency: "aed",
    amount: 10000,
    fees: 400,
    net: 9600,
  },
  {
    country_code: "FR",
    currency: "eur",
    amount: 5000,
    fees: 200,
    net: 4800,
  },
];

export const getOrdersAnalysisWorkflow = createWorkflow(
  "get-orders-kpis-workflow",
  (input: GetOrdersAnalysisWorkflowOutput) => {
    const KPIS_INPUT: GetOrdersKPIsWorkflowInput = {
      fromDate: input.fromDate,
      toDate: input.toDate,
      currencyCode: input.currencyCode,
    };
    const kpis = getOrdersKPIsStep(KPIS_INPUT);
    const series = getOrdersSeriesStep(KPIS_INPUT);
    const RESULT = {
      kpis,
      series,
      orders: ORDERS,
      country_kpis: COUNTRYKPIS_MOCK,
    };
    return new WorkflowResponse(RESULT);
  }
);
