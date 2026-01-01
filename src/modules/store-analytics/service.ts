import { Logger } from "@medusajs/framework/types";
import { OrdersAnalyticsService } from "./services";
import { PgConnectionType } from "./types";
import { OrderStatus } from "@medusajs/framework/utils";

type InjectedDependencies = {
  __pg_connection__: PgConnectionType;
  ordersAnalyticsService: OrdersAnalyticsService;
};

export default class StoreAnalyticsModuleService {
  protected ordersAnalyticsService_: OrdersAnalyticsService;
  protected logger_: Logger;
  protected pgConnection: PgConnectionType;

  constructor({
    __pg_connection__,
    ordersAnalyticsService,
  }: InjectedDependencies) {
    this.ordersAnalyticsService_ = ordersAnalyticsService;
    this.pgConnection = __pg_connection__;
  }

  // Orders
  async getOrdersCount(
    orderStatuses: OrderStatus[],
    from?: Date,
    to?: Date,
    dateRangeFromCompareTo?: Date,
    dateRangeToCompareTo?: Date
  ) {
    return this.ordersAnalyticsService_.getOrdersCount(
      orderStatuses,
      from,
      to,
      dateRangeFromCompareTo,
      dateRangeToCompareTo
    );
  }

  async getOrdersKpis(from: Date, to: Date) {
    return this.ordersAnalyticsService_.getOrdersKpis(from, to);
  }

  async getCountryTotals(from: Date, to: Date, allowedStatuses: string[]) {
    return this.ordersAnalyticsService_.getCountryTotals(
      from,
      to,
      allowedStatuses
    );
  }
}
