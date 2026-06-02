import { useState, useEffect } from "react";
import PricingCard from "../../components/pricing-card/pricing-card";
import { PlanData } from "../../components/pricing-card/pricing-card";
import { planService } from "../../services/plan";
import ComponentCard from "../../components/common/ComponentCard";
import Select from "../../components/form/Select";
import Input from "../../components/form/input/InputField";
import { useQuerySync } from "../../hooks/useQueryAsync";
import Label from "../../components/form/Label";
import Skeleton from "react-loading-skeleton";
import { useScrollPagination } from "../../hooks/useScrollPagination";
import { IoIosAdd } from "react-icons/io";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Pagination } from "../../components/common/Pagination";
import { MobileFixedPagination } from "../../components/common/MobileFixedPagination";
import { useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { PlanQuery, Plans } from "./interfaces/PlanQuery";
import Swal from "sweetalert2";
import EmptyState from "../../components/EmptyData";
import ResponsiveFilterWrapper from "../../components/common/FlipperWrapper";
import { useScreenSize } from "../../hooks/useScreenSize";

export const PlanList = () => {
  const user = useSelector((state: RootState) => state.auth?.user);
  const navigate = useNavigate();
  const { isMobile } = useScreenSize();
  const [query, setQuery] = useQuerySync<PlanQuery>({
    page: 1,
    size: 10,
    order_by: "price_vnd",
    order_dir: "asc",
    is_root: "True",
    status: "1",
  });
  const [searchInput, setSearchInput] = useState(query.search);
  const [plans, setPlans] = useState<Plans | null>(null);
  const [loading, setLoading] = useState(false);
  const { scrollRef, canScrollLeft, canScrollRight, scroll } =
    useScrollPagination<PlanData>([]);

  const [pagination, setPagination] = useState({
    page: query.page,
    size: query.size,
    total: 0,
    pages: 1,
  });

  const handlePaginationChange = (page: number, size: number) => {
    setQuery({ ...query, page, size });
  };

  // Đảm bảo order_dir luôn là "asc" hoặc "desc"
  useEffect(() => {
    if (query.order_dir !== "asc" && query.order_dir !== "desc") {
      setQuery({ ...query, order_dir: "asc" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.order_dir]);

  // Nếu role không phải là 1 (admin), set status = "1"
  useEffect(() => {
    if (user.role !== 1 && query.status !== "1") {
      setQuery({ ...query, status: "1" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.role]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== query.search) {
        setQuery({ ...query, search: searchInput, page: 1 });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchInput, query, setQuery]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // Đảm bảo order_dir là "asc" hoặc "desc"
      const validOrderDir = query.order_dir === "desc" ? "desc" : "asc";
      const validQuery = {
        ...query,
        order_dir: validOrderDir,
      };
      const result = await planService.get(validQuery);
      setPlans(result.data);
      setPagination(result.data.meta);
    } catch (err: any) {
      console.error("Fetch plans failed:", err.response.data);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPlans();
  }, [query]);

  const handleSelect = (data: PlanData) => {
    navigate("/subscriptions/create", { state: data });
  };

  const handleChange = (field: keyof PlanData, value: any) => {
    console.log(`Field ${field} changed to:`, value);
  };

  // Mở xem chi tiết gói
  const handleViewDetail = (data: PlanData) => {
    navigate(`/plans/edit/${data.id}`);
  };

  // Sau khi load dữ liệu xong, kiểm tra nút cuộn
  useEffect(() => {
    if (!loading) {
      // Kiểm tra lại ngay sau khi render danh sách
      setTimeout(() => {
        const el = scrollRef.current;
        if (el) {
          const { scrollWidth, clientWidth } = el;
          // Nếu nội dung rộng hơn khung hiển thị => có thể scroll phải
          if (scrollWidth > clientWidth) {
            el.scrollLeft = 0; // về đầu
          }
          // Thủ công gọi scroll event để cập nhật nút cuộn
          el.dispatchEvent(new Event("scroll"));
        }
      }, 100); // đợi một nhịp nhỏ để DOM render xong
    }
  }, [loading, plans]);

  const handleDelete = async (data: PlanData) => {
    const result = await Swal.fire({
      title: "Xác nhận xóa",
      text: `Bạn có chắc chắn muốn xóa gói "${data.name}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        const res = await planService.delete(data.id); // gọi API xóa
        if (res.status === 200) {
          Swal.fire("Đã xóa!", `Gói "${data.name}" đã được xóa.`, "success");
          fetchPlans();
        } else {
          Swal.fire("Lỗi", "Không thể xóa gói này.", "error");
        }
      } catch (error: any) {
        Swal.fire(
          "Lỗi",
          error?.response?.data?.detail || "Xảy ra lỗi",
          "error",
        );
      }
    }
  };

  const totalPages = Math.max(1, pagination.pages);
  const showMobilePagination = isMobile && totalPages > 1;

  const renderPricingCard = (plan: PlanData) => (
    <PricingCard
      data={plan}
      onSelect={handleSelect}
      onChange={handleChange}
      onDetail={handleViewDetail}
      onDelete={handleDelete}
      buttonText="Đặt gói"
      showBadge={false}
      className={isMobile ? "p-0" : ""}
    />
  );

  const renderPlanContent = () => {
    if (loading) {
      const skeletonCount = isMobile ? 2 : 3;
      return Array.from({ length: skeletonCount }).map((_, i) => (
        <div
          key={i}
          className={
            isMobile
              ? "w-full rounded-xl border border-gray-200 bg-white p-3 shadow dark:border-gray-700 dark:bg-gray-800"
              : "flex-shrink-0 min-w-[55%] snap-start rounded-xl border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800 md:min-w-[45%] lg:min-w-[35%]"
          }>
          <Skeleton height={180} className="mb-4 rounded-lg" />
          <Skeleton count={3} height={20} className="mb-2 rounded-md" />
          <Skeleton height={40} className="mt-4 rounded-md" />
        </div>
      ));
    }

    if (!plans?.items || plans.items.length === 0) {
      return <EmptyState />;
    }

    return plans.items.map((plan) => (
      <div
        key={plan.id}
        className={
          isMobile
            ? "w-full"
            : "flex-shrink-0 min-w-[55%] snap-start md:min-w-[45%] lg:min-w-[35%]"
        }>
        {renderPricingCard(plan)}
      </div>
    ));
  };

  return (
    <>
      {isMobile ? null : <PageBreadcrumb pageTitle="Danh sách gói cước" />}
      <div className="mb-4 flex justify-end">
        {user.role === 1 && (
          <button
            onClick={() => navigate("/plans/create")}
            className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            <IoIosAdd size={24} />
            Thêm
          </button>
        )}
      </div>
      <ComponentCard>
        <div className={showMobilePagination ? "pb-24" : ""}>
          <ResponsiveFilterWrapper drawerTitle="Bộ lọc tìm kiếm">
            <div className="mb-4 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2 sm:gap-6 sm:p-4">
              <div className="w-full">
                <Label>Tìm kiếm</Label>
                <Input
                  type="text"
                  placeholder="Tìm theo tên gói..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md"
                />
              </div>

              <div className="w-full">
                <Label>Thứ tự</Label>
                <Select
                  options={[
                    { label: "Tăng dần", value: "asc" },
                    { label: "Giảm dần", value: "desc" },
                  ]}
                  value={query.order_dir}
                  onChange={(value) => setQuery({ ...query, order_dir: value })}
                  placeholder="Thứ tự"
                />
              </div>
              <div className="w-full">
                <Label>Trạng thái</Label>
                <Select
                  options={[
                    { label: "Hoạt động", value: "1" },
                    { label: "Không hoạt động", value: "0" },
                  ]}
                  value={query.status}
                  onChange={(value) => setQuery({ ...query, status: value })}
                  placeholder="Loại gói"
                />
              </div>

              <div className="w-full">
                <Label>Sắp xếp theo</Label>
                <Select
                  options={[
                    { label: "Ngày tạo", value: "created_at" },
                    { label: "Ngày cập nhật", value: "updated_at" },
                    { label: "Tên gói", value: "name" },
                    { label: "Giá tiền", value: "price_vnd" },
                    { label: "Số phút", value: "minutes" },
                    { label: "Số CID", value: "did_count" },
                    { label: "Trạng thái", value: "status" },
                    { label: "Thời gian hết hạn", value: "expiration_time" },
                  ]}
                  value={query.order_by}
                  onChange={(value) => setQuery({ ...query, order_by: value })}
                  placeholder="Chọn cách sắp xếp"
                />
              </div>
            </div>
          </ResponsiveFilterWrapper>

          {isMobile ? (
            <div className="grid grid-cols-1 gap-3 px-1">
              {renderPlanContent()}
            </div>
          ) : (
            <div className="relative px-1">
              {canScrollLeft && (
                <button
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  onClick={() => scroll("left")}>
                  <FiChevronLeft size={20} />
                </button>
              )}

              <div
                ref={scrollRef}
                className="hide-scrollbar flex w-full snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4">
                {renderPlanContent()}
              </div>

              {canScrollRight && (
                <button
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white p-2 shadow hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                  onClick={() => scroll("right")}>
                  <FiChevronRight
                    size={20}
                    className="text-gray-700 transition-colors duration-200 dark:text-white"
                  />
                </button>
              )}
            </div>
          )}

          {isMobile ? (
            <MobileFixedPagination
              currentPage={pagination.page}
              totalPages={totalPages}
              pageSize={pagination.size}
              pageSizeOptions={[10, 20, 50]}
              onPageChange={(page) => handlePaginationChange(page, pagination.size)}
              onPageSizeChange={(size) => handlePaginationChange(1, size)}
            />
          ) : (
            <Pagination data={pagination} onChange={handlePaginationChange} />
          )}
        </div>
      </ComponentCard>
    </>
  );
};
