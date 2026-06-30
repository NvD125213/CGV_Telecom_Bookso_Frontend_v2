import React, { useState } from "react";
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  createTheme,
  ThemeProvider,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
  DateTimePicker,
} from "@mui/x-date-pickers";
import { useTheme } from "../../context/ThemeContext";

export type PickerType = "time" | "date" | "datetime" | "month" | "year";

function getFormFieldBaseSx(mode: "light" | "dark"): SystemStyleObject<Theme> {
  return {
    height: 44,
    fontSize: "0.875rem",
    backgroundColor: mode === "light" ? "transparent" : "#111827",
    color: mode === "light" ? "#1f2937" : "rgba(255, 255, 255, 0.9)",
    "& .MuiInputBase-input": {
      padding: "10px 16px",
      height: "auto",
    },
    "& .MuiSelect-select": {
      padding: "10px 16px",
      minHeight: "auto",
    },
  };
}

function getSelectFieldSx(mode: "light" | "dark"): SystemStyleObject<Theme> {
  const borderColor = mode === "light" ? "#d1d5db" : "#374151";
  const focusBorder = mode === "light" ? "#9cb9ff" : "#7592ff";
  const focusRing =
    mode === "light" ? "rgba(70, 95, 255, 0.1)" : "rgba(70, 95, 255, 0.2)";

  return {
    ...getFormFieldBaseSx(mode),
    borderRadius: "0.5rem",
    boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor,
      borderRadius: "0.5rem",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor,
    },
    "&.Mui-focused": {
      boxShadow: `0 0 0 3px ${focusRing}`,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: focusBorder,
      borderWidth: 1,
    },
  };
}

function getPickerTextFieldSx(mode: "light" | "dark"): SxProps<Theme> {
  return {
    width: "100%",
    borderRadius: "0.5rem",
    paddingY: "2px",
    "& .MuiOutlinedInput-root": {
      ...getFormFieldBaseSx(mode),
      "& .MuiOutlinedInput-notchedOutline": {
        border: "none",
      },
    },
    "& .MuiInputAdornment-root": {
      marginLeft: "4px",
    },
  };
}

interface PickerWithTypeProps {
  type: PickerType;
  onChange: (value: Date | null) => void;
  value?: Date | null;
  fieldSx: SxProps<Theme>;
}

const PickerWithType: React.FC<PickerWithTypeProps> = ({
  type,
  onChange,
  value,
  fieldSx,
}) => {
  const commonProps = {
    onChange,
    value,
    size: "small" as const,
    slotProps: {
      textField: {
        size: "small" as const,
        fullWidth: true,
        sx: fieldSx,
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
  pickerType?: PickerType;
}

const SwitchablePicker: React.FC<PickerDateTimeProps> = ({
  value,
  onChange,
  onTypeChange,
  pickerType: pickerTypeProp,
}) => {
  const [internalType, setInternalType] = useState<PickerType>("date");
  const type = pickerTypeProp ?? internalType;
  const [internalValue, setInternalValue] = useState<Date | null>(null);
  const { theme } = useTheme();
  const selectFieldSx = getSelectFieldSx(theme);
  const pickerFieldSx = getPickerTextFieldSx(theme);

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
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: "0.5rem",
          },
          notchedOutline: {
            borderRadius: "0.5rem",
          },
        },
      },
    },
  });

  const handleChangeType = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newType = event.target.value as PickerType;
    if (pickerTypeProp === undefined) {
      setInternalType(newType);
    }
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
          sx={{
            bgcolor: "background.default",
            width: "100%",
          }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              id="picker-type"
              value={type}
              onChange={handleChangeType as any}
              sx={{ ...selectFieldSx }}>
              <MenuItem value="date">Ngày</MenuItem>
              <MenuItem value="month">Tháng</MenuItem>
              <MenuItem value="year">Năm</MenuItem>
            </Select>
          </FormControl>
          <div className="w-full">
            <PickerWithType
              type={type}
              onChange={handleChange}
              value={onChange ? value : internalValue}
              fieldSx={pickerFieldSx}
            />
          </div>
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default SwitchablePicker;
