import {
  validateAndTransformQuery,
  defineMiddlewares,
} from "@medusajs/framework/http";
import {
  AnalysisConvertCurrencyQuerySchema,
  AnalyticsOrdersQuerySchema,
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
  ],
});
