import { OrdersAnalysisService } from "./services";
import { OrderKPI, Connection, TopVariant } from "../../types";
import { ProductsAnalysisService } from "./services/products.service";
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

  async getOrderKPIs(fromDate: string, toDate: string): Promise<OrderKPI[]> {
    return await this.ordersAnalysisService.getOrderKPIs(fromDate, toDate);
  }
  async getProductVariants(fromDate: string, toDate: string): Promise<TopVariant[]> {
    return await this.productsAnalysisService.getProductVariants(fromDate, toDate);
  }
}

export default AnalysisModuleService;
