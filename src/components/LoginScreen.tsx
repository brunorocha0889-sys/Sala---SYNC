import React, { useState } from "react";
import { SystemUser } from "../types";
import { 
  Lock, AlertCircle, Sparkles, LogIn, Mail, ChevronRight
} from "lucide-react";

interface LoginScreenProps {
  onLoginSuccess: (user: SystemUser, token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Por favor, preencha todos os campos.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), senha: password })
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "E-mail ou senha incorretos.");
        setIsLoading(false);
        return;
      }

      const { user, token } = await res.json();
      onLoginSuccess(user, token);
    } catch (err) {
      setErrorMsg("Erro ao comunicar com o servidor de autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-800 font-sans">
      
      {/* Brand logo at the top */}
      <div className="mb-6 text-center animate-fade-in animate-duration-300">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full mb-3 shadow-xs">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">
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
            <p className="text-xs text-slate-400">Insira suas credenciais corporativas</p>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl mb-5 text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="uppercase tracking-wider text-[10px] text-rose-900">Erro de Autenticação</p>
              <p className="font-medium mt-0.5 text-rose-800 leading-snug">{errorMsg}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email input */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-350" />
              E-mail de Acesso *
            </label>
            <input
              type="email"
              placeholder="Ex: admin@sala-sync.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6D3292] font-semibold"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-350" />
                Senha de Acesso Individual *
              </label>
            </div>
            <input
              type="password"
              placeholder="Insira sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6D3292] font-semibold"
              required
              disabled={isLoading}
            />
          </div>

          <p className="text-[10px] text-amber-800 bg-amber-50 rounded-lg p-2.5 border border-amber-100 font-semibold leading-normal">
            🔐 <strong>Acesso Administrativo:</strong> Utilize o e-mail <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-black">admin@sala-sync.com</code> com a senha de desenvolvimento <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-950 font-black">123456</code>.
          </p>

          {/* Access Button Trigger */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#6D3292] hover:bg-[#5C2a7B] text-white font-black text-xs uppercase tracking-widest py-4 px-4 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Validando Credenciais..." : "Acessar Sistema"}
            <ChevronRight className="w-4 h-4" />
          </button>

        </form>

      </div>

      <div className="mt-6 text-center text-slate-400 text-[10px] uppercase font-black tracking-widest max-w-xs leading-relaxed">
        <p>Apenas colaboradores registrados possuem permissão para agendamentos na Unidade.</p>
        <p className="text-[#6D3292] mt-2 hover:underline cursor-pointer font-bold">Desenvolvido por Bruno Rocha - V1.4</p>
      </div>

    </div>
  );
}
