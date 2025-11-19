import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

interface Logs {
  id: number;
  name_plan: string;
  phone_numbers: string[];
  price_phone_numbers: string;
}

interface LogDetailModalProps {
  log: Logs;
}

const LogDetailModal = ({ log }: LogDetailModalProps) => {
  const [phonePricesExpanded, setPhonePricesExpanded] = useState(true);
  const [phoneListExpanded, setPhoneListExpanded] = useState(true);

  // Lazy parse phone prices
  const phonePrices = useMemo(() => {
    try {
      return JSON.parse(log.price_phone_numbers);
    } catch {
      return null;
    }
  }, [log.price_phone_numbers]);

  const priceEntries = useMemo(() => {
    return phonePrices ? Object.entries(phonePrices) : [];
  }, [phonePrices]);

  const phoneNumbers = useMemo(() => {
    return log.phone_numbers || [];
  }, [log.phone_numbers]);

  return (
    <div className="space-y-6">
      {/* Chi tiết giá theo đầu số */}
      {phonePrices && (
        <div>
          <button
            onClick={() => setPhonePricesExpanded(!phonePricesExpanded)}
            className="flex items-center gap-2 mb-3 hover:text-blue-600 transition-colors">
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                borderLeft: "3px solid #2563eb",
                pl: 1.5,
                color: "#111827",
                cursor: "pointer",
              }}>
              Chi tiết giá theo đầu số
            </Typography>
            <span
              className={`transition-transform ${
                phonePricesExpanded ? "rotate-180" : ""
              }`}>
              ▼
            </span>
          </button>

          {phonePricesExpanded && (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                maxHeight: 350,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cbd5e1",
                  borderRadius: "4px",
                },
              }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e7eb",
                      }}>
                      Đầu số
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e7eb",
                      }}>
                      Phí cài đặt
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e7eb",
                      }}>
                      Phí duy trì
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priceEntries.map(
                    ([provider, fees]: [string, any], index) => (
                      <TableRow
                        key={provider}
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? "#fafafa" : "white",
                          borderBottom: "1px solid #e5e7eb",
                          "&:hover": { backgroundColor: "#f3f4f6" },
                        }}>
                        <TableCell sx={{ color: "#1f2937", fontWeight: 500 }}>
                          {provider}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#374151" }}>
                          {fees?.installation_fee
                            ? `${fees.installation_fee.toLocaleString(
                                "vi-VN"
                              )} đ`
                            : "-"}
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#374151" }}>
                          {fees?.maintenance_fee
                            ? `${fees.maintenance_fee.toLocaleString(
                                "vi-VN"
                              )} đ`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}

      {/* Danh sách số điện thoại */}
      {phoneNumbers.length > 0 && (
        <div>
          <button
            onClick={() => setPhoneListExpanded(!phoneListExpanded)}
            className="flex items-center gap-2 mb-3 hover:text-green-600 transition-colors">
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                borderLeft: "3px solid #059669",
                pl: 1.5,
                color: "#111827",
                cursor: "pointer",
              }}>
              Danh sách số điện thoại ({phoneNumbers.length})
            </Typography>
            <span
              className={`transition-transform ${
                phoneListExpanded ? "rotate-180" : ""
              }`}>
              ▼
            </span>
          </button>

          {phoneListExpanded && (
            <TableContainer
              component={Paper}
              sx={{
                borderRadius: "8px",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                maxHeight: 350,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#cbd5e1",
                },
              }}>
              <Table size="small" stickyHeader>
                <TableHead sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #e5e7eb",
                        width: 60,
                      }}>
                      STT
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#374151",
                        fontWeight: 600,
                      }}>
                      Số điện thoại
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phoneNumbers.map((phone, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: index % 2 === 0 ? "#fafafa" : "white",
                        "&:hover": { backgroundColor: "#f3f4f6" },
                      }}>
                      <TableCell sx={{ color: "#1f2937", fontWeight: 500 }}>
                        {index + 1}
                      </TableCell>
                      <TableCell
                        sx={{ color: "#1f2937", fontFamily: "monospace" }}>
                        {phone}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      )}

      {/* Empty State */}
      {!phonePrices && phoneNumbers.length === 0 && (
        <Typography color="textSecondary" sx={{ textAlign: "center", py: 4 }}>
          Không có dữ liệu chi tiết để hiển thị.
        </Typography>
      )}
    </div>
  );
};

export default LogDetailModal;
