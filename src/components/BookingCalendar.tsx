import { useState } from "react";
import { Booking, SystemUser } from "../types";
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, User, ClipboardList, Users, Lock } from "lucide-react";

interface BookingCalendarProps {
  bookings: Booking[];
  currentUser: SystemUser;
  onAddOnDate: (dateStr: string) => void;
  onEdit: (booking: Booking) => void;
}

export default function BookingCalendar({ bookings, currentUser, onAddOnDate, onEdit }: BookingCalendarProps) {
  // Permission helper
  const isEditable = (b: Booking) => {
    if (currentUser.role === "Administrador") return true;
    const matchId = b.usuarioId && b.usuarioId === currentUser.id;
    const matchName = b.responsavel && b.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim();
    return !!(matchId || matchName);
  };

  // Set default calendar date to the current month/year (mês vigente) and select today as default
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleGoToToday = () => {
    // Take to current year/month
    setCurrentDate(new Date());
  };

  // Helper: Format Date object into YYYY-MM-DD
  const formatDateString = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
  };

  // Get days in current month
  const getDaysInMonth = () => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days: { dayNumber: number | null; dateStr: string | null }[] = [];
    
    // Empty cells for alignment (offset before Monday or Sunday)
    // We use Sunday as index 0
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }

    // Days in the active month
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        dayNumber: d,
        dateStr: formatDateString(currentYear, currentMonth, d),
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth();

  // Highlight color codes for rooms
  const getRoomColorBadge = (roomName: string) => {
    if (roomName.includes("School") || roomName.includes("Escola de Saúde")) {
      return "bg-amber-100 border-l-[3px] border-amber-500 text-amber-900";
    }
    if (roomName.includes("reuniões 2")) {
      return "bg-emerald-100 border-l-[3px] border-emerald-600 text-emerald-950";
    }
    if (roomName.includes("Conselho")) {
      return "bg-sky-100 border-l-[3px] border-sky-500 text-sky-950";
    }
    return "bg-purple-100 border-l-[3px] border-purple-500 text-purple-950";
  };

  // Group Bookings by DateStr for quick access
  const bookingsByDate = bookings.reduce<{ [date: string]: Booking[] }>((acc, booking) => {
    if (booking.situacao !== "Cancelado") {
      if (!acc[booking.data]) {
        acc[booking.data] = [];
      }
      acc[booking.data].push(booking);
    }
    return acc;
  }, {});

  // Get active selected day bookings
  const selectedDayBookings = selectedDay ? bookingsByDate[selectedDay] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* Calendar Grid Section */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
        
        {/* Calendar Nav Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-2 pb-4 border-b border-slate-100 mb-4 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 text-violet-700 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </h3>
              <p className="text-xs text-slate-400">Clique em um dia para gerenciar reservas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToToday}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-xs rounded-lg transition-colors border border-slate-200"
            >
              Ir para Hoje
            </button>
            <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Day Labels */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-slate-400 text-xs mb-2">
          <div>DOM</div>
          <div>SEG</div>
          <div>TER</div>
          <div>QUA</div>
          <div>QUI</div>
          <div>SEX</div>
          <div>SÁB</div>
        </div>

        {/* Days Box Grid */}
        <div className="grid grid-cols-7 gap-1 bg-slate-50 border border-slate-150 p-1 rounded-xl flex-1 select-none">
          {calendarDays.map((cell, index) => {
            const { dayNumber, dateStr } = cell;
            const isSelected = dateStr === selectedDay;
            const dayEvents = dateStr ? bookingsByDate[dateStr] || [] : [];
            const hasEvents = dayEvents.length > 0;
            
            // Highlight today
            const todayStr = new Date().toISOString().split("T")[0];
            const isToday = dateStr === todayStr;

            return (
              <div
                key={index}
                onClick={() => dateStr && setSelectedDay(dateStr)}
                className={`min-h-[90px] sm:min-h-[110px] bg-white rounded-lg p-1.5 transition-all flex flex-col justify-between border cursor-pointer hover:shadow-xs group ${
                  dayNumber === null 
                    ? "bg-slate-100 border-none cursor-not-allowed opacity-40 hover:shadow-none" 
                    : ""
                } ${
                  isSelected 
                    ? "border-violet-600 ring-2 ring-violet-500/20" 
                    : "border-slate-100 hover:border-slate-300"
                } ${isToday ? "bg-amber-50/40 border-amber-300/60" : ""}`}
              >
                {dayNumber !== null ? (
                  <>
                    {/* Day Number Row */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                          isToday 
                            ? "bg-amber-600 text-white" 
                            : isSelected 
                            ? "bg-violet-700 text-white" 
                            : "text-slate-700"
                        }`}
                      >
                        {dayNumber}
                      </span>
                      
                      {/* Plus icon on Hover for scheduling */}
                      {dateStr && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddOnDate(dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-violet-100 hover:text-violet-700 rounded transition-opacity"
                          title="Reservar neste dia"
                        >
                          <Plus className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      )}
                    </div>

                    {/* Events list mini container */}
                    <div className="flex-1 mt-1 space-y-1 overflow-y-auto max-h-[60px] sm:max-h-[80px] scrollbar-thin scrollbar-thumb-slate-300">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(ev);
                          }}
                          className={`text-[9px] sm:text-[10px] leading-tight py-0.5 px-1 rounded truncate font-medium transition-transform hover:scale-98 ${getRoomColorBadge(ev.sala)}`}
                          title={`${ev.horaInicial} - ${ev.sala} (${ev.responsavel})`}
                        >
                          <strong>{ev.horaInicial}</strong> {ev.recorrenceId ? "🔁 " : ""}{ev.responsavel}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Details Lateral Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full min-h-[400px]">
        {/* Selected Date Header */}
        <div className="pb-4 border-b border-slate-100 mb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Agendamentos do Dia</span>
            <span className="text-sm font-bold text-slate-800">
              {selectedDay ? selectedDay.split("-").reverse().join("/") : "Nenhum dia selecionado"}
            </span>
          </div>
          
          {selectedDay && (
            <button
              onClick={() => onAddOnDate(selectedDay)}
              className="bg-violet-50 hover:bg-violet-100 text-violet-700 p-1.5 rounded-lg transition-colors flex items-center justify-center"
              title="Nova reserva para este dia"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Selected day events feedback */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[500px]">
          {selectedDayBookings.length > 0 ? (
            selectedDayBookings.map((ev) => {
              const isSchool = ev.sala.includes("Escola de s") || ev.sala.includes("Escola de Saúde");
              return (
                <div 
                  key={ev.id} 
                  onClick={() => onEdit(ev)}
                  className={`p-3 rounded-xl border border-slate-100/80 hover:shadow-xs transition-shadow cursor-pointer relative group ${
                    isSchool ? "bg-amber-50/40" : "bg-emerald-50/40"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                      isSchool ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      {ev.sala}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditable(ev) ? (
                        currentUser.role !== "Administrador" && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1 py-0.5 rounded">Meu</span>
                        )
                      ) : (
                        <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 font-bold px-1 py-0.5 rounded flex items-center gap-0.5" title="Apenas Leitura">
                          <Lock className="w-2 h-2 text-amber-600" /> Leitura
                        </span>
                      )}
                      <span className="text-[10px] max-w-[80px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 font-mono truncate">
                        {ev.tempoDeUso}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                    {ev.motivo}
                  </h4>

                  <div className="space-y-1 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {ev.horaInicial}s às {ev.horaFinal}s
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="font-semibold text-slate-700">{ev.responsavel}</span>
                      {ev.recorrenceId && (
                        <span className="inline-flex items-center text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1 py-0.5 rounded-sm shadow-3xs" title="Agendamento Recorrente">
                          🔁 Recorrente
                        </span>
                      )}
                    </div>
                    {ev.pessoas && (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span className="text-purple-600 font-semibold">{ev.pessoas}</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 text-[10px] text-violet-700 font-semibold hover:underline transition-opacity">
                    Editar &rarr;
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Clock className="w-10 h-10 text-slate-200 mb-2 stroke-1" />
              <p className="text-xs font-semibold">Nenhuma reserva ativa</p>
              <p className="text-[10px] text-slate-400/85 mt-1">Sala livre neste dia. Clique em (+) no topo para adicionar nova reserva.</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-slate-100 mt-4 text-[10px] space-y-1.5 text-slate-400 font-medium">
          <p className="font-bold uppercase tracking-wider text-slate-500 text-[9px] mb-1 text-left">Suas Salas</p>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs"></span>
            <span>Sala (Escola de Saúde)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#1E7145] rounded-xs"></span>
            <span>Sala de reuniões 2</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-500 rounded-xs"></span>
            <span>Outras Salas</span>
          </div>
        </div>

      </div>

    </div>
  );
}
