import { Booking } from "../types";
import { EQUIPAMENTOS_PREDEFINIDOS } from "../data";
import { Calendar, CheckCircle, Clock, BarChart3, ShieldAlert, Cpu, Tv, Wifi } from "lucide-react";

interface BookingStatsProps {
  bookings: Booking[];
  rooms?: any[];
}

export default function BookingStats({ bookings, rooms = [] }: BookingStatsProps) {
  const total = bookings.length;
  const finalizados = bookings.filter((b) => b.situacao === "Finalizado").length;
  const confirmados = bookings.filter((b) => b.situacao === "Confirmado").length;
  const cancelados = bookings.filter((b) => b.situacao === "Cancelado").length;

  const totalActive = finalizados + confirmados;
  
  // Calculate relative occupancy percentage safely
  const occupancyPercentage = bookings.length > 0
    ? Math.round((confirmados / Math.max(1, bookings.length)) * 100)
    : 0;

  const resolvedRooms = rooms && rooms.length > 0 ? rooms : [];

  // Usage by room
  const roomStats = resolvedRooms.map((room) => {
    const rName = room.name || room.nome;
    const rBg = room.corBg || "bg-indigo-50 text-indigo-850 border-indigo-110";
    const count = bookings.filter((b) => b.sala === rName && b.situacao !== "Cancelado").length;
    return {
      nome: rName,
      count,
      corBg: rBg,
      capacity: room.capacity || room.capacidade || 10,
    };
  }).sort((a, b) => b.count - a.count);

  // Resource Counts based on actual booking equipment usage
  const projectorCount = bookings.filter((b) => b.equipamentos.includes("PROJETOR") || b.equipamentos.includes("DATA SHOW")).length;
  const computerCount = bookings.filter((b) => b.equipamentos.includes("TV") || b.equipamentos.includes("COMPUTADOR")).length;
  const cleanCount = bookings.filter((b) => b.equipamentos === "Sem material").length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
      
      {/* Bento Card 1: Ocupação Atual (Indigo Premium theme matching the design spec) */}
      <div className="bg-indigo-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow min-h-[180px]">
        <div>
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Ocupação Atual</p>
          <h3 className="text-5xl font-black mt-2 tracking-tight">
            {occupancyPercentage}%
          </h3>
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-1.5 bg-white/20 rounded-full w-full">
            <div 
              className="h-1.5 bg-white rounded-full transition-all duration-700" 
              style={{ width: `${occupancyPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] opacity-80 italic">
            {confirmados} {confirmados === 1 ? 'reserva ativa hoje' : 'reservas ativas hoje'}
          </p>
        </div>
      </div>

      {/* Bento Card 2: Status de Recursos (Double column span in spec) */}
      <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-4 flex-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              Recursos Operacionais
            </h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-indigo-600 tracking-tight">{projectorCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Projetores</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{computerCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">TVs / Comput.</span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{cleanCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Sem Material</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:block h-full w-px bg-slate-100 mx-4"></div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-indigo-600 rounded-full flex flex-col items-center justify-center text-[10px] font-bold bg-indigo-50/30 text-indigo-700">
              <Wifi className="w-4 h-4 text-indigo-600 mb-0.5 animate-pulse" />
              100%
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-2">WIFI MESH</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 italic mt-3 border-t border-slate-50 pt-2">
          Contagem de equipamentos baseada nas reuniões ativas.
        </p>
      </div>

      {/* Bento Card 3: Reserva Status Counters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-xs">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Métricas Globais</h3>
        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 block">Finalizados</span>
            <span className="text-xl font-bold text-emerald-700">{finalizados}</span>
          </div>
          <div className="bg-slate-55 border border-slate-100 p-2 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 block">Total</span>
            <span className="text-xl font-bold text-slate-800">{total}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-rose-500 font-bold border-t border-slate-50 pt-2">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{cancelados} agendamentos cancelados</span>
        </div>
      </div>

      {/* Bento Row 2: Room Occupancy Visual Tracker (Spans 4 columns) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs md:col-span-4">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />
            Taxas de Ocupação por Sala
          </h3>
          <span className="text-xs text-slate-400 font-bold">Distribuição Volumétrica</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {roomStats.map((roomStat) => {
            const predef = resolvedRooms.find((s) => (s.name || s.nome) === roomStat.nome);
            const cap = predef?.capacity || predef?.capacidade || roomStat.capacity || 10;
            const percentage = totalActive > 0 ? (roomStat.count / totalActive) * 100 : 0;

            return (
              <div key={roomStat.nome} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-slate-55 transition-colors">
                <div className="flex justify-between items-center mb-2 text-xs font-bold">
                  <span className="text-slate-700 truncate max-w-xs">{roomStat.nome}</span>
                  <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    {roomStat.count} {roomStat.count === 1 ? 'reserva' : 'reservas'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(4, percentage))}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center mt-2 text-[10px] text-slate-400">
                  <span>{percentage.toFixed(0)}% do volume total de reservas</span>
                  <span>Capacidade máxima: {cap} pessoas</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
