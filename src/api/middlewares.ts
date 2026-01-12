import {
  validateAndTransformQuery,
  defineMiddlewares,
} from "@medusajs/framework/http";
import {
  AnalysisConvertCurrencyQuerySchema,
  AnalyticsCustomersQuerySchema,
  AnalyticsOrdersQuerySchema,
  AnalyticsProductsQuerySchema,
} from "./validation-schemas";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/analysis/orders",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(AnalyticsOrdersQuerySchema, {
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/analysis/convert-currency",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(AnalysisConvertCurrencyQuerySchema, {
          isList: false,
        }),
      ],
    },
    {
      matcher: "/admin/analysis/customers",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(AnalyticsCustomersQuerySchema, {
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/analysis/products",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(AnalyticsProductsQuerySchema, {
          isList: true,
        }),
      ],
    },
  ],
});
