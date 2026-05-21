"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, ChevronDown } from 'lucide-react';

interface OdooComboboxProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  recentItems?: string[];
  maxRecentItems?: number;
  onClearRecent?: () => void;
}

function OdooCombobox({
  value,
  onChange,
  suggestions = [],
  placeholder = "Enter text...",
  disabled = false,
  className = "",
  recentItems = [],
  maxRecentItems = 5,
  onClearRecent,
}: OdooComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Sync internal state with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase())
  ).slice(0, 10);

  // Get recent items that match current input
  const matchingRecentItems = recentItems
    .filter((item) => item.toLowerCase().includes(inputValue.toLowerCase()))
    .slice(0, maxRecentItems);

  // Determine if we should show the dropdown
  const showDropdown = isOpen && (inputValue.length > 0 || recentItems.length > 0);
  const hasSuggestions = filteredSuggestions.length > 0 || matchingRecentItems.length > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (listRef.current && isOpen && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll("[role='option']");
      const highlightedElement = items[highlightedIndex] as HTMLElement;
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);

  const handleClear = () => {
    setInputValue("");
    onChange("");
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filteredSuggestions.length + matchingRecentItems.length;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (showDropdown && hasSuggestions) {
          setHighlightedIndex((prev) =>
            prev < totalItems - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (showDropdown && hasSuggestions) {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : totalItems - 1
          );
        }
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && showDropdown) {
          if (highlightedIndex < matchingRecentItems.length) {
            handleSelectSuggestion(matchingRecentItems[highlightedIndex]);
          } else {
            const suggestionIndex = highlightedIndex - matchingRecentItems.length;
            handleSelectSuggestion(filteredSuggestions[suggestionIndex]);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Combined items for keyboard navigation
  let currentIndex = -1;

  const renderSuggestionItem = (suggestion: string, isRecent: boolean = false) => {
    currentIndex++;
    const itemIndex = currentIndex;
    const isHighlighted = itemIndex === highlightedIndex;

    return (
      <li
        key={`${isRecent ? "recent" : "suggestion"}-${suggestion}`}
        onClick={() => handleSelectSuggestion(suggestion)}
        className={`
          px-5 py-3 cursor-pointer transition-all flex items-center gap-2
          ${isHighlighted ? "bg-red-50 text-[#E4002B]" : "hover:bg-red-50 hover:text-[#E4002B]"}
        `}
        role="option"
        aria-selected={isHighlighted}
      >
        {isRecent && <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
        <span className="text-xs font-bold truncate">{suggestion}</span>
      </li>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full bg-gray-50 border-2 border-transparent
            focus:border-red-100 rounded-2xl px-5 py-4 pr-12
            text-xs font-bold outline-none transition-all
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            ${isOpen ? "bg-white border-red-100" : ""}
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              type="button"
            >
              <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            type="button"
            tabIndex={-1}
          >
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-2"
            role="listbox"
          >
            {/* Recent Items Section */}
            {matchingRecentItems.length > 0 && (
              <>
                <li className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Recent
                  </span>
                  {onClearRecent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClearRecent();
                      }}
                      className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </li>
                {matchingRecentItems.map((item) => renderSuggestionItem(item, true))}
              </>
            )}

            {/* Suggestions Section */}
            {filteredSuggestions.length > 0 && (
              <>
                {matchingRecentItems.length > 0 && inputValue.length > 0 && (
                  <li className="border-t border-gray-100" />
                )}
                {inputValue.length > 0 && (
                  <li className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Suggestions ({filteredSuggestions.length})
                    </span>
                  </li>
                )}
                {filteredSuggestions.map((item) => renderSuggestionItem(item, false))}
              </>
            )}

            {/* No Results */}
            {!hasSuggestions && inputValue.length > 0 && (
              <li className="px-5 py-4 text-center">
                <span className="text-xs font-bold text-gray-400">No suggestions found</span>
                <p className="text-[10px] text-gray-300 mt-1">Press Enter to use your input</p>
              </li>
            )}

            {/* Empty State */}
            {!hasSuggestions && inputValue.length === 0 && recentItems.length === 0 && (
              <li className="px-5 py-4 text-center">
                <span className="text-xs font-bold text-gray-400">Start typing to see suggestions</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default OdooCombobox;
