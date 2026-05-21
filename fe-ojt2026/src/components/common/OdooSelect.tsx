"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Search, ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface OdooSelectProps<T extends string | number | null> {
  label: string;
  placeholder: string;
  options: { id: T; name: string }[];
  value: T;
  onChange: (id: T) => void;
  disabled?: boolean;
  icon?: LucideIcon;
  portal?: boolean;
  className?: string;
  dropdownClassName?: string;
}

export default function OdooSelect<T extends string | number | null>({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  icon: Icon = Search,
  portal = false,
  className = "",
  dropdownClassName = ""
}: OdooSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, width: 0, direction: "down" as "up" | "down" });

  const selectedOption = options.find(o => o.id === value);
  const displayValue = selectedOption ? selectedOption.name : placeholder;

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const direction = spaceBelow < 300 && spaceAbove > spaceBelow ? "up" : "down";

      setCoords({
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        direction
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        (!portal || (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [portal]);

  const dropdownList = (
    <div
      ref={dropdownRef}
      className={`
        bg-white shadow-2xl rounded-[1.5rem] py-3 border border-gray-50 
        animate-in fade-in zoom-in-95 duration-200 min-w-[250px]
        ${portal ? "fixed z-[9999]" : "absolute left-[calc(45px)] right-0 top-[calc(100%+8px)] z-[150]"}
        ${dropdownClassName}
      `}
      style={portal ? {
        top: coords.direction === "down" ? coords.bottom + 8 : undefined,
        bottom: coords.direction === "up" ? (window.innerHeight - coords.top) + 8 : undefined,
        left: coords.left,
        minWidth: Math.max(250, coords.width)
      } : {}}
    >
      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
        {options.map((option) => (
          <div
            key={String(option.id)}
            className={`px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-red-50/60 hover:text-[#E4002B] ${value === option.id ? 'text-[#E4002B] bg-red-50' : 'text-gray-500'}`}
            onClick={() => {
              onChange(option.id);
              setIsOpen(false);
            }}
          >
            {option.name}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex items-center gap-3 relative ${className}`} ref={containerRef}>
      <span className="text-[11px] font-black uppercase text-gray-400 tracking-wider whitespace-nowrap">{label}:</span>

      <div
        className={`relative flex items-center min-w-[220px] h-14 px-5 bg-gray-50/50 border border-gray-100 rounded-[1.5rem] shadow-sm cursor-pointer transition-all hover:bg-white hover:border-red-100/30 ${isOpen ? 'bg-white border-red-100/50 ring-8 ring-red-50/20' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`text-[11px] font-black uppercase tracking-tight flex-1 truncate ${!selectedOption ? 'text-gray-300' : 'text-gray-700'}`}>
          {displayValue}
        </span>
        {isOpen ? (
          <svg className="w-4 h-4 text-[#E4002B] rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>

      {isOpen && (portal ? createPortal(dropdownList, document.body) : dropdownList)}
    </div>
  );
}
