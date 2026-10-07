import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export interface Option {
  label: string;
  value: string;
}

interface AutocompleteMultipleProps {
  options: Option[]; // full list or local list
  value?: Option[]; // selected values
  onChange?: (value: Option[]) => void;
  placeholder?: string;
  /**
   * Optional async search function. If provided it should return a Promise<Option[]>
   * Example: async (q) => fetch(`/api/search?q=${q}`).then(r=>r.json())
   */
  fetchOptions?: (query: string) => Promise<Option[]>;
  debounceMs?: number;
  freeSolo?: boolean; // allow custom values typed by user
  disabled?: boolean;
  className?: string;
}

type DropdownRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

export default function AutocompleteMultiple({
  options,
  value = [],
  onChange,
  placeholder = "Search...",
  fetchOptions,
  debounceMs = 300,
  freeSolo = false,
  disabled = false,
  className = "",
}: AutocompleteMultipleProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localOptions, setLocalOptions] = useState<Option[]>(options || []);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [dropdownRect, setDropdownRect] = useState<DropdownRect | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const optionsRef = useRef<Option[]>(options || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    optionsRef.current = options || [];
  }, [options]);

  // Sync options từ parent khi chưa gõ tìm
  useEffect(() => {
    if (query.trim()) return;
    setLocalOptions(options || []);
  }, [options, query]);

  // Gõ tìm → fetch. Query rỗng: dùng options parent; nếu parent chưa có data thì bootstrap 1 lần.
  useEffect(() => {
    if (!fetchOptions || !open) return;
    const q = query.trim();
    if (!q) {
      const cached = optionsRef.current;
      if (cached.length > 0) {
        setLocalOptions(cached);
        setLoading(false);
        return;
      }
      // Parent chưa kịp load (hoặc cache bị clear) → fetch bootstrap
      let mounted = true;
      setLoading(true);
      fetchOptions("")
        .then((res) => {
          if (!mounted) return;
          setLocalOptions(res?.length ? res : optionsRef.current);
        })
        .catch(() => {
          if (!mounted) return;
          setLocalOptions(optionsRef.current);
        })
        .finally(() => mounted && setLoading(false));
      return () => {
        mounted = false;
      };
    }

    let mounted = true;
    setLoading(true);
    const id = setTimeout(() => {
      fetchOptions(q)
        .then((res) => {
          if (!mounted) return;
          setLocalOptions(res || []);
        })
        .catch(() => {
          if (!mounted) return;
          setLocalOptions([]);
        })
        .finally(() => mounted && setLoading(false));
    }, debounceMs);
    return () => {
      mounted = false;
      clearTimeout(id);
    };
  }, [open, query, fetchOptions, debounceMs]);

  // filtered options when not using fetchOptions
  const filtered = (
    fetchOptions
      ? localOptions
      : localOptions.filter((o) => {
          const q = query.trim().toLowerCase();
          if (!q) return true;
          return (
            o.label.toLowerCase().includes(q) ||
            String(o.value).toLowerCase().includes(q)
          );
        })
  ).filter((o) => !value.some((v) => v.value === o.value));

  const updateDropdownPosition = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const maxMenuHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      120,
      Math.min(maxMenuHeight, openUp ? spaceAbove : spaceBelow),
    );
    setDropdownRect({
      top: openUp ? rect.top - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      maxHeight,
      openUp,
    });
  };

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
    setHighlightIndex(0);
    setQuery("");
    setDropdownRect(null);
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateDropdownPosition();
    const onReposition = () => updateDropdownPosition();
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, filtered.length, loading]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      closeDropdown();
    }

    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        closeDropdown();
      }
    }

    if (open) {
      window.addEventListener("mousedown", onClick);
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectOption(opt: Option) {
    const next = [...value, opt];
    onChange?.(next);
    setQuery("");
    // keep dropdown open for further picks
    openDropdown();
    inputRef.current?.focus();
  }

  function removeValue(val: Option) {
    const next = value.filter((v) => v.value !== val.value);
    onChange?.(next);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
      openDropdown();
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (open && filtered[highlightIndex]) {
        selectOption(filtered[highlightIndex]);
        return;
      }
      // enter to add freeSolo
      if (freeSolo && query.trim() !== "") {
        const newOpt: Option = { label: query.trim(), value: query.trim() };
        selectOption(newOpt);
      }
    }
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      // remove last
      removeValue(value[value.length - 1]);
    }
    if (e.key === "Escape") {
      closeDropdown();
    }
  }

  const dropdown =
    open && dropdownRect && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            className="rounded border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            style={{
              position: "fixed",
              zIndex: 200,
              left: dropdownRect.left,
              width: dropdownRect.width,
              maxHeight: dropdownRect.maxHeight,
              overflow: "auto",
              ...(dropdownRect.openUp
                ? { bottom: window.innerHeight - dropdownRect.top }
                : { top: dropdownRect.top }),
            }}>
            {loading && filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                Đang tải...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                Không có kết quả
              </div>
            ) : (
              <ul role="listbox" aria-multiselectable className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((opt, idx) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={false}
                    onMouseDown={(e) => {
                      // use onMouseDown to prevent blur before click
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ${
                      idx === highlightIndex
                        ? "bg-blue-50 dark:bg-gray-800"
                        : ""
                    }`}>
                    <span className="truncate">{opt.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex min-h-[44px] flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-2 py-1 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 ${
          disabled ? "bg-gray-100/70" : "bg-white dark:bg-gray-900"
        } `}
        onClick={() => inputRef.current?.focus()}
        role="combobox"
        aria-expanded={open}>
        {value.map((val) => (
          <div
            key={val.value}
            className="flex items-center gap-1 rounded-md border bg-gray-100 px-2 py-0.5 text-sm dark:border-gray-600 dark:bg-gray-800">
            <span className="max-w-[160px] truncate">{val.label}</span>
            <button
              type="button"
              aria-label={`Remove ${val.label}`}
              onClick={(e) => {
                e.stopPropagation();
                removeValue(val);
              }}
              className="text-xs leading-none">
              ✕
            </button>
          </div>
        ))}

        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          onFocus={() => openDropdown()}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent p-1 text-sm outline-none"
        />

        {loading ? (
          <div className="text-sm">…</div>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (open) closeDropdown();
              else openDropdown();
            }}
            aria-label={open ? "Close" : "Open"}
            className="rounded px-2 py-1">
            <ArrowDropDownIcon />
          </button>
        )}
      </div>

      {dropdown}
    </div>
  );
}
