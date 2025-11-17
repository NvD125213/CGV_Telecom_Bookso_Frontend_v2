import React, { useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import { useTheme } from "../../context/ThemeContext";

interface SubPlan {
  id: string | number;
  name: string;
  status: string | number;
}

interface SubPlanSelectProps {
  subPlans: SubPlan[];
  label?: string;
}

const getStatusColor = (status: string | number) => {
  const statusStr = String(status).toLowerCase();
  if (
    statusStr === "1" ||
    statusStr.includes("active") ||
    statusStr === "hoạt động"
  ) {
    return "success";
  }
  if (
    statusStr === "2" ||
    statusStr.includes("pending") ||
    statusStr === "chờ xử lý"
  ) {
    return "warning";
  }
  if (
    statusStr === "0" ||
    statusStr.includes("inactive") ||
    statusStr === "không hoạt động"
  ) {
    return "error";
  }
  return "default";
};

const SubPlanSelect: React.FC<SubPlanSelectProps> = ({ subPlans, label }) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme(); // "light" | "dark"
  const isDark = theme === "dark";

  if (!subPlans || subPlans.length === 0) {
    return (
      <span className="text-gray-400 flex justify-start dark:text-gray-500 text-xs">
        Chưa có gói phụ
      </span>
    );
  }

  return (
    <FormControl variant="standard" size="small" sx={{ minWidth: 150 }}>
      {label && <div className="text-gray-500">{label}</div>}

      <Select
        value=""
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        displayEmpty
        onChange={() => {}}
        sx={{
          cursor: "pointer",
          color: isDark ? "#eee" : "#000",
          backgroundColor: isDark ? "transparent" : "#fff",
          borderRadius: 1,
          ".MuiSelect-select": {
            color: isDark ? "#ddd" : "#6b7280", // text-gray-500
            fontSize: "14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          },
          ".MuiSvgIcon-root": { color: isDark ? "#fff" : "#666" },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              backgroundColor: isDark ? "#1d2939" : "#fff",
              color: isDark ? "#eee" : "#000",
              maxHeight: 300,
              borderRadius: 2,
              boxShadow: isDark
                ? "0px 4px 12px rgba(255,255,255,0.05)"
                : "0px 4px 12px rgba(0,0,0,0.1)",
            },
          },
        }}
        renderValue={() => `${subPlans.length} gói phụ`}>
        {subPlans.map((plan, idx) => (
          <MenuItem
            key={plan.id + "-" + idx}
            value={plan.id}
            disableRipple
            sx={{
              "&:hover": {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "action.hover",
              },
            }}>
            <Box
              display="flex"
              justifyContent="space-between"
              width="100%"
              gap={2}
              alignItems="center">
              <Typography noWrap sx={{ color: isDark ? "#ddd" : "#000" }}>
                {plan.name}
              </Typography>

              <Chip
                label={
                  typeof plan.status === "number"
                    ? plan.status === 1
                      ? "active"
                      : plan.status === 0
                      ? "deleted"
                      : "pending"
                    : plan.status
                }
                color={getStatusColor(plan.status) as any}
                size="small"
                sx={{
                  fontSize: "11px",
                  height: 22,
                }}
              />
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SubPlanSelect;
