import { OrdersAnalysisService } from "./services";
import {
  OrderKPI,
  Connection,
  CurrencySelector,
  CurrencyNormalizationService,
} from "../../types";
import { MedusaRequest } from "@medusajs/framework";
import { fawazAhmedConverter } from "../../utils/fawaz-converter";
type InjectedDependencies = {
  ordersAnalysisService: OrdersAnalysisService;
  __pg_connection__: Connection;
};
class AnalysisModuleService {
  protected ordersAnalysisService: OrdersAnalysisService;
  protected __pg_connection__: Connection;
  constructor({
    ordersAnalysisService,
    __pg_connection__,
  }: InjectedDependencies) {
    this.ordersAnalysisService = ordersAnalysisService;
    this.__pg_connection__ = __pg_connection__;
  }

  async getOrderKPIs(
    fromDate: string,
    toDate: string,
    currency: CurrencySelector,
    converter: CurrencyNormalizationService | null
  ): Promise<OrderKPI[]> {
    return await this.ordersAnalysisService.getOrderKPIs(
      fromDate,
      toDate,
      currency,
      converter
    );
  }

  async getOrdersSeries(fromDate: string, toDate: string) {
    return await this.ordersAnalysisService.getOrdersSeries(fromDate, toDate);
  }

  async getOrdersCountrySummary(fromDate: string, toDate: string) {
    return await this.ordersAnalysisService.getOrdersCountrySummary(
      fromDate,
      toDate
    );
  }

  resolveCurrencyConverter(
    scope: MedusaRequest["scope"],
    currency: CurrencySelector
  ): CurrencyNormalizationService | null {
    if (currency === "original") {
      return null;
    }

    try {
      return scope.resolve<CurrencyNormalizationService>(
        "currencyNormalizationService"
      );
    } catch {
      return fawazAhmedConverter;
    }
  }
}

export default AnalysisModuleService;
