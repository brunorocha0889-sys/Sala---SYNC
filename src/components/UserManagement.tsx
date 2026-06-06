import React, { useState } from "react";
import { SystemUser, Booking, Sector, Equipment } from "../types";
import { 
  Users, UserPlus, Shield, Mail, Briefcase, Trash2, Edit2, CheckCircle2, 
  Lock, AlertTriangle, Key, ArrowRight, UserCheck, Bell, Info, Send, Layers, Settings, ClipboardList
} from "lucide-react";

interface UserManagementProps {
  users: SystemUser[];
  sectors: Sector[];
  equipments: Equipment[];
  bookings: Booking[];
  currentUser: SystemUser;
  onSaveUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onRefreshSectors: () => void;
  onRefreshEquipments: () => void;
}

export default function UserManagement({
  users,
  sectors,
  equipments,
  bookings,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onRefreshSectors,
  onRefreshEquipments,
}: UserManagementProps) {
  const isAdmin = currentUser.role === "Administrador";

  // Form states for Users
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [setorId, setSetorId] = useState("");
  const [role, setRole] = useState<"Administrador" | "Usuário Padrão">("Usuário Padrão");
  const [senha, setSenha] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form states for Sector Manager panel
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [sectorName, setSectorName] = useState("");
  
  // Form states for Equipment Manager panel
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [equipmentName, setEquipmentName] = useState("");
  const [equipmentQty, setEquipmentQty] = useState<number>(1);
  const [equipmentActive, setEquipmentActive] = useState<boolean>(true);

  // Sub-tabs in administration section: "users" | "sectors" | "equipments"
  const [adminSubTab, setAdminSubTab] = useState<"users" | "sectors" | "equipments">("users");

  const handleEditUser = (user: SystemUser) => {
    if (!isAdmin) return;
    setEditingUserId(user.id);
    setNome(user.nome);
    setEmail(user.email);
    setSetorId(user.setorId || "");
    setRole(user.role);
    setSenha(user.senha || "");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNome("");
    setEmail("");
    setSetorId("");
    setRole("Usuário Padrão");
    setSenha("");
  };

  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Apenas administradores do Setor de TI podem realizar essa alteração.");
      return;
    }
    if (!nome.trim() || !email.trim() || !setorId) {
      alert("Preencha todos os campos obrigatórios (Nome, E-mail e Setor).");
      return;
    }
    if (!senha.trim()) {
      alert("Defina uma senha de acesso para o usuário.");
      return;
    }

    const matchedSector = sectors.find(s => s.id === setorId);
    const sectorLabel = matchedSector ? matchedSector.nome : "TI";

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
      setor: sectorLabel,
      setorId,
      role,
      avatarUrl: initials,
      senha: senha.trim(),
    };

    onSaveUser(newUser);
    
    setSuccessMsg(editingUserId ? "Usuário atualizado com sucesso!" : "Novo usuário cadastrado para agendamentos!");
    setTimeout(() => setSuccessMsg(""), 4000);

    handleCancelEdit();
  };

  // SECTORS CRUD Actions API proxier
  const handleSaveSector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) return;

    const token = localStorage.getItem("auth_token") || "";
    try {
      let res;
      if (editingSectorId) {
        res = await fetch(`/api/sectors/${editingSectorId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ nome: sectorName })
        });
      } else {
        res = await fetch(`/api/sectors`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ nome: sectorName })
        });
      }

      if (res.ok) {
        setSuccessMsg(editingSectorId ? "Setor atualizado!" : "Novo setor cadastrado!");
        setTimeout(() => setSuccessMsg(""), 4000);
        setSectorName("");
        setEditingSectorId(null);
        onRefreshSectors();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar setor.");
      }
    } catch {
      alert("Erro ao conectar.");
    }
  };

  const handleDeleteSector = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o setor "${name}"?`)) return;
    const token = localStorage.getItem("auth_token") || "";
    try {
      const res = await fetch(`/api/sectors/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg("Setor removido com sucesso!");
        setTimeout(() => setSuccessMsg(""), 4000);
        onRefreshSectors();
      } else {
        const err = await res.json();
        alert(err.error || "Não foi possível remover o setor.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  // EQUIPMENTS CRUD Actions API proxier
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentName.trim()) return;

    const token = localStorage.getItem("auth_token") || "";
    try {
      let res;
      const payload = {
        nome: equipmentName,
        quantidade: Number(equipmentQty),
        ativo: equipmentActive
      };

      if (editingEquipmentId) {
        res = await fetch(`/api/equipments/${editingEquipmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/equipments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setSuccessMsg(editingEquipmentId ? "Equipamento editado com sucesso!" : "Equipamento adicionado!");
        setTimeout(() => setSuccessMsg(""), 4050);
        setEquipmentName("");
        setEquipmentQty(1);
        setEquipmentActive(true);
        setEditingEquipmentId(null);
        onRefreshEquipments();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar equipamento.");
      }
    } catch {
      alert("Erro ao conectar.");
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente "${name}" da lista de equipamentos?`)) return;
    const token = localStorage.getItem("auth_token") || "";
    try {
      const res = await fetch(`/api/equipments/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg("Equipamento removido!");
        setTimeout(() => setSuccessMsg(""), 4000);
        onRefreshEquipments();
      } else {
        const err = await res.json();
        alert(err.error || "Não foi possível remover o equipamento.");
      }
    } catch {
      alert("Erro de conexão.");
    }
  };

  const handleToggleEquipmentActive = async (eq: Equipment) => {
    const token = localStorage.getItem("auth_token") || "";
    try {
      const res = await fetch(`/api/equipments/${eq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ativo: !eq.ativo })
      });
      if (res.ok) {
        onRefreshEquipments();
      }
    } catch {}
  };


  // Notification history helper
  const generateSimulatedNotifications = () => {
    const notifications: { id: string; user: string; to: string; type: string; time: string; msg: string; channel: string }[] = [];
    
    bookings.slice(0, 8).forEach((b, idx) => {
      const userObj = users.find(u => u.nome.toLowerCase() === b.responsavel.toLowerCase() || u.id === b.usuarioId);
      const emailRecipient = userObj ? userObj.email : `${b.responsavel.toLowerCase().replace(/\s+/g, ".")}@empresa.com`;
      const sectorTag = userObj ? userObj.setor : "Geral";

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
          
          {/* Sub Navigation for Administrators inside Management module */}
          <div className="flex border-b border-slate-150 mb-5 gap-2 font-mono text-[10px] h-9">
            <button
              onClick={() => { setAdminSubTab("users"); handleCancelEdit(); }}
              className={`pb-2 px-2 font-extrabold uppercase tracking-wider transition-all cursor-pointer ${adminSubTab === "users" ? "border-b-2 border-indigo-650 text-indigo-700 font-black" : "text-slate-450 hover:text-slate-700"}`}
            >
              Usuários
            </button>
            <button
              onClick={() => { setAdminSubTab("sectors"); handleCancelEdit(); }}
              className={`pb-2 px-2 font-extrabold uppercase tracking-wider transition-all cursor-pointer ${adminSubTab === "sectors" ? "border-b-2 border-indigo-650 text-indigo-700 font-black" : "text-slate-450 hover:text-slate-700"}`}
            >
              Setores ({sectors.length})
            </button>
            <button
              onClick={() => { setAdminSubTab("equipments"); handleCancelEdit(); }}
              className={`pb-2 px-2 font-extrabold uppercase tracking-wider transition-all cursor-pointer ${adminSubTab === "equipments" ? "border-b-2 border-indigo-650 text-indigo-700 font-black" : "text-slate-450 hover:text-slate-700"}`}
            >
              Equipamentos ({equipments.length})
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              {adminSubTab === "users" ? <UserPlus className="w-5 h-5" /> : adminSubTab === "sectors" ? <Layers className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                {adminSubTab === "users" ? (editingUserId ? "Editar Usuário" : "Cadastrar Usuário") : 
                 adminSubTab === "sectors" ? (editingSectorId ? "Editar Setor" : "Cadastrar Setor") : 
                 (editingEquipmentId ? "Editar Equipamento" : "Adicionar Equipamento")}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                Permissão Administrada por: {currentUser.setor} (TI)
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isAdmin ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-950 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                <Lock className="w-4 h-4 text-amber-600" />
                Acesso Restrito ao Admin
              </div>
              <p className="text-xs leading-relaxed">
                Você deve ser um administrador corporativo para modificar setores, equipamentos e usuários.
              </p>
            </div>
          ) : (
            <>
              {/* SUB TAB: USERS FORM */}
              {adminSubTab === "users" && (
                <form onSubmit={handleSubmitUser} className="space-y-4">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      E-mail Oficial *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: joao.silva@sala-sync.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Setor Corporativo *
                    </label>
                    <select
                      value={setorId}
                      required
                      onChange={(e) => setSetorId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold appearance-none cursor-pointer"
                    >
                      <option value="">Selecione um setor cadastrado...</option>
                      {sectors.map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.nome}
                        </option>
                      ))}
                    </select>
                  </div>

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
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Senha de Acesso do Usuário *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Defina uma senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

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
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* SUB TAB: SECTORS FORM */}
              {adminSubTab === "sectors" && (
                <form onSubmit={handleSaveSector} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome do Setor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Faturamento"
                      value={sectorName}
                      onChange={(e) => setSectorName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-sm transition-all text-center"
                    >
                      {editingSectorId ? "Atualizar Setor" : "Cadastrar Setor"}
                    </button>
                    {editingSectorId && (
                      <button
                        type="button"
                        onClick={() => { setEditingSectorId(null); setSectorName(""); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl"
                      >
                        Voltar
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">Setores Atuais</p>
                    <div className="space-y-1.5 max-h-[180px] overflow-y-auto scrollbar-thin">
                      {sectors.map(sec => (
                        <div key={sec.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-110 text-xs">
                          <span className="font-bold text-slate-800">{sec.nome}</span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setEditingSectorId(sec.id); setSectorName(sec.nome); }}
                              className="text-indigo-600 hover:text-indigo-800 font-bold"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSector(sec.id, sec.nome)}
                              className="text-rose-600 hover:text-rose-800 font-bold"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* SUB TAB: EQUIPMENTS FORM */}
              {adminSubTab === "equipments" && (
                <form onSubmit={handleSaveEquipment} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome do Equipamento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Projetor / Datashow"
                      value={equipmentName}
                      onChange={(e) => setEquipmentName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      Quantidade Disponível para Reserva *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={equipmentQty}
                      onChange={(e) => setEquipmentQty(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="eq-active"
                      checked={equipmentActive}
                      onChange={(e) => setEquipmentActive(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="eq-active" className="text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none">
                      Equipamento Ativo para Solicitações
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-sm transition-all text-center"
                    >
                      {editingEquipmentId ? "Salvar Equipamento" : "Adicionar Equipamento"}
                    </button>
                    {editingEquipmentId && (
                      <button
                        type="button"
                        onClick={() => { setEditingEquipmentId(null); setEquipmentName(""); setEquipmentQty(1); setEquipmentActive(true); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-xl"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-3 mt-3">
                    <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest mb-2">Equipamentos Atuais</p>
                    <div className="space-y-1.5 max-h-[150px] overflow-y-auto scrollbar-thin">
                      {equipments.map(eq => (
                        <div key={eq.id} className="p-2 bg-slate-50 rounded-lg border border-slate-110 text-xs flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{eq.nome}</span>
                            <span className="font-mono bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded">
                              Qtd: {eq.quantidade}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleEquipmentActive(eq)}
                              className={`text-[9px] uppercase tracking-wide font-extrabold px-1.5 py-0.5 rounded ${eq.ativo ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-150 text-slate-500 border border-slate-300"}`}
                            >
                              {eq.ativo ? "● Ativo" : "○ Inativo"}
                            </button>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => { setEditingEquipmentId(eq.id); setEquipmentName(eq.nome); setEquipmentQty(eq.quantidade); setEquipmentActive(eq.ativo); }}
                                className="text-indigo-600 hover:text-indigo-800 font-bold"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEquipment(eq.id, eq.nome)}
                                className="text-rose-600 hover:text-rose-800 font-bold"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Informative footer widget */}
        <div className="mt-6 border-t border-slate-100 pt-4 text-[10px] text-slate-400 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="font-bold uppercase text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            Integridade de Setores e Materiais
          </p>
          <p className="leading-snug">
            Toda reserva exige que o solicitante seja devidamente indexado pelo seu setor de origem. Os equipamentos solicitados passam por um robô de concorrência que impede o excesso de agendamentos de aparelhos em um mesmo intervalo de horas.
          </p>
        </div>
      </div>

      {/* Center & Right Column: User list + Notification logs */}
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
                      {isSelected ? (
                        <span className="text-[9px] bg-emerald-50 border border-emerald-250 text-emerald-800 font-black px-2 py-1 rounded-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> LOGADO ATUALMENTE
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-100 text-slate-400 border border-slate-200 px-2 py-1 rounded-lg font-bold">
                          OUTRA CONTA
                        </span>
                      )}

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
