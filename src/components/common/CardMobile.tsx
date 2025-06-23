import React from "react";
import {
  Card,
  CardContent,
  Box,
  alpha,
  IconButton,
  Tooltip,
  Checkbox,
} from "@mui/material";
import Label from "../form/Label";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useTheme } from "../../context/ThemeContext";

export interface InfoObject {
  [key: string]: string | number;
}

// Interface mới cho format label-value
export interface LabelValueItem {
  label: string;
  value: string | number;
  fieldName?: string;
  hidden?: boolean;
  hideLabel?: boolean;
  hideValue?: boolean;
}

interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: (data: InfoObject | LabelValueItem[]) => void;
  color?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  className?: string;
}

interface CardMobileProps {
  data: InfoObject | LabelValueItem[];
  actions?: ActionButton[];
  showDefaultActions?: boolean;
  onEdit?: (data: InfoObject | LabelValueItem[]) => void;
  onDelete?: (data: InfoObject | LabelValueItem[]) => void;
  onView?: (data: InfoObject | LabelValueItem[]) => void;
  onMore?: (data: InfoObject | LabelValueItem[]) => void;

  // Selection props
  selectable?: boolean;
  selected?: boolean;
  onSelectionChange?: (
    selected: boolean,
    data: InfoObject | LabelValueItem[]
  ) => void;

  // Tailwind className props
  className?: string;
  cardClassName?: string;
  contentClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  valueClassName?: string;
  actionsClassName?: string;
  actionButtonClassName?: string;

  // Field-specific className props
  fieldClassNames?: { [key: string]: string };
  labelClassNames?: { [key: string]: string };
  valueClassNames?: { [key: string]: string };

  // SX props cho values - Thêm prop mới
  valueSxProps?: { [key: string]: React.CSSProperties | object };

  // Style customization options
  useTailwindStyling?: boolean; // Toggle between MUI sx and Tailwind
}

type ActionColor =
  | "primary"
  | "error"
  | "info"
  | "secondary"
  | "warning"
  | "success";

const CardMobile: React.FC<CardMobileProps> = ({
  data,
  actions = [],
  showDefaultActions = true,
  onEdit,
  onDelete,
  onView,
  onMore,
  selectable = false,
  selected = false,
  onSelectionChange,
  className,
  cardClassName,
  contentClassName,
  fieldClassName,
  labelClassName,
  valueClassName,
  actionsClassName,
  actionButtonClassName,
  fieldClassNames = {},
  labelClassNames = {},
  valueClassNames = {},
  valueSxProps = {}, // Thêm prop mới
  useTailwindStyling = false,
}) => {
  const { theme } = useTheme();

  // Helper function để kiểm tra format
  const isLabelValueFormat = (data: any): data is LabelValueItem[] => {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0] === "object" &&
      "label" in data[0]
    );
  };

  // Lấy entries và giữ lại thông tin hideLabel/hideValue
  const getEntries = () => {
    if (isLabelValueFormat(data)) {
      // LabelValueItem[] format - lọc bỏ các trường hidden
      return data
        .filter((item) => !item.hidden)
        .map((item) => ({
          key: item.label,
          value: String(item.value),
          hideLabel: item.hideLabel,
          hideValue: item.hideValue,
        }));
    } else {
      // InfoObject format
      return Object.entries(data).map(([key, value]) => ({
        key,
        value: String(value),
        hideLabel: false,
        hideValue: false,
      }));
    }
  };

  const entries = getEntries();

  const formatKey = (key: string) =>
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

  // Helper function để get sx styles cho value
  const getValueSxStyles = (key: string) => {
    return valueSxProps[key] || {};
  };

  const defaultActions: ActionButton[] = [];

  if (onView) {
    defaultActions.push({
      icon: <ViewIcon />,
      label: "Xem chi tiết",
      onClick: onView,
      color: "info",
    });
  }

  if (onEdit) {
    defaultActions.push({
      icon: <EditIcon />,
      label: "Chỉnh sửa",
      onClick: onEdit,
      color: "primary",
    });
  }

  if (onDelete) {
    defaultActions.push({
      icon: <DeleteIcon />,
      label: "Xóa",
      onClick: onDelete,
      color: "error",
    });
  }

  if (onMore) {
    defaultActions.push({
      icon: <MoreVertIcon />,
      label: "Thêm",
      onClick: onMore,
      color: "secondary",
    });
  }

  const allActions = showDefaultActions
    ? [...defaultActions, ...actions]
    : actions;

  const handleSelectionChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (onSelectionChange) {
      onSelectionChange(event.target.checked, data);
    }
  };

  // Tailwind styles with dark mode support
  const tailwindStyles = {
    wrapper: "mb-2 px-2 sm:px-0",
    card: `rounded-2xl ${
      theme === "dark"
        ? "bg-gray-900 border-gray-700"
        : "bg-white border-gray-200"
    } backdrop-blur-sm border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`,
    content: "p-4 sm:p-6",
    field: `flex flex-col items-center justify-center py-3 px-2 mb-3 rounded-xl ${
      theme === "dark"
        ? "bg-gray-800 border-gray-600/60"
        : "bg-gray-50 border-gray-200/60"
    } border min-h-[60px]`,
    label: `text-xs font-semibold leading-tight text-center mb-1 ${
      theme === "dark" ? "text-gray-300" : "text-gray-600"
    }`,
    value: `text-sm font-medium leading-tight text-center break-words ${
      theme === "dark" ? "text-white" : "text-gray-900"
    }`,
    actions: `flex justify-end items-center gap-3 flex-wrap mt-4 pt-4 border-t ${
      theme === "dark" ? "border-gray-700" : "border-gray-200"
    }`,
    actionButton:
      "min-w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105",

    checkbox: "flex items-center gap-2",
  };

  if (useTailwindStyling) {
    return (
      <div className={`${tailwindStyles.wrapper} ${className || ""}`}>
        <div className={`${tailwindStyles.card} ${cardClassName || ""}`}>
          <div
            className={`${tailwindStyles.content} ${contentClassName || ""}`}>
            {/* Grid layout: mỗi dòng là 1 cặp label-value, chia 2 cột */}
            <div className="flex flex-col gap-1">
              {entries.map(({ key, value, hideLabel, hideValue }) => (
                <div
                  key={key}
                  className={`flex mb-1 min-h-[30px] bg-transparent ${
                    hideLabel || hideValue
                      ? "flex-row items-center justify-center"
                      : "flex-row items-center justify-between"
                  }`}>
                  {!hideLabel && (
                    <div
                      className={`w-1/2 text-left text-[13px] font-semibold flex items-center justify-start ${
                        hideValue ? "justify-center w-full text-center" : ""
                      } ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } ${labelClassName || ""} ${labelClassNames[key] || ""}`}>
                      {formatKey(key)}
                    </div>
                  )}
                  {!hideValue && (
                    <div
                      className={`w-1/2 break-words flex items-center ${
                        hideLabel
                          ? "justify-center w-full text-center"
                          : "text-right justify-center"
                      } ${theme === "dark" ? "text-white" : "text-gray-900"} ${
                        valueClassName || ""
                      } ${valueClassNames[key] || ""}`}
                      style={{
                        ...getValueSxStyles(key), // Apply sx styles cho Tailwind
                      }}>
                      {value}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {(allActions.length > 0 || selectable) && (
              <div
                className={`${tailwindStyles.actions} ${
                  actionsClassName || ""
                }`}>
                {selectable && (
                  <div className={tailwindStyles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={handleSelectionChange}
                      className={`w-5 h-5 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-300"
                      } rounded focus:ring-blue-500 focus:ring-2`}
                    />
                    <span
                      className={`text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}>
                      Chọn
                    </span>
                  </div>
                )}
                {allActions.map((action, index) => (
                  <Tooltip key={index} title={action.label} arrow>
                    <button
                      onClick={() => action.onClick(data)}
                      className={`${tailwindStyles.actionButton} ${
                        actionButtonClassName || ""
                      } ${action.className || ""} ${getActionButtonStyle(
                        action.color,
                        theme
                      )}`}>
                      {action.icon}
                    </button>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MUI styling with dark mode support
  const getMuiThemeColors = () => ({
    background:
      theme === "dark"
        ? `linear-gradient(135deg, #111827 0%, ${alpha("#1f2937", 0.9)} 100%)`
        : `linear-gradient(135deg, #ffffff 0%, ${alpha("#f3f4f6", 0.9)} 100%)`,
    text: theme === "dark" ? "#ffffff" : "#111827",
    border:
      theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    action:
      theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
  });

  const themeColors = getMuiThemeColors();

  return (
    <Box className={className} sx={{ paddingBottom: 0, marginBottom: 1 }}>
      <Card
        className={cardClassName}
        sx={{
          background: themeColors.background,
          backdropFilter: "blur(8px)",
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
          },
        }}>
        <CardContent
          className={`${contentClassName} p-4`}
          sx={{
            paddingBottom: "16px !important",
          }}>
          {/* Grid layout: mỗi dòng là 1 cặp label-value, chia 2 cột */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {entries.map(({ key, value, hideLabel, hideValue }) => (
              <Box
                key={key}
                className={`${fieldClassName || ""} ${
                  fieldClassNames[key] || ""
                }`}
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent:
                    hideLabel || hideValue ? "center" : "space-between",
                  minHeight: 20,
                  background: "transparent",
                }}>
                {!hideLabel && (
                  <div
                    className={`${labelClassName || ""} ${
                      labelClassNames[key] || ""
                    } flex items-center justify-start ${
                      hideValue ? "justify-center w-full text-center" : ""
                    }`}
                    style={{
                      textAlign: hideValue ? "center" : "left",
                      width: hideValue ? "100%" : "50%",
                    }}>
                    <Label
                      className={`font-semibold ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      } text-xs leading-tight`}>
                      {formatKey(key)}
                    </Label>
                  </div>
                )}
                {!hideValue && (
                  <Box
                    className={`w-1/2 break-words flex items-center ${
                      hideLabel
                        ? "justify-center w-full text-center"
                        : "text-right justify-end"
                    } ${theme === "dark" ? "text-white" : "text-gray-900"} ${
                      valueClassName || ""
                    } ${valueClassNames[key] || ""}`}
                    sx={{
                      textAlign: hideLabel ? "center" : "right",
                      width: hideLabel ? "100%" : "50%",
                      ...getValueSxStyles(key),
                    }}>
                    {value}
                  </Box>
                )}
              </Box>
            ))}
          </Box>

          {(allActions.length > 0 || selectable) && (
            <Box
              className={actionsClassName}
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1.5,
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${
                  theme === "dark" ? "#374151" : "#e5e7eb"
                }`,
              }}>
              {/* Bên trái: Checkbox */}
              {selectable && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Checkbox
                    checked={selected}
                    onChange={handleSelectionChange}
                    size="small"
                    sx={{
                      color: theme === "dark" ? "#ffffff" : "#000000",
                      "&.Mui-checked": {
                        color: theme === "dark" ? "#90caf9" : "#1976d2",
                      },
                      "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
                    }}
                  />
                  <span
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}>
                    Chọn
                  </span>
                </Box>
              )}

              {/* Bên phải: Hành động */}
              {allActions.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    flexWrap: "wrap",
                  }}>
                  {allActions.map((action, index) => (
                    <Tooltip key={index} title={action.label} arrow>
                      <IconButton
                        size="small"
                        onClick={() => action.onClick(data)}
                        className={`${actionButtonClassName || ""} ${
                          action.className || ""
                        }`}
                        sx={{
                          minWidth: 32,
                          height: 32,
                          color: getActionColor(action.color, theme),
                          backgroundColor: getActionBackground(
                            action.color,
                            theme
                          ),
                          border: `1px solid ${getActionBorder(
                            action.color,
                            theme
                          )}`,
                          borderRadius: 1.5,
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: getActionHoverBackground(
                              action.color,
                              theme
                            ),
                            borderColor: getActionHoverBorder(
                              action.color,
                              theme
                            ),
                            transform: "scale(1.05)",
                          },
                          "& .MuiSvgIcon-root": { fontSize: "1.1rem" },
                        }}>
                        {action.icon}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Helper functions for action button styles
const getActionButtonStyle = (color?: ActionColor, theme?: string) => {
  const baseStyle =
    theme === "dark"
      ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
      : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200";

  switch (color) {
    case "primary":
      return theme === "dark"
        ? "bg-blue-900/30 text-blue-400 border-blue-700 hover:bg-blue-900/50"
        : "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200";
    case "error":
      return theme === "dark"
        ? "bg-red-900/30 text-red-400 border-red-700 hover:bg-red-900/50"
        : "bg-red-100 text-red-600 border-red-300 hover:bg-red-200";
    case "info":
      return theme === "dark"
        ? "bg-cyan-900/30 text-cyan-400 border-cyan-700 hover:bg-cyan-900/50"
        : "bg-cyan-100 text-cyan-600 border-cyan-300 hover:bg-cyan-200";
    case "secondary":
      return theme === "dark"
        ? "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600"
        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200";
    default:
      return baseStyle;
  }
};

const getActionColor = (color?: ActionColor, theme?: string) => {
  if (!color) return theme === "dark" ? "#ffffff" : "#000000";
  const colors: Record<ActionColor, string> = {
    primary: theme === "dark" ? "#90caf9" : "#1976d2",
    error: theme === "dark" ? "#f44336" : "#d32f2f",
    info: theme === "dark" ? "#29b6f6" : "#0288d1",
    secondary: theme === "dark" ? "#9e9e9e" : "#757575",
    warning: theme === "dark" ? "#ffb74d" : "#f57c00",
    success: theme === "dark" ? "#66bb6a" : "#2e7d32",
  };
  return colors[color];
};

const getActionBackground = (color?: ActionColor, theme?: string) => {
  if (!color)
    return theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
  return `${getActionColor(color, theme)}33`;
};

const getActionBorder = (color?: ActionColor, theme?: string) => {
  if (!color)
    return theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)";
  return `${getActionColor(color, theme)}66`;
};

const getActionHoverBackground = (color?: ActionColor, theme?: string) => {
  if (!color)
    return theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)";
  return `${getActionColor(color, theme)}4D`;
};

const getActionHoverBorder = (color?: ActionColor, theme?: string) => {
  if (!color)
    return theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)";
  return getActionColor(color, theme);
};

export default CardMobile;
