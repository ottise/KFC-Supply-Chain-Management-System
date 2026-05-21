"use client";
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomDatePickerProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  placeholder?: string;
}

// Parse datetime-local string (YYYY-MM-DDTHH:mm) as local time
const parseLocalDateTime = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [datePart, timePart] = dateStr.split('T');
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
};

// Format Date to datetime-local string (YYYY-MM-DDTHH:mm) in local time
const toLocalDateTimeString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  label,
  value,
  onChange,
  error,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const [calendarPosition, setCalendarPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      const isHoursPicker = target.closest(`#${label}-hours-picker`);
      const isMinutesPicker = target.closest(`#${label}-minutes-picker`);

      if (!isHoursPicker) {
        document.getElementById(`${label}-hours-picker`)?.classList.add('hidden');
      }
      if (!isMinutesPicker) {
        document.getElementById(`${label}-minutes-picker`)?.classList.add('hidden');
      }

      // Only close if clicking outside both container AND calendar
      const clickingInsideContainer = containerRef.current?.contains(e.target as Node);

      // Check if clicking inside calendar portal using getElementById
      const calendarEl = document.getElementById(`${label}-calendar-portal`);
      const clickingInsideCalendar = calendarEl?.contains(e.target as Node) ?? false;

      if (!clickingInsideContainer && !clickingInsideCalendar) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [label]);

  const toggleCalendar = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
    }
    setIsOpen(!isOpen);
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const selectDate = (day: number) => {
    const existingDate = value ? parseLocalDateTime(value) : null;
    const hours = existingDate ? existingDate.getHours() : 9;
    const minutes = existingDate ? existingDate.getMinutes() : 0;
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, hours, minutes, 0, 0);
    onChange(toLocalDateTimeString(d));
    // Don't close calendar after selecting date - keep it open
  };

  const selectTime = (hour: number, minute: number) => {
    const existingDate = value ? parseLocalDateTime(value) : null;
    const d = existingDate || new Date();
    d.setFullYear(viewDate.getFullYear());
    d.setMonth(viewDate.getMonth());
    d.setDate(viewDate.getDate());
    d.setHours(hour, minute, 0, 0);
    onChange(toLocalDateTimeString(d));
  };

  const displayValue = value
    ? (() => {
        const d = parseLocalDateTime(value);
        if (!d) return '';
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes} ${day}/${month}/${year}`;
      })()
    : '';

  const selectedDate = value ? parseLocalDateTime(value) : null;

  // Calendar positioned ABOVE the button
  const getCalendarStyle = (): React.CSSProperties => {
    if (!calendarPosition) return {};
    return {
      top: calendarPosition.top - 430, // calendar height ~420px + 10px gap
      left: calendarPosition.left + calendarPosition.width / 2 - 160, // center with button
    };
  };

  const calendarContent = (
    <div
      id={`${label}-calendar-portal`}
      className="fixed z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-[320px]"
      style={getCalendarStyle()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={prevMonth} onMouseDown={(e) => e.stopPropagation()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-bold text-gray-900">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button type="button" onClick={nextMonth} onMouseDown={(e) => e.stopPropagation()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-2">{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
          const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();
          return (
            <button
              key={day}
              type="button"
              onClick={() => selectDate(day)}
              onMouseDown={(e) => e.stopPropagation()}
              className={`aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all ${
                isSelected
                  ? 'bg-[#E4002B] text-white shadow-lg shadow-red-200'
                  : isToday
                  ? 'bg-red-50 text-[#E4002B] font-bold'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Time Selection */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-3">Giờ</p>
        <div className="flex items-center gap-2">
          {/* Hours Dropdown */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => {
                document.getElementById(`${label}-hours-picker`)?.classList.toggle('hidden');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-3 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border-2 border-transparent focus:border-red-200 outline-none cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-center gap-1"
            >
              <span>{selectedDate ? selectedDate.getHours().toString().padStart(2, '0') : '09'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Hours Picker - absolute positioned inside calendar */}
            <div id={`${label}-hours-picker`} className="hidden absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[801] max-h-[180px] overflow-y-auto">
              {Array.from({ length: 24 }).map((_, h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    const currentMinutes = value ? (parseLocalDateTime(value)?.getMinutes() ?? 0) : 0;
                    selectTime(h, currentMinutes);
                    document.getElementById(`${label}-hours-picker`)?.classList.add('hidden');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-center hover:bg-red-50 ${
                    selectedDate && selectedDate.getHours() === h ? 'bg-[#E4002B] text-white font-bold' : 'text-gray-700'
                  }`}
                >
                  {h.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <span className="text-gray-400 font-bold text-lg">:</span>

          {/* Minutes Dropdown */}
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={() => {
                document.getElementById(`${label}-minutes-picker`)?.classList.toggle('hidden');
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full px-3 py-3 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border-2 border-transparent focus:border-red-200 outline-none cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-center gap-1"
            >
              <span>{selectedDate ? selectedDate.getMinutes().toString().padStart(2, '0') : '00'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Minutes Picker - absolute positioned inside calendar */}
            <div id={`${label}-minutes-picker`} className="hidden absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[801]">
              {[0, 15, 30, 45].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    const currentHours = value ? (parseLocalDateTime(value)?.getHours() ?? 9) : 9;
                    selectTime(currentHours, m);
                    document.getElementById(`${label}-minutes-picker`)?.classList.add('hidden');
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all text-center hover:bg-red-50 ${
                    selectedDate && selectedDate.getMinutes() === m ? 'bg-[#E4002B] text-white font-bold' : 'text-gray-700'
                  }`}
                >
                  {m.toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggleCalendar}
          className={`w-full px-5 py-4 bg-gray-50 rounded-2xl text-left text-sm font-medium border-2 transition-all flex items-center justify-between gap-3 ${error ? 'border-red-400 bg-red-50' : 'border-transparent hover:border-red-200 focus:border-red-400'} ${displayValue ? 'text-gray-900' : 'text-gray-400'}`}
        >
          <span>{displayValue || placeholder}</span>
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        {isOpen && calendarPosition && createPortal(calendarContent, document.body)}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default CustomDatePicker;
