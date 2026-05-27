import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IoClose } from "react-icons/io5";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { Option } from "../ui/autocomplete/auto-complete";

type AutoSelectProps = {
  options?: Option[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string, option: Option | null) => void;
  className?: string;
  disabled?: boolean;

  /** Disable nhưng vẫn giữ nền trắng */
  disabledWhite?: boolean;

  /** Gọi API khi search */
  fetchOptions?: (search: string) => Promise<Option[]>;

  debounceMs?: number;

  /** Parent fetch */
  onSearchChange?: (search: string) => void;

  onOpenChange?: (open: boolean) => void;

  loading?: boolean;

  /** Hiển thị nút xóa lựa chọn (mặc định: true) */
  clearable?: boolean;
};

export default function AutoSelect({
  options = [],
  placeholder = "Chọn một tùy chọn",
  value = "",
  onChange,
  className = "",
  disabled = false,
  disabledWhite = false,
  fetchOptions,
  debounceMs = 300,
  onSearchChange,
  onOpenChange,
  loading: loadingProp = false,
  clearable = true,
}: AutoSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [asyncOptions, setAsyncOptions] = useState<Option[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  const loading = loadingProp || fetchLoading;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const staticOptions = useMemo(
    () => options.filter((item) => item.value !== ""),
    [options],
  );

  const mergeOptions = useCallback(
    (...lists: Option[][]) => {
      const map = new Map<string, Option>();

      lists.flat().forEach((item) => {
        map.set(String(item.value), item);
      });

      if (value && !map.has(String(value))) {
        const fromStatic = staticOptions.find(
          (o) => String(o.value) === String(value),
        );

        map.set(
          String(value),
          fromStatic ?? {
            label: String(value),
            value,
          },
        );
      }

      return Array.from(map.values());
    },
    [staticOptions, value],
  );

  const selectDisplayOptions = useMemo(
    () =>
      onSearchChange
        ? mergeOptions(staticOptions)
        : mergeOptions(staticOptions, asyncOptions),
    [mergeOptions, staticOptions, asyncOptions, onSearchChange],
  );

  const setOpenState = useCallback(
    (next: boolean) => {
      setOpen(next);

      onOpenChange?.(next);

      if (!next) {
        setQuery("");
        onSearchChange?.("");
      }
    },
    [onOpenChange, onSearchChange],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpenState(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpenState]);

  useEffect(() => {
    if (!open) return;

    setQuery("");

    const id = window.setTimeout(() => {
      panelRef.current?.querySelector("input")?.focus();
    }, 0);

    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open || !onSearchChange) return;

    const id = window.setTimeout(() => {
      onSearchChange(query.trim());
    }, debounceMs);

    return () => window.clearTimeout(id);
  }, [query, open, onSearchChange, debounceMs]);

  useEffect(() => {
    if (!fetchOptions || !open || onSearchChange) return;

    let mounted = true;

    setFetchLoading(true);

    const id = window.setTimeout(() => {
      fetchOptions(query.trim())
        .then((res) => {
          if (!mounted) return;

          setAsyncOptions(res ?? []);
        })
        .catch(() => {
          if (!mounted) return;

          setAsyncOptions([]);
        })
        .finally(() => {
          if (mounted) {
            setFetchLoading(false);
          }
        });
    }, debounceMs);

    return () => {
      mounted = false;
      window.clearTimeout(id);
    };
  }, [query, open, fetchOptions, onSearchChange, debounceMs]);

  const filteredOptions = useMemo(() => {
    if (fetchOptions && !onSearchChange) {
      return mergeOptions(asyncOptions);
    }

    if (onSearchChange) {
      return mergeOptions(staticOptions);
    }

    const q = query.trim().toLowerCase();

    if (!q) return staticOptions;

    return staticOptions.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        String(item.value).toLowerCase().includes(q),
    );
  }, [
    fetchOptions,
    onSearchChange,
    mergeOptions,
    asyncOptions,
    staticOptions,
    query,
  ]);

  const handleSelect = (option: Option) => {
    onChange?.(option.value, option);
    setOpenState(false);
  };

  const handleToggle = () => {
    if (disabled) return;

    setOpenState(!open);
  };

  const hasValue = Boolean(value);
  const showClear =
    clearable && hasValue && !disabled && !disabledWhite;

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.("", null);
    setOpenState(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`relative ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (disabled) return;

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }

          if (e.key === "Escape") {
            setOpenState(false);
          }
        }}>
        <Select
          options={selectDisplayOptions}
          value={value}
          placeholder={placeholder}
          onChange={() => {}}
          disabled={disabled}
          disabledWhite={disabledWhite}
          className={`pointer-events-none ${showClear ? "!pr-16" : ""}`}
        />

        {showClear && (
          <button
            type="button"
            aria-label="Xóa lựa chọn"
            title="Xóa lựa chọn"
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}>
            <IoClose size={18} />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div
          ref={panelRef}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-300 bg-white shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
          <div
            className="border-b border-gray-200 p-2 dark:border-gray-700"
            onMouseDown={(e) => e.stopPropagation()}>
            <Input
              type="text"
              value={query}
              placeholder="Tìm kiếm..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setOpenState(false);
                }
              }}
              className="!shadow-none"
            />
          </div>

          <div role="listbox" className="max-h-48 overflow-auto">
            {loading ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Đang tải...
              </div>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = String(value) === String(option.value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition ${
                      active
                        ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                    }`}>
                    <span className="truncate">{option.label}</span>

                    {active && (
                      <span className="ml-2 shrink-0 text-brand-500">✓</span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                Không tìm thấy dữ liệu
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
