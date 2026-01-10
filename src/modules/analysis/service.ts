import { OrdersAnalysisService, ProductsAnalysisService } from "./services";
import {
  OrderKPI,
  Connection,
  CurrencySelector,
  CurrencyNormalizationService,
  TopVariant,
} from "../../types";
import { MedusaRequest } from "@medusajs/framework";
import { fawazAhmedConverter } from "../../utils/fawaz-converter";
type InjectedDependencies = {
  ordersAnalysisService: OrdersAnalysisService;
  productsAnalysisService: ProductsAnalysisService;
  __pg_connection__: Connection;
};
class AnalysisModuleService {
  protected ordersAnalysisService: OrdersAnalysisService;
  protected productsAnalysisService: ProductsAnalysisService;
  protected __pg_connection__: Connection;
  constructor({
    ordersAnalysisService,
    productsAnalysisService,
    __pg_connection__,
  }: InjectedDependencies) {
    this.ordersAnalysisService = ordersAnalysisService;
    this.productsAnalysisService = productsAnalysisService;
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
  async getProductVariants(
    fromDate: string,
    toDate: string
  ): Promise<TopVariant[]> {
    return await this.productsAnalysisService.getProductVariants(
      fromDate,
      toDate
    );
  }
}

export default AnalysisModuleService;
