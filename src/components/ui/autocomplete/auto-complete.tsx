import { useState, useRef, useEffect, KeyboardEvent } from "react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  // keep options in sync if parent changes static options
  useEffect(() => {
    setLocalOptions(options || []);
  }, [options]);

  // debounce for fetchOptions
  useEffect(() => {
    if (!fetchOptions) return;
    if (query === "") {
      setLocalOptions(options || []);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    const id = setTimeout(() => {
      fetchOptions(query)
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
  }, [query, fetchOptions, debounceMs, options]);

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

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
  }

  function closeDropdown() {
    setOpen(false);
    setHighlightIndex(0);
    setQuery("");
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDropdown();
      }
    }

    if (open) {
      window.addEventListener("click", onClick);
      window.addEventListener("keydown", onKeyDown as any);
    }

    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown as any);
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

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 flex-wrap border rounded-lg px-2 py-1 min-h-[44px] border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 ${
          disabled ? "bg-gray-100/70" : "bg-white"
        } `}
        onClick={() => inputRef.current?.focus()}
        role="combobox"
        aria-expanded={open}>
        {value.map((val) => (
          <div
            key={val.value}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md border bg-gray-100 text-sm">
            <span className="truncate max-w-[160px]">{val.label}</span>
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
          onBlur={() => {
            // Delay để cho phép click vào option trước khi đóng
            setTimeout(() => {
              if (!containerRef.current?.contains(document.activeElement)) {
                closeDropdown();
              }
            }, 150);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlightIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] outline-none p-1 text-sm bg-transparent"
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
            className="px-2 py-1 rounded">
            <ArrowDropDownIcon />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border rounded shadow-lg max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No options</div>
          ) : (
            <ul role="listbox" aria-multiselectable className="divide-y">
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
                  className={`px-3 py-2 cursor-pointer flex items-center justify-between text-sm ${
                    idx === highlightIndex ? "bg-blue-50" : ""
                  }`}>
                  <span className="truncate">{opt.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
