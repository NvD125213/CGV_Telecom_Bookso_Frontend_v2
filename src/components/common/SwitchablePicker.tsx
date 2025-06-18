import React, { useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
  DateTimePicker,
} from "@mui/x-date-pickers";
import { useTheme } from "../../context/ThemeContext";

type PickerType = "time" | "date" | "datetime" | "month" | "year";

interface PickerWithTypeProps {
  type: PickerType;
  onChange: (value: Date | null) => void;
  value?: Date | null;
}

const PickerWithType: React.FC<PickerWithTypeProps> = ({
  type,
  onChange,
  value,
}) => {
  const textFieldStyles = {
    "& .MuiInputBase-root": {
      height: 42,
      fontSize: "0.875rem",
      paddingRight: "8px",
    },
    "& .MuiInputBase-input": {
      padding: "10px 12px",
      height: "auto",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.875rem",
      transform: "translate(14px, 12px) scale(1)",
      "&.MuiInputLabel-shrink": {
        transform: "translate(14px, -6px) scale(0.75)",
      },
    },
    "& .MuiInputAdornment-root": {
      marginLeft: "4px",
    },
    "& .MuiOutlinedInput-root": {
      paddingRight: "8px",
    },
    width: 200,
  };

  const commonProps = {
    onChange,
    value,
    size: "small" as const,
    slotProps: {
      textField: {
        size: "small" as const,
        sx: textFieldStyles,
        className: `rounded-lg border shadow-theme-xs placeholder:text-gray-400 focus:outline-none focus:ring-2`,
      },
    },
  };

  switch (type) {
    case "time":
      return <TimePicker {...commonProps} />;
    case "date":
      return <DatePicker {...commonProps} />;
    case "datetime":
      return <DateTimePicker {...commonProps} />;
    case "month":
      return <DatePicker {...commonProps} views={["year", "month"]} />;
    case "year":
      return <DatePicker {...commonProps} views={["year"]} />;
    default:
      return <DatePicker {...commonProps} />;
  }
};

interface PickerDateTimeProps {
  value?: Date | null;
  onChange?: (value: Date | null) => void;
  onTypeChange?: (type: PickerType) => void;
}

const SwitchablePicker: React.FC<PickerDateTimeProps> = ({
  value,
  onChange,
  onTypeChange,
}) => {
  const [type, setType] = useState<PickerType>("date");
  const [internalValue, setInternalValue] = useState<Date | null>(null);
  const { theme } = useTheme();

  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: theme === "light" ? "#3b82f6" : "#60a5fa",
      },
      background: {
        default: theme === "light" ? "#ffffff" : "#1f2937",
        paper: theme === "light" ? "#ffffff" : "#374151",
      },
      text: {
        primary: theme === "light" ? "#1f2937" : "#e5e7eb",
        secondary: theme === "light" ? "#6b7280" : "#9ca3af",
      },
    },
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              backgroundColor: theme === "light" ? "transparent" : "#374151",
              borderColor: theme === "light" ? "#d1d5db" : "#4b5563",
              "&:hover": {
                borderColor: theme === "light" ? "#3b82f6" : "#60a5fa",
              },
              "&.Mui-focused": {
                borderColor: theme === "light" ? "#3b82f6" : "#60a5fa",
                boxShadow: `0 0 0 2px ${
                  theme === "light"
                    ? "rgba(59, 130, 246, 0.2)"
                    : "rgba(96, 165, 250, 0.2)"
                }`,
              },
            },
            "& .MuiInputLabel-root": {
              color: theme === "light" ? "#6b7280" : "#9ca3af",
              "&.Mui-focused": {
                color: theme === "light" ? "#3b82f6" : "#60a5fa",
              },
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            backgroundColor: theme === "light" ? "transparent" : "#374151",
            borderColor: theme === "light" ? "#d1d5db" : "#4b5563",
            "&:hover": {
              borderColor: theme === "light" ? "#3b82f6" : "#60a5fa",
            },
            "&.Mui-focused": {
              borderColor: theme === "light" ? "# cabins3b82f6" : "#60a5fa",
              boxShadow: `0 0 0 2px ${
                theme === "light"
                  ? "rgba(59, 130, 246, 0.2)"
                  : "rgba(96, 165, 250, 0.2)"
              }`,
            },
          },
        },
      },
    },
  });

  const handleChangeType = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newType = event.target.value as PickerType;
    setType(newType);
    if (onTypeChange) onTypeChange(newType);
  };

  const handleChange = (val: Date | null) => {
    if (onChange) {
      onChange(val);
    } else {
      setInternalValue(val);
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box
          display="flex"
          zIndex={0}
          gap={2}
          alignItems="center"
          sx={{ bgcolor: "background.default" }}>
          <FormControl size="small">
            <Select
              id="picker-type"
              value={type}
              onChange={handleChangeType as any}
              sx={{
                height: 40,
                fontSize: "0.875rem",
                bgcolor: "background.paper",
                color: "text.primary",
              }}>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          <PickerWithType
            type={type}
            onChange={handleChange}
            value={onChange ? value : internalValue}
          />
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default SwitchablePicker;
