import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import NumberStatusPieChart from "../../components/ecommerce/Report/StatusPieChart";
import PageMeta from "../../components/common/PageMeta";

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
        title="Hệ thống đặt số | CGV Telecom"
        description="Hệ thống đặt số CGV Telecom - Đặt số dành cho Sale."
      />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-5">
          <NumberStatusPieChart />
        </div>
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />
          {/* <MonthlySalesChart /> */}
        </div>

        {/* <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div> */}
      </div>
    </>
  );
}
