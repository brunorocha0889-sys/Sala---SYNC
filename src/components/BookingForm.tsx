import React, { useState, useEffect } from "react";
import { Booking, SystemUser } from "../types";
import { SALAS_PREDEFINIDAS, EQUIPAMENTOS_PREDEFINIDOS } from "../data";
import { X, Calendar, Clock, User, MessageSquare, AlertCircle, Sparkles, Check, HelpCircle, Bell, Mail, ShieldAlert, Lock } from "lucide-react";


interface BookingFormProps {
  booking: Booking | null; // Null if adding a new one, booking if editing
  allBookings: Booking[];
  currentUser: SystemUser;
  users: SystemUser[];
  onSave: (booking: Booking) => void;
  onClose: () => void;
}

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(":");
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

export default function BookingForm({ booking, allBookings, currentUser, users, onSave, onClose }: BookingFormProps) {
  const [id, setId] = useState("");
  const [data, setData] = useState("");
  const [horaInicial, setHoraInicial] = useState("09:00");
  const [horaFinal, setHoraFinal] = useState("10:30");
  const [sala, setSala] = useState(SALAS_PREDEFINIDAS[0].nome);
  const [tempoDeUso, setTempoDeUso] = useState("1:30hs");
  const [pessoas, setPessoas] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [equipamentos, setEquipamentos] = useState("Sem material");
  const [motivo, setMotivo] = useState("");
  const [situacao, setSituacao] = useState<"Finalizado" | "Confirmado" | "Cancelado">("Confirmado");
  const [lembreteAntecedencia, setLembreteAntecedencia] = useState<"none" | "15min" | "30min" | "1h" | "2h" | "24h">("30min");
  const [lembreteMeio, setLembreteMeio] = useState<"none" | "email" | "push" | "ambos">("email");
  const [usuarioId, setUsuarioId] = useState("");
  
  const [conflict, setConflict] = useState<Booking | null>(null);

  // Checks permission
  const isNew = !booking || !booking.id;
  
  // If editing, check ownership
  const isOwner = booking ? (booking.usuarioId === currentUser.id || booking.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim()) : true;
  const isAdmin = currentUser.role === "Administrador";
  const canEdit = isNew || isOwner || isAdmin;

  // Initialize form with edited values or defaults
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
      setEquipamentos(booking.equipamentos);
      setMotivo(booking.motivo);
      setSituacao(booking.situacao);
      setLembreteAntecedencia(booking.lembreteAntecedencia || "none");
      setLembreteMeio(booking.lembreteMeio || "none");
      setUsuarioId(booking.usuarioId || "");
    } else {
      // Set default date to today or next weekday
      const today = new Date();
      const yr = today.getFullYear();
      const mo = String(today.getMonth() + 1).padStart(2, "0");
      const dy = String(today.getDate()).padStart(2, "0");
      setId("");
      setData(`${yr}-${mo}-${dy}`);
      setHoraInicial("09:00");
      setHoraFinal("10:30");
      setSala(SALAS_PREDEFINIDAS[0].nome);
      setTempoDeUso("1:30hs");
      setPessoas("");
      setResponsavel(currentUser.nome);
      setEquipamentos("Sem material");
      setMotivo("");
      setSituacao("Confirmado");
      setLembreteAntecedencia("30min");
      setLembreteMeio("email");
      setUsuarioId(currentUser.id);
    }
  }, [booking, currentUser]);

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
      if (b.id === id) return false; // skip editing item
      if (b.situacao === "Cancelado") return false; // skip canceled reservation conflict
      if (b.sala !== sala || b.data !== data) return false;

      const otherStart = timeToMinutes(b.horaInicial);
      const otherEnd = timeToMinutes(b.horaFinal || b.horaInicial);

      // Overlap formula: (start1 < end2) AND (end1 > start2)
      return startMin < otherEnd && endMin > otherStart;
    });

    setConflict(overlapping || null);
  }, [id, sala, data, horaInicial, horaFinal, situacao, allBookings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("Você não possui permissão para salvar modificações neste agendamento.");
      return;
    }
    if (conflict && situacao !== "Cancelado") {
      alert(`⚠️ Conflito de Horário! A sala "${sala}" já está agendada neste mesmo período por "${conflict.responsavel}" (${conflict.horaInicial} às ${conflict.horaFinal}). Altere a sala, a data ou os horários do seu agendamento.`);
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

    onSave({
      id: id || `booking-${Date.now()}`,
      data,
      horaInicial,
      horaFinal,
      sala,
      tempoDeUso: calculatedDuration,
      pessoas,
      responsavel,
      equipamentos,
      motivo,
      situacao,
      usuarioId: usuarioId || currentUser.id,
      lembreteAntecedencia,
      lembreteMeio,
    });
  };

  const getPortugueseDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 to-indigo-800 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              {booking ? "Editar Agendamento" : "Criar Novo Agendamento"}
            </h2>
            <p className="text-xs text-indigo-100/80">Preencha os dados da reserva da sala</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          {/* Permission Lock Warning Banner */}
          {!canEdit && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-900">
              <Lock className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Modo de Visualização Apenas</p>
                <p className="text-xs mt-0.5">
                  Esta reserva pertence a <strong>{responsavel}</strong>. O seu nível de permissão ("{currentUser.role}") não permite editar ou excluir agendamentos de terceiros.
                </p>
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {conflict && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex gap-3 text-rose-800 animate-pulse">
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

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Sala Select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sala de Reunião</label>
              <select
                value={sala}
                onChange={(e) => setSala(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {SALAS_PREDEFINIDAS.map((room) => (
                  <option key={room.id} value={room.nome}>
                    {room.nome} (Até {room.capacidade} pessoas)
                  </option>
                ))}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Situacao / Status */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Situação / Status</label>
              <select
                value={situacao}
                onChange={(e) => setSituacao(e.target.value as any)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Autocalculated Duration or Custom Text */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Duração (Tempo de Uso)
              </label>
              <input
                type="text"
                placeholder="Ex: 1:30hs ou 2h"
                value={tempoDeUso}
                onChange={(e) => setTempoDeUso(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-2 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium disabled:opacity-75 disabled:cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">Calculado automaticamente se preencher as horas</span>
            </div>

            {/* Qtd/Equipe de pessoas */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Pessoas ou Equipe</label>
              <input
                type="text"
                placeholder="Ex: EQUIPE QUALIDADE ou 8 pessoas"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
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
                disabled={!canEdit || (!isAdmin && !isNew)} // Standard users or owners can't transfer their booking responsible name once saved
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
              >
                <option value="">Selecione o responsável cadastrado...</option>
                {/* Fallback for historical users not inside system list */}
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

            {/* Equipamentos Select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equipamentos / Materiais</label>
              <select
                value={equipamentos}
                onChange={(e) => setEquipamentos(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {EQUIPAMENTOS_PREDEFINIDOS.map((eq) => (
                  <option key={eq.nome} value={eq.nome}>
                    {eq.nome === "Sem material" ? "Sem material / Sem equipamentos adicionais" : eq.nome}
                  </option>
                ))}
                <option value="Apenas TV">Apenas TV</option>
                <option value="PROJETOR + CAIXA DE SOM">PROJETOR + CAIXA DE SOM</option>
                <option value="TV/COMPUTADOR + WEBCAM (Videoconferência)">TV/COMPUTADOR + WEBCAM (Videoconferência)</option>
              </select>
            </div>

            {/* Motivo da reunião */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3 text-slate-400" /> Motivo / Assunto da Reunião
              </label>
              <textarea
                required
                rows={2}
                placeholder="Ex: Alinhamento trimestral, Integração de novos colaboradores, etc."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={!canEdit}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Lembretes e Notificacoes */}
            <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
              <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
                Lembretes e Notificações dadas ao Responsável
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                {/* Antecedencia */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deseja receber lembrete?</label>
                  <select
                    value={lembreteAntecedencia}
                    onChange={(e) => setLembreteAntecedencia(e.target.value as any)}
                    disabled={!canEdit}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="none">Nenhum lembrete</option>
                    <option value="15min">⏰ 15 minutos antes</option>
                    <option value="30min">⏰ 30 minutos antes</option>
                    <option value="1h">⏰ 1 hora antes</option>
                    <option value="2h">⏰ 2 horas antes</option>
                    <option value="24h">⏰ 24 horas antes</option>
                  </select>
                </div>

                {/* Meio de Envio */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Meio de Envio</label>
                  <select
                    value={lembreteMeio}
                    onChange={(e) => setLembreteMeio(e.target.value as any)}
                    disabled={!canEdit || lembreteAntecedencia === "none"}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    Ativado! O sistema notificará {responsavel || currentUser.nome} às {horaInicial} ({lembreteAntecedencia === "15min" ? "15 minutos antes" : lembreteAntecedencia === "30min" ? "30 minutos antes" : lembreteAntecedencia === "1h" ? "1 hora antes" : lembreteAntecedencia === "2h" ? "2 horas antes" : "24 horas antes"}) via {lembreteMeio === "email" ? "E-mail" : lembreteMeio === "push" ? "Notificação Push" : "E-mail e Notificação Push"}.
                  </span>
                </p>
              )}
            </div>

          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-violet-700 hover:bg-violet-800 text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {booking ? "Atualizar Reserva" : "Confirmar Agendamento"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
