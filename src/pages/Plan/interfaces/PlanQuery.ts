import { PlanData } from "./PlanForm";

export interface Plans {
  meta: Record<any, any>;
  items: PlanData[];
}

export interface PlanQuery {
  page: number;
  size: number;
  order_by: string;
  order_dir: string;
  search?: string;
  status?: string;
  is_root?: string;
}
