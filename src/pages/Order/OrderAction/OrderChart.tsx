import ComboQuotaChart from "../ChartOrder";
import { SlideForm } from "../SlideForm";

export interface OrderForm {
  customer_name: string;
  tax_code: string;
  contract_code: string;
  quantity: number;
  total_users: number;
  total_minute: number;
  outbound_did_by_route: Record<any, any>;
  total_price: number;
  status?: number;
  description?: string;
  slide_users: string[];
  meta: Record<any, any>;
}

interface OrderChartProps {
  form: OrderForm;
  handleChange: <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => void;
}

export const OrderChart = ({ form, handleChange }: OrderChartProps) => {
  return (
    <>
      {/* SECTION: Slide Users */}
      {form.slide_users?.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-200">
            <h3 className="text-lg font-bold text-gray-800">Danh sách mã trượt</h3>
          </div>
          <SlideForm
            value={form.slide_users as string[]}
            onChange={(updated) => handleChange("slide_users", updated)}
          />
        </div>
      )}
      
      {/* Combo Quota Chart */}
      {form.slide_users?.length > 0 && (
        <div className="mb-8">
          <ComboQuotaChart slide_user={form?.slide_users} />
        </div>
      )}
    </>
  );
};