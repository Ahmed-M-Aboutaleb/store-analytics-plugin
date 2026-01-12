import {
  OrdersAnalysisService,
  ProductsAnalysisService,
  CustomersAnalysisService,
} from "./services";
import {
  OrderKPI,
  Connection,
  CurrencySelector,
  CurrencyNormalizationService,
  TopVariant,
  CustomersKPI,
} from "../../types";
import { MedusaRequest } from "@medusajs/framework";
import { fawazAhmedConverter } from "../../utils/fawaz-converter";
type InjectedDependencies = {
  ordersAnalysisService: OrdersAnalysisService;
  productsAnalysisService: ProductsAnalysisService;
  customersAnalysisService: CustomersAnalysisService;
  __pg_connection__: Connection;
};
class AnalysisModuleService {
  protected ordersAnalysisService: OrdersAnalysisService;
  protected productsAnalysisService: ProductsAnalysisService;
  protected customersAnalysisService: CustomersAnalysisService;
  protected __pg_connection__: Connection;
  constructor({
    ordersAnalysisService,
    productsAnalysisService,
    customersAnalysisService,
    __pg_connection__,
  }: InjectedDependencies) {
    this.ordersAnalysisService = ordersAnalysisService;
    this.productsAnalysisService = productsAnalysisService;
    this.customersAnalysisService = customersAnalysisService;
    this.__pg_connection__ = __pg_connection__;
  }

  /* ORDERS */

  async getOrderKPIs(
    fromDate: string,
    toDate: string,
    currency: CurrencySelector,
    converter: CurrencyNormalizationService | null,
    allowedStatuses: string[] = ["completed", "pending"]
  ): Promise<OrderKPI[]> {
    return await this.ordersAnalysisService.getOrderKPIs(
      fromDate,
      toDate,
      currency,
      converter,
      allowedStatuses
    );
  }

  async getOrdersSeries(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"]
  ) {
    return await this.ordersAnalysisService.getOrdersSeries(
      fromDate,
      toDate,
      allowedStatuses
    );
  }

  async getOrdersCountrySummary(
    fromDate: string,
    toDate: string,
    allowedStatuses: string[] = ["completed", "pending"]
  ) {
    return await this.ordersAnalysisService.getOrdersCountrySummary(
      fromDate,
      toDate,
      allowedStatuses
    );
  }

  /* PRODUCTS */

  async getProductVariants(
    fromDate: string,
    toDate: string
  ): Promise<TopVariant[]> {
    return await this.productsAnalysisService.getProductVariants(
      fromDate,
      toDate
    );
  }

  /* CUSTOMERS */

  async getCustomersKPIs(
    fromDate: string,
    toDate: string
  ): Promise<CustomersKPI> {
    return await this.customersAnalysisService.getCustomersKPIs(
      fromDate,
      toDate
    );
  }
  async getCustomersSeries(fromDate: string, toDate: string) {
    return await this.customersAnalysisService.getCustomersSeries(
      fromDate,
      toDate
    );
  }

  /* UTILITIES */

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
