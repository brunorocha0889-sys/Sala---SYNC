import React, { useState, useEffect } from "react";
import { Booking, SystemUser, Equipment } from "../types";
import { 
  X, Calendar, Clock, User, Check, AlertCircle, MessageSquare, Bell, Mail
} from "lucide-react";

// Predefined Rooms
export const SALAS_PREDEFINIDAS = [
  { id: "sala-escola", nome: "Sala (Escola de Saúde)", capacidade: 30 },
  { id: "sala-reunioes-2", nome: "Sala de reuniões 2", capacidade: 12 },
  { id: "sala-conselho", nome: "Sala do Conselho", capacidade: 20 },
  { id: "auditorio", nome: "Auditório Principal", capacidade: 80 }
];

interface BookingFormProps {
  booking: Booking | null;
  allBookings: Booking[];
  currentUser: SystemUser;
  users: SystemUser[];
  equipments?: Equipment[];
  rooms?: any[];
  onSave: (booking: Booking & { deEquipmentsIds?: any[] }) => void;
  onClose: () => void;
  addToast: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
}

function timeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const parts = tStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function calculateDuration(start: string, end: string): string {
  if (!start || !end) return "";
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  if (endMin <= startMin) return "";
  
  const diff = endMin - startMin;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export default function BookingForm({ 
  booking, 
  allBookings, 
  currentUser, 
  users, 
  equipments = [], 
  rooms = [],
  onSave, 
  onClose, 
  addToast 
}: BookingFormProps) {
  const [id, setId] = useState("");
  const [data, setData] = useState("");
  const [horaInicial, setHoraInicial] = useState("09:00");
  const [horaFinal, setHoraFinal] = useState("10:30");

  const activeRooms = rooms && rooms.length > 0 
    ? rooms.filter(r => r.status === "Ativa" || r.status === "ativo" || !r.status)
    : SALAS_PREDEFINIDAS;

  const [sala, setSala] = useState(() => {
    return activeRooms.length > 0 ? (activeRooms[0].name || activeRooms[0].nome) : SALAS_PREDEFINIDAS[0].nome;
  });
  const [tempoDeUso, setTempoDeUso] = useState("1:30hs");
  const [pessoas, setPessoas] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [motivo, setMotivo] = useState("");
  const [situacao, setSituacao] = useState<"Finalizado" | "Confirmado" | "Cancelado">("Confirmado");
  const [lembreteAntecedencia, setLembreteAntecedencia] = useState<"none" | "15min" | "30min" | "1h" | "2h" | "24h">("30min");
  const [lembreteMeio, setLembreteMeio] = useState<"none" | "email" | "push" | "ambos">("email");
  const [usuarioId, setUsuarioId] = useState("");

  // Map of equipmentId -> requested quantity
  const [requestedEqs, setRequestedEqs] = useState<Record<string, number>>({});
  
  const [conflict, setConflict] = useState<Booking | null>(null);

  // Checks permission
  const isNew = !booking || !booking.id;
  const isOwner = booking ? (booking.usuarioId === currentUser.id || booking.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim()) : true;
  const isAdmin = currentUser.role === "Administrador";
  const canEdit = isNew || isOwner || isAdmin;

  // Initialize form
  useEffect(() => {
    if (booking) {
      setId(booking.id);
      setData(booking.data);
      setHoraInicial(booking.horaInicial);
      setHoraFinal(booking.horaFinal);
      setSala(booking.sala);
      setTempoDeUso(booking.tempoDeUso);
      setPessoas(booking.pessoas || "");
      setResponsavel(booking.responsavel);
      setMotivo(booking.motivo);
      setSituacao(booking.situacao);
      setLembreteAntecedencia(booking.lembreteAntecedencia || "none");
      setLembreteMeio(booking.lembreteMeio || "none");
      setUsuarioId(booking.usuarioId || "");

      // Load requested equipment counts
      const eqMap: Record<string, number> = {};
      if (booking.equipmentsRequested) {
        booking.equipmentsRequested.forEach((er) => {
          eqMap[er.equipmentId] = er.quantidade;
        });
      }
      setRequestedEqs(eqMap);
    } else {
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, "0");
      const dy = String(today.getDate()).padStart(2, "0");
      setId("");
      setData(`${yr}-${mo}-${dy}`);
      setHoraInicial("09:00");
      setHoraFinal("10:30");
      setSala(activeRooms.length > 0 ? (activeRooms[0].name || activeRooms[0].nome) : SALAS_PREDEFINIDAS[0].nome);
      setTempoDeUso("1:30hs");
      setPessoas("");
      setResponsavel(currentUser.nome);
      setMotivo("");
      setSituacao("Confirmado");
      setLembreteAntecedencia("30min");
      setLembreteMeio("email");
      setUsuarioId(currentUser.id);
      setRequestedEqs({});
    }
  }, [booking, currentUser, rooms]);

  // Set default room if rooms list changes or initial state needs alignment
  useEffect(() => {
    if (!booking && activeRooms.length > 0) {
      const match = activeRooms.find(r => (r.name || r.nome) === sala);
      if (!match) {
        setSala(activeRooms[0].name || activeRooms[0].nome);
      }
    }
  }, [rooms, booking]);

  // Recalculate duration when times change
  useEffect(() => {
    const calculated = calculateDuration(horaInicial, horaFinal);
    if (calculated) {
      setTempoDeUso(calculated);
    }
  }, [horaInicial, horaFinal]);

  // Real-time conflict validation
  useEffect(() => {
    if (!sala || !data || !horaInicial || !horaFinal || situacao === "Cancelado") {
      setConflict(null);
      return;
    }

    const startMin = timeToMinutes(horaInicial);
    const endMin = timeToMinutes(horaFinal);

    if (startMin >= endMin) {
      setConflict(null);
      return;
    }

    const overlapping = allBookings.find((b) => {
      if (b.id === id) return false;
      if (b.situacao === "Cancelado") return false;
      if (b.sala !== sala || b.data !== data) return false;

      const otherStart = timeToMinutes(b.horaInicial);
      const otherEnd = timeToMinutes(b.horaFinal || b.horaInicial);

      return startMin < otherEnd && endMin > otherStart;
    });

    if (overlapping) {
      if (!conflict || conflict.id !== overlapping.id) {
        addToast(
          "warning",
          "⚠️ Horário Indisponível",
          `A sala "${sala}" já está ocupada por ${overlapping.responsavel} das ${overlapping.horaInicial} às ${overlapping.horaFinal}.`
        );
      }
      setConflict(overlapping);
    } else {
      setConflict(null);
    }
  }, [id, sala, data, horaInicial, horaFinal, situacao, allBookings, addToast, conflict]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Você não possui permissão para salvar modificações neste agendamento.");
      return;
    }
    if (conflict && situacao !== "Cancelado") {
      addToast(
        "error",
        "Erro de Conflito de Horário",
        `Não é possível salvar porque a sala "${sala}" já está reservada por "${conflict.responsavel}" das ${conflict.horaInicial} às ${conflict.horaFinal}.`
      );
      return;
    }
    if (!responsavel.trim()) {
      alert("Por favor, informe o responsável pelo agendamento.");
      return;
    }
    if (!motivo.trim()) {
      alert("Por favor, preencha o motivo/assunto da reunião.");
      return;
    }

    const calculatedDuration = tempoDeUso || calculateDuration(horaInicial, horaFinal) || "1h";

    // Format requested equipments selection
    const selectedEqsArray = Object.entries(requestedEqs)
      .map(([equipmentId, quantidade]) => ({ equipmentId, quantidade }))
      .filter((eq) => eq.quantidade > 0);

    onSave({
      id,
      data,
      horaInicial,
      horaFinal,
      sala,
      tempoDeUso: calculatedDuration,
      pessoas,
      responsavel,
      equipamentos: "Controle de Equipamentos", // backend overrides this field to human list
      motivo,
      situacao,
      lembreteAntecedencia,
      lembreteMeio,
      usuarioId: usuarioId || currentUser.id,
      deEquipmentsIds: selectedEqsArray
    });
  };

  const getPortugueseDate = (dStr: string) => {
    if (!dStr) return "";
    const parts = dStr.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto font-sans">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative animate-scale-up scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
              {id ? "Ajuste de Reserva" : "Novo Agendamento"}
            </span>
            <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1.5">
              {id ? "Editar Agendamento Ativo" : "Agendar Chave/Sala Corporativa"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Warning */}
        {!canEdit && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 flex gap-3 mb-4">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Modo Apenas Leitura</p>
              <p className="text-xs mt-0.5">
                Esta reserva pertence a <strong>{responsavel}</strong>. O seu nível de permissão ("{currentUser.role}") não permite editar ou excluir agendamentos de terceiros.
              </p>
            </div>
          </div>
        )}

        {/* Conflict Warning */}
        {conflict && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-3 text-rose-800 mb-4 animate-pulse">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Erro: Conflito de Horário Detectado!</p>
              <p className="text-xs mt-0.5">
                A <strong>{sala}</strong> já está reservada por <strong>{conflict.responsavel}</strong> das{" "}
                <strong>{conflict.horaInicial}</strong> às <strong>{conflict.horaFinal}</strong> em{" "}
                <strong>{getPortugueseDate(conflict.data)}</strong> ({conflict.motivo}).
              </p>
              <p className="text-[10px] text-rose-700 mt-1 font-extrabold flex items-center gap-1 bg-rose-100/50 p-1 rounded-md">
                🚫 Não é possível realizar ou salvar este agendamento devido à sobreposição de horários.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sala Select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sala de Reunião</label>
              <select
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              >
                {activeRooms.map((room) => {
                  const rName = room.name || room.nome;
                  const rCap = room.capacity || room.capacidade;
                  return (
                    <option key={room.id} value={rName}>
                      {rName} (Até {rCap} pessoas)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Data Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Data
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              />
            </div>

            {/* Situacao / Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Situação / Status</label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value as any)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              >
                <option value="Confirmado">📅 Agendado / Confirmado</option>
                <option value="Finalizado">✅ Finalizado</option>
                <option value="Cancelado">❌ Cancelado</option>
              </select>
            </div>

            {/* Hora Inicial */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Hora Inicial
              </label>
              <input
                type="time"
                required
                value={horaInicial}
                onChange={(e) => setHoraInicial(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              />
            </div>

            {/* Hora Final */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Hora Final
              </label>
              <input
                type="time"
                required
                value={horaFinal}
                onChange={(e) => setHoraFinal(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              />
            </div>

            {/* Autocalculated Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duração</label>
              <input
                type="text"
                placeholder="Ex: 1:30hs ou 2h"
                value={tempoDeUso}
                onChange={(e) => setTempoDeUso(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-2 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-violet-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Pessoas / Equipe */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade ou Equipe</label>
              <input
                type="text"
                placeholder="Ex: EQUIPE QUALIDADE ou 8 pessoas"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              />
            </div>

            {/* Responsável */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Responsável (Usuário Cadastrado)
              </label>
              <select
                value={responsavel}
                onChange={(e) => {
                  setResponsavel(e.target.value);
                  const matchedUser = users.find(u => u.nome === e.target.value);
                  if (matchedUser) {
                    setUsuarioId(matchedUser.id);
                  }
                }}
                disabled={!canEdit || (!isAdmin && !isNew)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              >
                <option value="">Selecione o responsável corporativo...</option>
                {responsavel && !users.some(u => u.nome === responsavel) && (
                  <option value={responsavel}>{responsavel} (Histórico)</option>
                )}
                {users.map((u) => (
                  <option key={u.id} value={u.nome}>
                    {u.nome} ({u.setor})
                  </option>
                ))}
              </select>
            </div>

            {/* EQUIPMENTS CHECKLIST SELECT PANEL */}
            <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <label className="block text-xs font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                📦 Solicitar Materiais / Equipamentos de TI
              </label>
              <p className="text-[10px] text-slate-400 leading-normal mb-3">
                Os aparelhos solicitados passam por validação de concorrência de estoque nas horas reservadas.
              </p>
              
              <div className="space-y-2">
                {equipments && equipments.filter(eq => eq.ativo).length > 0 ? (
                  equipments.filter(eq => eq.ativo).map((eq) => {
                    const selectedQty = requestedEqs[eq.id] || 0;
                    return (
                      <div key={eq.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-150 rounded-xl">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`equip-${eq.id}`}
                            checked={selectedQty > 0}
                            disabled={!canEdit}
                            onChange={(e) => {
                              setRequestedEqs((prev) => ({
                                ...prev,
                                [eq.id]: e.target.checked ? 1 : 0
                              }));
                            }}
                            className="w-4 h-4 text-violet-700 border-slate-300 rounded focus:ring-violet-500 cursor-pointer disabled:opacity-50"
                          />
                          <label htmlFor={`equip-${eq.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                            {eq.nome}
                          </label>
                        </div>

                        {selectedQty > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Qtd:</span>
                            <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => {
                                  setRequestedEqs((prev) => ({
                                    ...prev,
                                    [eq.id]: Math.max(1, selectedQty - 1)
                                  }));
                                }}
                                className="px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-black text-slate-800 font-mono">
                                {selectedQty}
                              </span>
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => {
                                  setRequestedEqs((prev) => ({
                                    ...prev,
                                    [eq.id]: Math.min(eq.quantidade, selectedQty + 1)
                                  }));
                                }}
                                className="px-2 py-1 text-xs font-black text-slate-500 hover:bg-slate-200 disabled:opacity-40"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[9px] text-[#5B5CEB] font-mono font-bold bg-indigo-50 px-1 rounded">
                              Max: {eq.quantidade}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 italic">Sem materiais adicionais cadastrados ou ativos no momento.</p>
                )}
              </div>
            </div>

            {/* Motivo da reunião */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-slate-400" /> Motivo / Assunto da Reunião *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Alinhamento de metas bimestrais, etc."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
              />
            </div>

            {/* Lembretes e Notificações */}
            <div className="sm:col-span-2 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
                Lembretes e Notificações
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deseja Lembrete?</label>
                  <select
                    value={lembreteAntecedencia}
                    onChange={(e) => setLembreteAntecedencia(e.target.value as any)}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-semibold"
                  >
                    <option value="none">Nenhum lembrete</option>
                    <option value="15min">⏰ 15 minutos antes</option>
                    <option value="30min">⏰ 30 minutos antes</option>
                    <option value="1h">⏰ 1 hora antes</option>
                    <option value="2h">⏰ 2 horas antes</option>
                    <option value="24h">⏰ 24 horas antes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Canal de Envio</label>
                  <select
                    value={lembreteMeio}
                    onChange={(e) => setLembreteMeio(e.target.value as any)}
                    disabled={!canEdit || lembreteAntecedencia === "none"}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    <option value="none">Nenhum</option>
                    <option value="email">📧 Enviar por E-mail</option>
                    <option value="push">📱 Notificação Push</option>
                    <option value="ambos">✨ Ambos (E-mail e Push)</option>
                  </select>
                </div>
              </div>
              {lembreteAntecedencia !== "none" && lembreteMeio !== "none" && (
                <p className="text-[10px] text-indigo-700 font-bold mt-2 flex items-center gap-1 bg-indigo-50 p-2.5 rounded-lg border border-indigo-100">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                  <span>
                    Ativado! O sistema notificará o colega {responsavel || currentUser.nome} via {lembreteMeio === "email" ? "E-mail" : lembreteMeio === "push" ? "Notificação Push" : "E-mail e Push"} antes da reserva.
                  </span>
                </p>
              )}
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            {canEdit && (
              <button
                type="submit"
                className="bg-[#5B5CEB] hover:bg-[#4749D4] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                {id ? "Atualizar Reserva" : "Confirmar Agendamento"}
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}
