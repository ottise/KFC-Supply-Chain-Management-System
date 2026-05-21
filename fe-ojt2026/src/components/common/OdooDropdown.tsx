"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Plus, Loader2 } from 'lucide-react';

interface OdooDropdownProps<T> {
  items: T[];
  value: T | null;
  onChange: (item: T) => void;
  displayField: keyof T;
  secondaryField?: keyof T;
  placeholder?: string;
  onCreateNew?: () => void;
  renderOption?: (item: T) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  /** Gắn vào nút trigger (mặc định h-14); dùng để compact từng dropdown, ví dụ `!h-8 !px-2.5 !rounded-md` */
  triggerClassName?: string;
  loading?: boolean;
  portal?: boolean;
  width?: string;
  showClearButton?: boolean;
  listMaxHeight?: string;
  showSearch?: boolean;
  /** Mặc định true: ẩn secondary (mã SP, v.v.) trên trigger; vẫn dùng để lọc và trong danh sách. Đặt false để hiện badge trên nút. */
  hideSecondaryInTrigger?: boolean;
}

export function OdooDropdown<T extends object>({
  items,
  value,
  onChange,
  displayField,
  secondaryField,
  placeholder = "Chọn...",
  onCreateNew,
  renderOption,
  disabled = false,
  className = "",
  triggerClassName = "",
  loading = false,
  portal = false,
  width,
  showClearButton = true,
  listMaxHeight = "max-h-[300px]",
  showSearch = true,
  hideSecondaryInTrigger = true,
}: OdooDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownEntered, setDropdownEntered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top?: number, bottom?: number, left: number, width: number }>({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter items based on search
  const filteredItems = items.filter((item) => {
    const typedItem = item as Record<string, unknown>;
    const displayValue = String(typedItem[String(displayField)] || "").toLowerCase();
    const secondaryValue = secondaryField
      ? String(typedItem[String(secondaryField)] || "").toLowerCase()
      : "";
    const search = debouncedSearch.toLowerCase();
    return displayValue.includes(search) || secondaryValue.includes(search);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);

      if (isOutsideContainer && (!portal || isOutsideDropdown)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [portal]);


  const updatePosition = useCallback(() => {
    if (isOpen && portal && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen, portal]);

  // Update position when opened
  React.useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition, filteredItems.length]);

  // Listen for scroll and resize to keep portal aligned
  useEffect(() => {
    if (isOpen && portal) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, portal, updatePosition]);

  // Khi mở dropdown, nhảy highlight vào item đang chọn (nếu có)
  // Dùng useLayoutEffect để tránh cascading render — đây là cập nhật đồng bộ với layout, không phải side-effect
  React.useLayoutEffect(() => {
    if (!isOpen) return;

    if (!value) {
      setHighlightedIndex(0);
      return;
    }

    const selectedIndex = filteredItems.findIndex((item) => {
      const itemDisplay = String((item as Record<string, unknown>)[String(displayField)] || "");
      const valueDisplay = String((value as Record<string, unknown>)[String(displayField)] || "");
      const displayMatched = itemDisplay === valueDisplay;

      if (!secondaryField) return displayMatched;

      const itemSecondary = String((item as Record<string, unknown>)[String(secondaryField)] || "");
      const valueSecondary = String((value as Record<string, unknown>)[String(secondaryField)] || "");
      return displayMatched && itemSecondary === valueSecondary;
    });

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
  }, [isOpen, value, filteredItems, displayField, secondaryField]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  React.useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setDropdownEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        setDropdownEntered(false);
      }
      setIsOpen(!isOpen);
      if (!isOpen && showSearch) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    }
  };

  const handleSelect = useCallback((item: T) => {
    onChange(item);
    setIsOpen(false);
    setSearchTerm("");
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchTerm("");
    if (value) {
      onChange({} as T);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filteredItems[highlightedIndex]) {
          handleSelect(filteredItems[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchTerm("");
        break;
    }
  };

  const displayValue = value ? String((value as Record<string, unknown>)[String(displayField)] || "") : "";
  const secondaryValue = value && secondaryField ? String((value as Record<string, unknown>)[String(secondaryField)] || "") : "";

  const renderDropdownContent = () => (
    <>
      {debouncedSearch && (
        <div className="px-5 py-2.5 bg-gray-50/40 backdrop-blur-md border-b border-gray-100/50">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.1em]">
            Tìm thấy {filteredItems.length} kết quả cho &quot;{debouncedSearch}&quot;
          </span>
        </div>
      )}

      <ul
        ref={listRef}
        className={`${listMaxHeight} overflow-y-auto py-2 no-scrollbar`}
        role="listbox"
      >
        {loading ? (
          <li className="px-6 py-8 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[#E4002B]" />
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Đang tải biểu mẫu...</span>
          </li>
        ) : filteredItems.length === 0 ? (
          <li className="px-6 py-10 text-center flex flex-col items-center gap-2">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Không tìm thấy</span>
          </li>
        ) : (
          filteredItems.map((item, index) => {
            const isSelected =
              value &&
              String((value as Record<string, unknown>)[String(displayField)]) === String((item as Record<string, unknown>)[String(displayField)]) &&
              (!secondaryField || String((value as Record<string, unknown>)[String(secondaryField)]) === String((item as Record<string, unknown>)[String(secondaryField)]));
            const isHighlighted = index === highlightedIndex;

            return (
              <li
                key={`${String((item as Record<string, unknown>)[String(displayField)])}-${index}`}
                onClick={() => handleSelect(item)}
                className={`
                  px-6 py-3 cursor-pointer transition-all duration-300 mx-2 rounded-xl mb-1.5 flex items-center justify-between group relative overflow-hidden
                  ${isSelected
                    ? "bg-linear-to-r from-red-50 to-white/50 text-[#E4002B] shadow-[2px_4px_12px_-4px_rgba(228,0,43,0.15)] ring-1 ring-red-100/20"
                    : "text-gray-500 hover:text-[#E4002B]"}
                  ${isHighlighted && !isSelected ? "bg-linear-to-r from-gray-50 to-white/30" : ""}
                `}
                role="option"
                aria-selected={isSelected || undefined}
              >
                {/* Sleek accent bar indicator */}
                <div className={`absolute left-0 w-[3px] rounded-r-full bg-[#E4002B] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isSelected ? "top-2.5 bottom-2.5 opacity-100 shadow-[1px_0_8px_rgba(228,0,43,0.4)]" : "top-1/2 bottom-1/2 opacity-0 group-hover:top-4 group-hover:bottom-4 group-hover:opacity-40"}`}
                />

                {/* Subtle shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                {renderOption ? (
                  renderOption(item)
                ) : (
                  <>
                    <div className="flex flex-col min-w-0 z-10">
                      <span className={`text-[10px] tracking-[0.02em] truncate transition-colors duration-300 ${isSelected ? "font-semibold text-red-600" : "font-medium text-gray-700 group-hover:text-red-600"}`}>
                        {String((item as Record<string, unknown>)[String(displayField)] || "")}
                      </span>
                      {secondaryField && Boolean((item as Record<string, unknown>)[String(secondaryField)]) && (
                        <span
                          className={`mt-1 inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[9px] leading-none tracking-[0.03em] transition-all duration-300 ${isSelected
                            ? "border-rose-200/80 bg-linear-to-r from-rose-50 via-white to-amber-50 text-rose-700 font-bold shadow-[0_1px_2px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-rose-100/70"
                            : "border-slate-200/80 bg-linear-to-r from-slate-50 to-white text-slate-700 font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] group-hover:border-rose-200/70 group-hover:from-rose-50 group-hover:to-orange-50 group-hover:text-rose-600"
                            }`}
                        >
                          {String((item as Record<string, unknown>)[String(secondaryField)])}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 bg-[#E4002B] rounded-full shadow-[0_0_10px_rgba(228,0,43,0.5)] z-10" />
                    )}
                  </>
                )}
              </li>
            );
          })
        )}
      </ul>

      {onCreateNew && (
        <div className="p-2 border-t border-gray-100/50 bg-gray-50/20 backdrop-blur-sm">
          <button
            onClick={() => {
              onCreateNew();
              setIsOpen(false);
              setSearchTerm("");
            }}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-[#E4002B] bg-white/80 rounded-xl border border-dashed border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-sm transition-all font-black uppercase text-[10px] tracking-widest group"
          >
            <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
            <span>Thêm mới</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div
      ref={containerRef}
      className={`relative ${className} min-w-0 max-w-full shrink-0 flex-none overflow-visible ${isOpen ? "z-50" : "z-10"}`}
      onKeyDown={handleKeyDown}
      style={{
        width: width || undefined,
        minWidth: width || undefined,
        maxWidth: width || undefined,
        isolation: 'isolate'
      }}
    >
      <div
        onClick={handleToggle}
        className={`
          w-full bg-gray-50/50 border border-gray-100 transition-all duration-300
          rounded-[1.5rem] px-6 h-14 overflow-hidden
          text-[10px] tracking-normal outline-none cursor-pointer
          flex items-center justify-between gap-2
          ${disabled
            ? "opacity-50 cursor-not-allowed kfc-form-field-shadow"
            : "hover:bg-gray-50 hover:border-red-100/40 hover:shadow-[0_8px_24px_-12px_rgba(228,0,43,0.12)]"}
          ${isOpen
            ? "border-red-200 bg-gray-50 shadow-[0_10px_26px_-14px_rgba(228,0,43,0.16)] ring-2 ring-red-50/40"
            : !disabled ? "kfc-form-field-shadow" : ""}
          ${triggerClassName}
        `}
      >
        <div className="flex-1 flex items-center gap-3 min-w-0 overflow-hidden">
          {isOpen && showSearch ? (
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <Search className="w-4 h-4 text-[#E4002B] shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(0); }}
                placeholder={displayValue || placeholder}
                className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold tracking-normal text-gray-800 placeholder:text-gray-400 min-w-0 truncate"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 overflow-hidden">
              {value && Object.keys(value).length > 0 ? (
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  {secondaryField && secondaryValue && !hideSecondaryInTrigger && (
                    <span className="shrink-0 whitespace-nowrap rounded-full border border-gray-100/50 bg-gray-50/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-gray-400">
                      {secondaryValue}
                    </span>
                  )}
                  <span
                    className="odoo-dropdown-value min-w-0 flex-1 text-left text-[10px] font-bold leading-snug text-gray-800 line-clamp-2 break-words"
                    title={displayValue || undefined}
                  >
                    {displayValue}
                  </span>
                </div>
              ) : (
                <span className="odoo-dropdown-placeholder text-[10px] font-medium text-gray-400 truncate block">
                  {placeholder}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2 pr-1.5">
          {showClearButton && value && Object.keys(value).length > 0 && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors group/clear"
            >
              <X className="w-3.5 h-3.5 text-gray-300 group-hover/clear:text-red-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-all duration-300 ease-out ${isOpen ? "rotate-180 text-[#E4002B] scale-110" : ""
              }`}
          />
        </div>
      </div>

      {isOpen && (
        portal ? (
          dropdownPosition.width > 0 && createPortal(
            <div
              ref={dropdownRef}
              className={`fixed z-[9999] bg-white rounded-[1.75rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden transition-opacity duration-220 ease-out will-change-opacity ${dropdownEntered ? "opacity-100" : "opacity-0"}` }
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxWidth: dropdownPosition.width,
                minWidth: dropdownPosition.width
              }}
            >
              <div className="relative z-10">
                {renderDropdownContent()}
              </div>
            </div>,
            document.body
          )
        ) : (
          <div
            ref={dropdownRef}
            className={`absolute z-50 w-full mt-3 bg-white rounded-[1.75rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden transition-opacity duration-220 ease-out will-change-opacity ${dropdownEntered ? "opacity-100" : "opacity-0"}` }
          >
            <div className="relative z-10">
              {renderDropdownContent()}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default OdooDropdown;
