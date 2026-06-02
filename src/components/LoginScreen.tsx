import React, { useState } from "react";
import { SystemUser } from "../types";
import { 
  Lock, Key, Shield, User, ChevronRight, AlertCircle, Sparkles, LogIn, Briefcase, Mail
} from "lucide-react";

interface LoginScreenProps {
  users: SystemUser[];
  onLoginSuccess: (user: SystemUser) => void;
}

export default function LoginScreen({ users, onLoginSuccess }: LoginScreenProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);

  // Quick select helper
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setErrorMsg("");
    
    const user = users.find(u => u.id === userId);
    if (user) {
      setShowPasswordInput(true);
    } else {
      setShowPasswordInput(false);
      setPassword("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedUserId) {
      setErrorMsg("Por favor, selecione seu usuário para continuar.");
      return;
    }

    const matchedUser = users.find(u => u.id === selectedUserId);
    if (!matchedUser) {
      setErrorMsg("Usuário não encontrado.");
      return;
    }

    // Password validation for all registered accounts
    const expectedPassword = matchedUser.senha || "123456";
    if (password !== expectedPassword) {
      setErrorMsg(`Senha inválida! O acesso para o usuário "${matchedUser.nome}" requer a senha correta configurada.`);
      return;
    }

    // Success login transaction
    onLoginSuccess(matchedUser);
  };

  // Safe helper to find selected user object
  const currentUserObj = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-800 font-sans">
      
      {/* Brand logo at the top */}
      <div className="mb-6 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-850 uppercase tracking-widest">
            SALA-SYNC • SISTEMA DE RESERVAS
          </span>
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">SALA-SYNC</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
          Multihospital Florianópolis & Setor de TI
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-8 shadow-md">
        
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="bg-[#6D3292]/10 p-3 rounded-2xl text-[#6D3292]">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800">Identifique-se</h2>
            <p className="text-xs text-slate-400">Escolha sua conta para gerenciar agendamentos</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl mb-5 text-xs font-bold flex items-start gap-2.5 animate-bounce">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="uppercase tracking-wider text-[10px] text-rose-900">Erro de Autenticação</p>
              <p className="font-medium mt-0.5 text-rose-800 leading-snug">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* User selector */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              Selecione seu Usuário *
            </label>
            <div className="relative">
              <select
                value={selectedUserId}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-10 py-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6D3292] font-semibold appearance-none cursor-pointer"
              >
                <option value="">Selecione quem você é...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.nome} ({user.setor} — {user.role})
                  </option>
                ))}
              </select>
              <ChevronRight className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none rotate-90" />
            </div>
          </div>

          {/* User detail quick card snippet */}
          {currentUserObj && (
            <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#6D3292] text-white flex items-center justify-center font-black text-xs uppercase shadow-xs">
                {currentUserObj.avatarUrl || currentUserObj.nome.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-800 truncate">{currentUserObj.nome}</p>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-slate-300" />
                  Setor: {currentUserObj.setor}
                </p>
                <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5 truncate flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-300 shrink-0" />
                  {currentUserObj.email}
                </p>
              </div>
            </div>
          )}

          {/* Password field - mandatory for all accounts */}
          {showPasswordInput && (
            <div className="space-y-2 animate-slide-in">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-black text-slate-450 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-amber-605 animate-pulse" />
                  Senha de Acesso Individual *
                </label>
                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-tighter">
                  Requerido
                </span>
              </div>
              <input
                type="password"
                placeholder="Insira sua senha cadastrada..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6D3292] font-semibold"
                required={showPasswordInput}
              />
              <p className="text-[10px] text-amber-800 bg-amber-50 rounded-lg p-2.5 border border-amber-100 font-semibold leading-normal">
                🔐 <strong>Dica de Desenvolvimento:</strong> A senha padrão para o admin é <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-black">123456</code>. Para outros usuários que você cadastrar na aba <em>Setor de TI &amp; Usuários</em>, utilize a senha registrada durante o cadastro.
              </p>
            </div>
          )}

          {/* Access Button Trigger */}
          <button
            type="submit"
            className="w-full bg-[#6D3292] hover:bg-[#5C2a7B] text-white font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            Acessar Sistema
            <ChevronRight className="w-4 h-4" />
          </button>

        </form>

      </div>

      <div className="mt-6 text-center text-slate-400 text-[10px] uppercase font-black tracking-widest max-w-xs leading-relaxed">
        <p>Apenas colaboradores registrados possuem permissão para agendamentos na Unidade.</p>
        <p className="text-indigo-600 mt-2 hover:underline cursor-pointer font-bold">Desenvolvido por Bruno Rocha - V1.3</p>
      </div>

    </div>
  );
}
