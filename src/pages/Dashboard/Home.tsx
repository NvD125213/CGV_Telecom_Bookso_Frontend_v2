import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import NumberStatusPieChart from "../../components/ecommerce/Report/StatusPieChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
// import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
// import PieChart from "../../components/ecommerce/Report/PieChartOption";
import PageMeta from "../../components/common/PageMeta";
// import { getDetailReportByRole } from "../../services/report";
// import { useEffect, useState } from "react";

export default function Home() {
  // const [reportData, setReportData] = useState<any>(null);
  // const fetchReport = async () => {
  //   try {
  //     const res = await getDetailReportByRole({
  //       option: "available",
  //       limit: 20,
  //       offset: 0,
  //       year: 2025,
  //       month: 4,
  //     });
  //     setReportData(reportData.data);
  //     console.log("Report data:", res.data);
  //   } catch (error) {
  //     console.error("Error fetching report:", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchReport();
  // }, []);
  // const options = {};
  return (
    <>
      <PageMeta
        title="React.js Ecommerce Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Ecommerce Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <NumberStatusPieChart />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
