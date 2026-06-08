import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Check, X } from "lucide-react";

interface MultiDatePickerProps {
  selectedDates: string[]; // array of "YYYY-MM-DD"
  onChange: (dates: string[]) => void;
}

export default function MultiDatePicker({ selectedDates, onChange }: MultiDatePickerProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Months name in Portuguese
  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Weekdays in Portuguese
  const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Total days in the month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // First day of the month (0 = Sunday, 1 = Monday...)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Navigate to previous month (but stop at today's month)
  const handlePrevMonth = () => {
    const isCurrentMonthOrPast = 
      currentYear < today.getFullYear() || 
      (currentYear === today.getFullYear() && currentMonth <= today.getMonth());

    if (isCurrentMonthOrPast) return;

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Toggle date selection
  const handleToggleDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    // Check if past
    const checkDate = new Date(currentYear, currentMonth, day);
    if (checkDate < today) return;

    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter(d => d !== dateStr));
    } else {
      // Keep sorted
      const newDates = [...selectedDates, dateStr].sort();
      onChange(newDates);
    }
  };

  const isSelected = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDates.includes(dateStr);
  };

  const isPast = (day: number) => {
    const checkDate = new Date(currentYear, currentMonth, day);
    return checkDate < today;
  };

  const clearAll = () => {
    onChange([]);
  };

  // Cannot go to past months
  const isPrevDisabled = 
    currentYear < today.getFullYear() || 
    (currentYear === today.getFullYear() && currentMonth <= today.getMonth());

  // Generate blank grids for start offset
  const blankCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    blankCells.push(<div key={`blank-${i}`} className="h-8"></div>);
  }

  // Generate days cells
  const dayCells = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const selected = isSelected(day);
    const past = isPast(day);

    dayCells.push(
      <button
        key={`day-${day}`}
        type="button"
        disabled={past}
        onClick={() => handleToggleDate(day)}
        className={`h-8 w-8 text-xs font-bold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center relative
          ${selected 
            ? "bg-indigo-600 text-white shadow-xs scale-102" 
            : past 
              ? "text-slate-300 cursor-not-allowed bg-slate-50/20" 
              : "text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
          }
        `}
      >
        <span>{day}</span>
        {selected && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white"></span>
        )}
      </button>
    );
  }

  const formatSelectedDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 max-w-sm w-full mx-auto animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-indigo-900 uppercase tracking-widest flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          Datas Selecionadas ({selectedDates.length})
        </span>
        {selectedDates.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            Limpar Todas
          </button>
        )}
      </div>

      {/* Mini Calendar Header */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={isPrevDisabled}
          className={`p-1 rounded-lg transition-colors cursor-pointer
            ${isPrevDisabled 
              ? "text-slate-300 cursor-not-allowed" 
              : "text-slate-500 hover:bg-slate-200 hover:text-slate-700"
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
          {MONTHS[currentMonth]} {currentYear}
        </span>

        <button
          type="button"
          onClick={handleNextMonth}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Week Days */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEKDAYS.map(day => (
            <span key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
              {day}
            </span>
          ))}
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {blankCells}
          {dayCells}
        </div>
      </div>

      {/* Selected dates tags preview */}
      {selectedDates.length > 0 ? (
        <div className="border-t border-slate-100 pt-3">
          <label className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mb-2">Dias Selecionados para Reserva</label>
          <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-200">
            {selectedDates.map(date => (
              <span key={date} className="bg-indigo-50 border border-indigo-150 text-indigo-700 font-bold font-mono text-[9px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 shadow-3xs animate-fade-in">
                {formatSelectedDate(date)}
                <button
                  type="button"
                  onClick={() => onChange(selectedDates.filter(d => d !== date))}
                  className="rounded-full hover:bg-indigo-200 p-0.5 text-indigo-500 hover:text-indigo-800 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center bg-slate-50/50">
          <p className="text-[10px] text-slate-450 font-bold">Por favor, selecione ao menos um dia no mini-calendário para sua série recorrente.</p>
        </div>
      )}
    </div>
  );
}
