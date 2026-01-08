import { OrdersAnalysisService } from "./services";
import { OrderKPI, Connection } from "../../types";
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

  async getOrderKPIs(fromDate: string, toDate: string): Promise<OrderKPI[]> {
    return await this.ordersAnalysisService.getOrderKPIs(fromDate, toDate);
  }
}

export default AnalysisModuleService;
