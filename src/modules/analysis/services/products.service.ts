import { Connection, TopVariant } from "../../../types";

type InjectedDependencies = {
  __pg_connection__: Connection;
};

class ProductsAnalysisService {
  protected connection: Connection;
  constructor({ __pg_connection__ }: InjectedDependencies) {
    this.connection = __pg_connection__;
  }
  async getProductVariants(
    fromDate: string,
    toDate: string
  ): Promise<TopVariant[]> {
    // db logic here
    return [];
  }
}

export { ProductsAnalysisService };
