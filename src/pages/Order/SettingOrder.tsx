import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Tabs,
  Tab,
  Typography,
  IconButton,
  DialogActions,
} from "@mui/material";
import Button from "../../components/ui/button/Button";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { configService } from "../../services/config";
import { useApi } from "../../hooks/useApi";
import Swal from "sweetalert2";

interface PackageRow {
  id: number;
  min: string; // string để nhập có dấu phẩy
  max: string;
  price: string; // string để nhập có dấu phẩy
}

interface TableData {
  rows: PackageRow[];
}

// ---- Format helper ----
// Hàm format số với dấu phẩy ngăn cách hàng nghìn và chỉ cho nhập số
const formatNumber = (input: string): string => {
  // Loại bỏ tất cả ký tự không phải số
  const numbersOnly = input.replace(/\D/g, "");

  // Nếu chuỗi rỗng, trả về rỗng
  if (!numbersOnly) return "";

  // Format số với dấu phẩy ngăn cách hàng nghìn
  return numbersOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const SettingOrder: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showValidation, setShowValidation] = useState(false);

  // Sample default tables
  const [userPackage, setUserPackage] = useState<TableData>({
    rows: [],
  });

  const [callMinutesPackage, setCallMinutesPackage] = useState<TableData>({
    rows: [],
  });

  const [prefixPackagePhones, setPrefixPackagePhones] = useState<TableData>({
    rows: [],
  });

  // ---- Table controls ----
  const addRow = (
    table: TableData,
    setTable: React.Dispatch<React.SetStateAction<TableData>>
  ) => {
    const newId =
      table.rows.length > 0 ? Math.max(...table.rows.map((r) => r.id)) + 1 : 1;

    setTable({
      rows: [...table.rows, { id: newId, min: "", max: "", price: "" }],
    });
  };

  const deleteRow = (
    id: number,
    table: TableData,
    setTable: React.Dispatch<React.SetStateAction<TableData>>
  ) => {
    setTable({ rows: table.rows.filter((r) => r.id !== id) });
  };

  const updateRow = (
    id: number,
    field: "min" | "max" | "price",
    value: string,
    table: TableData,
    setTable: React.Dispatch<React.SetStateAction<TableData>>
  ) => {
    // Clear validation khi user chỉnh sửa
    if (showValidation) {
      setShowValidation(false);
    }

    setTable({
      rows: table.rows.map((r) =>
        r.id === id ? { ...r, [field]: formatNumber(value) } : r
      ),
    });
  };

  // Helper function để kiểm tra field có invalid không
  const isFieldInvalid = (
    row: PackageRow,
    field: "min" | "max" | "price",
    rowIndex: number,
    totalRows: number
  ) => {
    if (!showValidation) return false;

    const isLastRow = rowIndex === totalRows - 1;

    if (field === "min" && !row.min) return true;
    if (field === "max" && !isLastRow && !row.max) return true;
    if (field === "price" && !row.price) return true;

    return false;
  };

  // ---- Render table component ----
  const renderTable = (
    title: string,
    table: TableData,
    setTable: React.Dispatch<React.SetStateAction<TableData>>
  ) => {
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>

        <div className="overflow-x-auto bg-white border border-gray-200 rounded-md shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Min", "Max", "Giá (VNĐ)", "Xóa"].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {table.rows.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="px-4 py-2">
                    <input
                      value={row.min}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "min",
                          e.target.value,
                          table,
                          setTable
                        )
                      }
                      className={`w-full px-2 py-1 border rounded-md text-sm ${
                        isFieldInvalid(row, "min", rowIndex, table.rows.length)
                          ? "border-red-500 border-2"
                          : ""
                      }`}
                      placeholder="Nhập giá nhỏ nhất trong khoảng"
                    />
                    {isFieldInvalid(
                      row,
                      "min",
                      rowIndex,
                      table.rows.length
                    ) && (
                      <p className="text-red-500 text-xs mt-1">
                        Vui lòng nhập giá trị Min
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    <input
                      value={row.max}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "max",
                          e.target.value,
                          table,
                          setTable
                        )
                      }
                      className={`w-full px-2 py-1 border rounded-md text-sm ${
                        isFieldInvalid(row, "max", rowIndex, table.rows.length)
                          ? "border-red-500 border-2"
                          : ""
                      }`}
                      placeholder="Nhập giá trị lớn nhất trong khoảng"
                    />
                    {isFieldInvalid(
                      row,
                      "max",
                      rowIndex,
                      table.rows.length
                    ) && (
                      <p className="text-red-500 text-xs mt-1">
                        Vui lòng nhập giá trị Max
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    <input
                      value={row.price}
                      onChange={(e) =>
                        updateRow(
                          row.id,
                          "price",
                          e.target.value,
                          table,
                          setTable
                        )
                      }
                      className={`w-full px-2 py-1 border rounded-md text-sm ${
                        isFieldInvalid(
                          row,
                          "price",
                          rowIndex,
                          table.rows.length
                        )
                          ? "border-red-500 border-2"
                          : ""
                      }`}
                      placeholder="Nhập giá"
                    />
                    {isFieldInvalid(
                      row,
                      "price",
                      rowIndex,
                      table.rows.length
                    ) && (
                      <p className="text-red-500 text-xs mt-1">
                        Vui lòng nhập giá trị Giá
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-2">
                    <IconButton
                      size="small"
                      onClick={() => deleteRow(row.id, table, setTable)}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </td>
                </tr>
              ))}

              {/* ADD ROW BUTTON BELOW TABLE */}
              <tr>
                <td colSpan={4} className="text-center py-3">
                  <button
                    onClick={() => addRow(table, setTable)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                    <AddIcon fontSize="small" /> Thêm hàng
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ---- Tab content ----
  const renderContent = () => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {renderTable("Gói người dùng", userPackage, setUserPackage)}
      {renderTable("Gói phút gọi", callMinutesPackage, setCallMinutesPackage)}
      {renderTable("Gói đầu số", prefixPackagePhones, setPrefixPackagePhones)}
    </Box>
  );

  // Fetch config data
  const [dataSettingOrder, setDataSettingOrder] = useState<any>(null);
  const {
    data: settingOrder,
    isLoading: isLoadingSettingOrder,
    error: errorSettingOrder,
    refetch,
  } = useApi(() => configService.getConfig());

  // Load dữ liệu từ API khi settingOrder thay đổi
  useEffect(() => {
    if (settingOrder?.status == 200) {
      // Lấy items array
      const items = settingOrder.data?.items;

      if (Array.isArray(items) && items.length > 0) {
        // Tìm item có key = "price_order"
        const priceOrderConfig = items.find(
          (item: any) => item.key === "price_order"
        );

        if (priceOrderConfig && priceOrderConfig.value) {
          setDataSettingOrder(priceOrderConfig);
        } else {
          setDataSettingOrder(null);
        }
      } else {
        setDataSettingOrder(null);
      }
    }
  }, [settingOrder]);

  // Populate form data khi dataSettingOrder thay đổi
  useEffect(() => {
    if (dataSettingOrder) {
      try {
        // Gói người dùng - với fallback về mảng rỗng
        if (Array.isArray(dataSettingOrder.value.user_package)) {
          setUserPackage({
            rows: dataSettingOrder.value.user_package.map(
              (item: any, index: number) => ({
                id: index + 1,
                min:
                  item.min !== null && item.min !== undefined
                    ? formatNumber(item.min.toString())
                    : "",
                max:
                  item.max !== null && item.max !== undefined
                    ? formatNumber(item.max.toString())
                    : "",
                price:
                  item.price !== null && item.price !== undefined
                    ? formatNumber(item.price.toString())
                    : "",
              })
            ),
          });
        } else {
          setUserPackage({ rows: [] });
        }

        // Gói phút gọi - với fallback về mảng rỗng
        if (Array.isArray(dataSettingOrder.value.call_minutes_package)) {
          setCallMinutesPackage({
            rows: dataSettingOrder.value.call_minutes_package.map(
              (item: any, index: number) => ({
                id: index + 1,
                min:
                  item.min !== null && item.min !== undefined
                    ? formatNumber(item.min.toString())
                    : "",
                max:
                  item.max !== null && item.max !== undefined
                    ? formatNumber(item.max.toString())
                    : "",
                price:
                  item.price !== null && item.price !== undefined
                    ? formatNumber(item.price.toString())
                    : "",
              })
            ),
          });
        } else {
          setCallMinutesPackage({ rows: [] });
        }

        // Gói đầu số - với fallback về mảng rỗng
        if (Array.isArray(dataSettingOrder.value.prefix_package_phones)) {
          setPrefixPackagePhones({
            rows: dataSettingOrder.value.prefix_package_phones.map(
              (item: any, index: number) => ({
                id: index + 1,
                min:
                  item.min !== null && item.min !== undefined
                    ? formatNumber(item.min.toString())
                    : "",
                max:
                  item.max !== null && item.max !== undefined
                    ? formatNumber(item.max.toString())
                    : "",
                price:
                  item.price !== null && item.price !== undefined
                    ? formatNumber(item.price.toString())
                    : "",
              })
            ),
          });
        } else {
          setPrefixPackagePhones({ rows: [] });
        }
      } catch (error) {
        console.error("Error parsing settings data:", error);
        // Set về mảng rỗng khi có lỗi
        setUserPackage({ rows: [] });
        setCallMinutesPackage({ rows: [] });
        setPrefixPackagePhones({ rows: [] });
      }
    }
  }, [dataSettingOrder]);

  const handleSave = () => {
    let hasErrors = false;

    // Helper function để validate data
    const validatePackage = (rows: PackageRow[]) => {
      return rows.map((row, index) => {
        const isLastRow = index === rows.length - 1;

        // Remove commas và convert to number
        const minValue = row.min ? parseInt(row.min.replace(/,/g, "")) : null;
        const maxValue = row.max ? parseInt(row.max.replace(/,/g, "")) : null;
        const priceValue = row.price
          ? parseInt(row.price.replace(/,/g, ""))
          : null;

        // Validation
        if (!row.min || minValue === null) hasErrors = true;
        if (!isLastRow && (!row.max || maxValue === null)) hasErrors = true;
        if (!row.price || priceValue === null) hasErrors = true;

        return {
          min: minValue,
          max: isLastRow && !row.max ? null : maxValue,
          price: priceValue,
        };
      });
    };

    // Validate từng package
    const userPackageData = validatePackage(userPackage.rows);
    const callMinutesPackageData = validatePackage(callMinutesPackage.rows);
    const prefixPackagePhonesData = validatePackage(prefixPackagePhones.rows);

    // Nếu có lỗi, hiển thị validation và return
    if (hasErrors) {
      setShowValidation(true);
      return;
    }

    // Clear validation nếu pass
    setShowValidation(false);

    const settingsData: any = {
      user_package: userPackageData,
      call_minutes_package: callMinutesPackageData,
      prefix_package_phones: prefixPackagePhonesData,
    };

    if (settingsData && hasErrors === false) {
      Swal.fire({
        icon: "warning",
        title: "Cập nhật setting cho order",
        html: '<p style="font-size: 15px; color: #555;">Bạn có chắc chắn muốn cập nhật setting cho order này?<br/><span style="color: #e74c3c; font-weight: 500;">Các thay đổi sẽ ảnh hưởng đến các order được tạo trong tương lai!</span></p>',
        showConfirmButton: true,
        confirmButtonText: '<i class="fa fa-check"></i> Xác nhận',
        showCancelButton: true,
        cancelButtonText: '<i class="fa fa-times"></i> Hủy',
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#dc3545",
        reverseButtons: true,
        width: "500px",
        padding: "2em",
        backdrop: `
          rgba(0,0,0,0.6)
          left top
          no-repeat 
        `,
        customClass: {
          container: "swal-high-zindex",
          popup: "swal-custom-popup",
          title: "swal-custom-title",
          confirmButton: "swal-custom-confirm-btn",
          cancelButton: "swal-custom-cancel-btn",
        },
        didOpen: () => {
          // Set z-index cao hơn MUI Dialog (1300)
          const swalContainer = document.querySelector(
            ".swal-high-zindex"
          ) as HTMLElement;
          if (swalContainer) {
            swalContainer.style.zIndex = "1400";
          }

          // Custom styling
          const style = document.createElement("style");
          style.innerHTML = `
            .swal-custom-popup {
              border-radius: 15px !important;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
            }
            .swal-custom-title {
              font-size: 24px !important;
              color: #333 !important;
              padding-bottom: 10px !important;
            }
            .swal-custom-confirm-btn {
              border-radius: 8px !important;
              padding: 10px 30px !important;
              font-weight: 600 !important;
              font-size: 15px !important;
              box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3) !important;
              transition: all 0.3s ease !important;
            }
            .swal-custom-confirm-btn:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 6px 16px rgba(40, 167, 69, 0.4) !important;
            }
            .swal-custom-cancel-btn {
              border-radius: 8px !important;
              padding: 10px 30px !important;
              font-weight: 600 !important;
              font-size: 15px !important;
              box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3) !important;
              transition: all 0.3s ease !important;
            }
            .swal-custom-cancel-btn:hover {
              transform: translateY(-2px) !important;
              box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4) !important;
            }
          `;
          document.head.appendChild(style);
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          const response = await configService.updateConfig(
            dataSettingOrder.id,
            {
              key: "price_order",
              value: settingsData,
            }
          );
          if (response.status === 200) {
            Swal.fire(
              "Thành công",
              "Cập nhật setting cho order thành công !",
              "success"
            );
            await refetch();
          }
        }
      });
    }
  };

  return (
    <Box
      sx={{
        border: "1px solid #ddd",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}>
      {/* Body */}
      <Box sx={{ px: 3, py: 3 }}>
        {/* Error Message */}
        {errorSettingOrder && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: "#fee",
              border: "1px solid #fcc",
              borderRadius: 1,
              color: "#c33",
            }}>
            <Typography variant="body2" fontWeight={600}>
              ⚠️ {errorSettingOrder?.message || "Không thể tải dữ liệu cài đặt"}
            </Typography>
          </Box>
        )}

        {/* Loading State */}
        {isLoadingSettingOrder && !errorSettingOrder && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Đang tải dữ liệu...
            </Typography>
          </Box>
        )}

        {/* Content Tables */}
        {!isLoadingSettingOrder && renderContent()}
      </Box>

      {/* Actions */}
      <Box
        sx={{
          borderTop: "1px solid #eee",
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1,
        }}>
        <Button onClick={handleSave} variant="primary">
          Lưu
        </Button>
      </Box>
    </Box>
  );
};

export default SettingOrder;
