type CustomersKPI = {
  new_count: number;
  total_count: number;
};

type CustomersResponse = {
  series: {
    date: string;
    count: number;
  }[];
  kpis: CustomersKPI;
};

export { CustomersResponse, CustomersKPI };
