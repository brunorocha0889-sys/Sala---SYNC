import React, { useState } from "react";
import { SystemUser, Booking } from "../types";
import { 
  Users, UserPlus, Shield, Mail, Briefcase, Trash2, Edit2, CheckCircle2, 
  Lock, AlertTriangle, Key, ArrowRight, UserCheck, Bell, Info, Send 
} from "lucide-react";

interface UserManagementProps {
  users: SystemUser[];
  bookings: Booking[];
  currentUser: SystemUser;
  onSaveUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onSelectUser?: (user: SystemUser) => void;
}

export default function UserManagement({
  users,
  bookings,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSelectUser,
}: UserManagementProps) {
  const isAdmin = currentUser.role === "Administrador";

  // Form states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setor, setSetor] = useState("");
  const [role, setRole] = useState<"Administrador" | "Usuário Padrão">("Usuário Padrão");
  const [senha, setSenha] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleEditUser = (user: SystemUser) => {
    if (!isAdmin) return;
    setEditingUserId(user.id);
    setNome(user.nome);
    setEmail(user.email);
    setSetor(user.setor);
    setRole(user.role);
    setSenha(user.senha || "");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNome("");
    setEmail("");
    setSetor("");
    setRole("Usuário Padrão");
    setSenha("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Apenas administradores do Setor de TI podem realizar essa alteração.");
      return;
    }
    if (!nome.trim() || !email.trim() || !setor.trim()) {
      alert("Preencha todos os campos obrigatórios (Nome, E-mail e Setor).");
      return;
    }
    if (!senha.trim()) {
      alert("Defina uma senha de acesso para o usuário.");
      return;
    }

    const initials = nome
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US";

    const newUser: SystemUser = {
      id: editingUserId || `user-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      setor: setor.trim(),
      role,
      avatarUrl: initials,
      senha: senha.trim(),
    };

    onSaveUser(newUser);
    
    // Feedback
    setSuccessMsg(editingUserId ? "Usuário atualizado com sucesso!" : "Novo usuário cadastrado para agendamentos!");
    setTimeout(() => setSuccessMsg(""), 4000);

    // Reset
    handleCancelEdit();
  };

  // Sector list helper
  const sectors = ["TI", "Qualidade", "Faturamento", "Fisioterapia", "Enfermagem", "Financeiro", "Recursos Humanos", "Diretoria"];

  // Notification history helper: let's build simulations of emails and push alerts
  const generateSimulatedNotifications = () => {
    const notifications: { id: string; user: string; to: string; type: string; time: string; msg: string; channel: string }[] = [];
    
    // Sort bookings to get recent updates/creates simulating real-time mail queues
    bookings.slice(0, 8).forEach((b, idx) => {
      const userObj = users.find(u => u.nome.toLowerCase() === b.responsavel.toLowerCase() || u.id === b.usuarioId);
      const emailRecipient = userObj ? userObj.email : `${b.responsavel.toLowerCase().replace(/\s+/g, ".")}@empresa.com`;
      const sectorTag = userObj ? userObj.setor : "Geral";

      // Simulation entry
      notifications.push({
        id: `noti-email-${b.id}-${idx}`,
        user: b.responsavel,
        to: emailRecipient,
        type: b.situacao === "Cancelado" ? "Cancelamento" : b.situacao === "Finalizado" ? "Conclusão" : "Confirmação",
        time: `Hoje às ${b.horaInicial}`,
        msg: b.situacao === "Cancelado" 
          ? `Alerta de Cancelamento enviado: O agendamento da sala "${b.sala}" para "${b.motivo}" foi cancelado.`
          : `E-mail de confirmação enviado para ${emailRecipient}: Reserva na sala "${b.sala}" agendada de ${b.horaInicial} até ${b.horaFinal} sobre de "${b.motivo}" foi confirmada pelo setor de ${sectorTag}.`,
        channel: "E-mail",
      });
    });

    return notifications;
  };

  const notificationLogs = generateSimulatedNotifications();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* Admin Panel Controls Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs lg:col-span-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                {editingUserId ? "Editar Usuário" : "Cadastrar Novo Usuário"}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                Permissão Administrada por: {currentUser.setor} (TI)
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isAdmin ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4 text-amber-600" />
                Acesso Restrito ao Admin (Setor de TI)
              </div>
              <p className="text-xs leading-relaxed">
                Você está logado como <strong>{currentUser.nome}</strong> ({currentUser.role} / Setor {currentUser.setor}). 
                A criação, deleção e edição de credenciais de usuários aptos a reservar salas são privilégios exclusivos de administradores operacionais do Setor de TI.
              </p>
              <div className="text-[10px] bg-amber-100 border border-amber-200 p-2 rounded text-amber-900 font-semibold leading-normal">
                💡 Utilize o <strong>Simulador de Permissões</strong> no topo direito da tela para trocar para o usuário "Amanda de Souza (Admin)" e testar todos os fluxos de escrita.
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Ferreira da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  E-mail Oficial * (Receberá as notificações)
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ex: joao.silva@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Setor */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Setor do Usuário *
                </label>
                <select
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">Selecione o setor...</option>
                  {sectors.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Cargo / Nível de Permissão
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("Usuário Padrão")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === "Usuário Padrão"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    Usuário Padrão
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("Administrador")}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                      role === "Administrador"
                        ? "bg-violet-50 border-violet-200 text-violet-700"
                        : "bg-slate-50 border-slate-200 text-slate-500"
                    }`}
                  >
                    Administrador
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 font-medium block mt-1.5 italic">
                  * Administradores podem visualizar e editar todos os agendamentos.
                </span>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                  Senha de Acesso do Usuário *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Defina uma senha segura para este login"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
                <span className="text-[9px] text-slate-450 block mt-1 leading-normal">
                  Esta senha será obrigatória para este usuário realizar login ao entrar no sistema.
                </span>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-sm transition-all text-center"
                >
                  {editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Informative tips widget */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] text-slate-400 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="font-bold uppercase text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            Integridade do Sistema
          </p>
          <p className="leading-snug">
            Usuários cadastrados vinculados a reservas garantem que os e-mails e alertas sejam despachados para as Unidades correspondentes com sucesso.
          </p>
        </div>
      </div>

      {/* Center & Right Column: User list + real-time Notification simulations log */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Users List Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-indigo-500" />
                Lista de Usuários Cadastrados
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Visão geral e atalhos rápidos de controle de acesso</p>
            </div>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
              {users.length} usuários cadastrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => {
              const count = bookings.filter(
                (b) => b.responsavel.toLowerCase().trim() === user.nome.toLowerCase().trim() || b.usuarioId === user.id
              ).length;
              
              const isSelected = currentUser.id === user.id;

              return (
                <div 
                  key={user.id} 
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    isSelected 
                      ? "border-violet-600 bg-violet-50/20 shadow-xs" 
                      : "border-slate-100 hover:border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Circle Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs">
                      {user.avatarUrl || user.nome.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-slate-800 truncate" title={user.nome}>
                          {user.nome}
                        </h4>
                        {user.role === "Administrador" ? (
                          <span className="text-[8px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            Admin (TI)
                          </span>
                        ) : (
                          <span className="text-[8px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            Colaborador
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 block text-slate-300" />
                        Setor: {user.setor}
                      </p>

                      <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5 truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3 flex items-center justify-between">
                    <span className="text-[9px] font-black text-[#6D3292] uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full">
                      {count} {count === 1 ? 'reserva ativa' : 'reservas ativas'}
                    </span>

                    <div className="flex items-center gap-1.5 font-sans">
                      {/* Show context indicator. Implemented absolute login isolation in user area */}
                      {isSelected ? (
                        <span className="text-[9px] bg-emerald-55 border border-emerald-250 text-emerald-800 font-black px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LOGADO ATUALMENTE
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-400 border border-slate-200 px-2 py-1 rounded-lg font-bold">
                          OUTRA CONTA
                        </span>
                      )}

                      {/* Edit actions (Admin only) */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ml-1"
                            title="Editar Dados do Usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (user.id === "user-admin") {
                                alert("Você não pode excluir o administrador principal por razões de segurança.");
                                return;
                              }
                              if (window.confirm(`Excluir permanentemente o cadastro de "${user.nome}"?`)) {
                                onDeleteUser(user.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Remover Usuário"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Notification Logs Simulation Tracker */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-805 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4.5 h-4.5 text-indigo-500 animate-bounce" />
                Histórico de Envio de Notificações
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Disparos de email e push enviados aos responsáveis pelas reservas</p>
            </div>
            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              Serviço Ativo
            </span>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[280px] overflow-y-auto scrollbar-thin">
            {notificationLogs.length > 0 ? (
              notificationLogs.map((log) => {
                const isCancel = log.type === "Cancelamento";
                return (
                  <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${isCancel ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      <Send className="w-3.5 h-3.5 rotate-45" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-slate-800">
                          Notificação via <span className="bg-slate-100 text-slate-600 font-mono px-1 rounded">{log.channel}</span> para <strong className="text-indigo-600">{log.user}</strong>
                        </p>
                        <span className="text-[9px] text-slate-400 font-bold shrink-0">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-snug">
                        {log.msg}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-4 text-xs text-slate-400 italic text-center">Nenhuma notificação enviada ainda.</p>
            )}
          </div>
          <p className="text-[10px] text-slate-400 italic mt-3 text-right">
            Sincronizado de acordo com o e-mail de cadastro de cada usuário.
          </p>
        </div>

      </div>

    </div>
  );
}
