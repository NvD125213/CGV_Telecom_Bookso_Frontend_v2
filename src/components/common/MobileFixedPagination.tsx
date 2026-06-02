import { Box, MenuItem, Select } from "@mui/material";
import { useTheme } from "../../context/ThemeContext";

interface MobileFixedPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const getSelectSx = (theme: string) => ({
  minWidth: 80,
  height: 40,
  color: theme === "dark" ? "#fff" : "inherit",
  "& .MuiInputBase-root": {
    color: theme === "dark" ? "#fff" : "inherit",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme === "dark" ? "#fff" : "inherit",
  },
  "& .MuiSelect-icon": {
    color: theme === "dark" ? "#fff" : "inherit",
  },
});

export const MobileFixedPagination = ({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
}: MobileFixedPaginationProps) => {
  const { theme } = useTheme();

  if (totalPages <= 1) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        p: 2,
        flexWrap: "wrap",
        bgcolor: theme === "dark" ? "#1f2937" : "#ffffff",
        borderTop: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
      }}>
      <Select
        value={currentPage}
        MenuProps={{
          PaperProps: {
            style: {
              maxHeight: 300,
            },
          },
        }}
        onChange={(e) => onPageChange(Number(e.target.value))}
        sx={getSelectSx(theme)}>
        {Array.from({ length: totalPages }, (_, i) => (
          <MenuItem key={i + 1} value={i + 1}>
            Trang {i + 1}
          </MenuItem>
        ))}
      </Select>

      <Select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        sx={getSelectSx(theme)}>
        {pageSizeOptions.map((limit) => (
          <MenuItem key={limit} value={limit}>
            {limit} / trang
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};
