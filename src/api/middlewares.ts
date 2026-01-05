import {
  validateAndTransformQuery,
  defineMiddlewares,
} from "@medusajs/framework/http";
import { AnalyticsOrdersQuerySchema } from "./validation-schemas";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/analytics/orders",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(AnalyticsOrdersQuerySchema, {
          isList: true,
        }),
      ],
    },
  ],
});
