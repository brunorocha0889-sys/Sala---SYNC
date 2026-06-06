import { useState, useEffect, useMemo } from "react";
import { Booking, SystemUser, ToastMessage, Sector, Equipment } from "./types";
import BookingStats from "./components/BookingStats";
import BookingTable from "./components/BookingTable";
import BookingCalendar from "./components/BookingCalendar";
import BookingForm from "./components/BookingForm";
import UserManagement from "./components/UserManagement";
import LoginScreen from "./components/LoginScreen";
import WelcomeTour from "./components/WelcomeTour";
import ToastContainer from "./components/Toast";
import ExportPanel from "./components/ExportPanel";
import { AnimatePresence } from "motion/react";
import { 
  Calendar as CalendarIcon, 
  Table as TableIcon, 
  LayoutDashboard, 
  ShieldAlert, 
  Sparkles, 
  Info,
  Sun,
  Moon,
  Users,
  LogOut,
  Download
} from "lucide-react";

function parseTimeToMinutes(tStr: string): number {
  if (!tStr) return 0;
  const parts = tStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

// Helper to automatically finalize bookings that have completed their scheduled time
export const autoFinalizePastBookings = (currentBookings: Booking[]): { updatedList: Booking[], changed: boolean } => {
  const now = new Date();
  let changed = false;
  const updatedList = currentBookings.map((b) => {
    if (b.situacao !== "Confirmado") return b;
    
    try {
      const timeStr = b.horaFinal || b.horaInicial;
      if (!b.data || !timeStr) return b;
      
      const [year, month, day] = b.data.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      
      // Compare in user's browser local date context matching their scheduler input
      const bookingEnd = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      if (now > bookingEnd) {
        changed = true;
        return { ...b, situacao: "Finalizado" as const };
      }
    } catch (e) {
      console.error("Erro ao verificar auto-finalização do agendamento:", e);
    }
    return b;
  });
  return { updatedList, changed };
};

export default function App() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  
  const [currentUser, setCurrentUser] = useState<SystemUser>({
    id: "",
    nome: "Carregando...",
    email: "",
    role: "Usuário Padrão",
    setor: "TI"
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"calendar" | "spreadsheet" | "dashboard" | "users" | "export">("calendar");
  
  // Theme state for light/dark mode
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") return "dark";
    } catch (e) {}
    return "light";
  });

  // Edit & Add states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Toast notifications state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: "success" | "error" | "warning" | "info", 
    title: string, 
    message: string, 
    duration?: number
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check if tour was already shown to the user or open manually
  const [isTourOpen, setIsTourOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("tour_completed");
      return saved !== "true";
    } catch (e) {
      return true;
    }
  });

  // Sync theme to document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Helper to construct request headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("auth_token") || "";
    return {
      "Authorization": `Bearer ${token}`
    };
  };

  const getHeadersAndBodyType = () => {
    const token = localStorage.getItem("auth_token") || "";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  };

  // Load users from Backend API
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        // Sync active user if loaded
        const savedActiveUserId = localStorage.getItem("active_user_id");
        const found = data.find((u: SystemUser) => u.id === savedActiveUserId);
        if (found) {
          setCurrentUser(found);
        }
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    }
  };

  // Load sectors from Backend API
  const fetchSectors = async () => {
    try {
      const res = await fetch("/api/sectors", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      }
    } catch (e) {
      console.error("Erro ao carregar setores:", e);
    }
  };

  // Load equipments from Backend API
  const fetchEquipments = async () => {
    try {
      const res = await fetch("/api/equipments", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setEquipments(data);
      }
    } catch (e) {
      console.error("Erro ao carregar equipamentos:", e);
    }
  };

  // Load rooms from Backend API
  const [rooms, setRooms] = useState<any[]>([]);
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const isAdminVal = currentUser && currentUser.role === "Administrador";
      const endpoint = isAdminVal ? "/api/rooms/all" : "/api/rooms";
      const res = await fetch(endpoint, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (e) {
      console.error("Erro ao carregar salas:", e);
    }
  };

  // Load bookings from Backend API
  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings", {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error("Erro ao carregar reservas:", e);
    }
  };

  // Load data on boot
  useEffect(() => {
    const loggedInVal = localStorage.getItem("is_logged_in") === "true";
    const token = localStorage.getItem("auth_token");
    if (loggedInVal && token) {
      setIsLoggedIn(true);
      fetchUsers();
      fetchBookings();
      fetchSectors();
      fetchEquipments();
      fetchRooms();
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  // Track changes to currentUser role or isLoggedIn to live-reload rooms permissions context
  useEffect(() => {
    if (isLoggedIn) {
      fetchRooms();
    }
  }, [isLoggedIn, currentUser?.role]);

  // Periodic background check to fetch real-time updates
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      fetchBookings();
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Safe redirect if regular user attempts to open Users tab
  useEffect(() => {
    if (isLoggedIn && currentUser.id && currentUser.role !== "Administrador" && activeTab === "users") {
      setActiveTab("spreadsheet");
    }
  }, [activeTab, currentUser, isLoggedIn]);

  // Save user changes callback to Express API
  const handleSaveUser = async (user: SystemUser) => {
    const exists = users.some((u) => u.id === user.id);
    try {
      let res;
      if (exists) {
        res = await fetch(`/api/users/${user.id}`, {
          method: "PUT",
          headers: getHeadersAndBodyType(),
          body: JSON.stringify(user)
        });
      } else {
        res = await fetch(`/api/users`, {
          method: "POST",
          headers: getHeadersAndBodyType(),
          body: JSON.stringify(user)
        });
      }

      if (res.ok) {
        const savedData = await res.json();
        addToast(
          "success", 
          "Operação realizada com sucesso", 
          exists ? `Os dados do usuário "${user.nome}" foram alterados.` : `O usuário "${user.nome}" foi cadastrado com sucesso.`
        );
        fetchUsers();
        
        // If changed current logged-in profile, update state
        if (currentUser.id === user.id) {
          setCurrentUser(savedData);
        }
      } else {
        const errData = await res.json();
        addToast("error", "Erro ao salvar usuário", errData.error || "Campos inválidos ou email duplicado.");
      }
    } catch (e) {
      addToast("error", "Erro de Rede", "Não foi possível conectar ao servidor.");
    }
  };

  // Delete user
  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        addToast("success", "Deletado!", "Usuário removido.");
        fetchUsers();
        
        if (currentUser.id === id) {
          handleLogout();
        }
      } else {
        const errData = await res.json();
        addToast("error", "Erro!", errData.error || "Erro ao deletar usuário.");
      }
    } catch (e) {
      addToast("error", "Erro!", "Ocorreu um erro de rede.");
    }
  };

  const handleLoginSuccess = (user: SystemUser, token: string) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem("active_user_id", user.id);
    localStorage.setItem("is_logged_in", "true");
    localStorage.setItem("auth_token", token);
    
    // Load fresh data
    fetchUsers();
    fetchBookings();
    fetchSectors();
    fetchEquipments();
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("is_logged_in");
    localStorage.removeItem("active_user_id");
    localStorage.removeItem("auth_token");
  };

  // Add / Edit Booking save transaction handler
  const handleSaveBooking = async (booking: Booking & { deSectorsAuto?: string; deEquipmentsIds?: any[] }) => {
    const exists = bookings.some((b) => b.id === booking.id);
    
    // Check permission to cancel or edit
    if (exists) {
      const targetB = bookings.find((b) => b.id === booking.id);
      if (targetB) {
        const isOwner = targetB.usuarioId === currentUser.id || targetB.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim();
        const isAdmin = currentUser.role === "Administrador";
        if (!isOwner && !isAdmin) {
          addToast(
            "error",
            "Permissão Negada",
            "Apenas quem fez o agendamento ou o administrador pode modificar esta reserva."
          );
          return;
        }
      }
    }

    const { deSectorsAuto, deEquipmentsIds, ...cleanBooking } = booking;

    const finalBooking = {
      ...cleanBooking,
      usuarioId: booking.usuarioId || (booking.id ? undefined : currentUser.id),
      equipamentosSolicitados: deEquipmentsIds || []
    };

    try {
      let res;
      if (exists) {
        res = await fetch(`/api/bookings/${booking.id}`, {
          method: "PUT",
          headers: getHeadersAndBodyType(),
          body: JSON.stringify(finalBooking)
        });
      } else {
        res = await fetch(`/api/bookings`, {
          method: "POST",
          headers: getHeadersAndBodyType(),
          body: JSON.stringify(finalBooking)
        });
      }

      if (res.ok) {
        addToast(
          "success",
          exists ? "Reserva Atualizada!" : "Reserva Criada!",
          exists 
            ? `O agendamento para a sala "${booking.sala}" foi atualizado com sucesso.`
            : `Seu agendamento para a sala "${booking.sala}" foi registrado para o dia ${booking.data.split("-").reverse().join("/")}!`
        );
        fetchBookings();
        fetchEquipments(); // refresh available counts
        setIsFormOpen(false);
        setEditingBooking(null);
      } else {
        const errData = await res.json();
        addToast("error", "Erro ao salvar", errData.error || "Ocorreu um problema ao salvar a reserva.");
      }
    } catch (e) {
      addToast("error", "Erro de Rede", "Não foi possível sincronizar sua solicitação com o servidor.");
    }
  };

  // Quick state update shortcut
  const handleUpdateStatus = async (id: string, status: "Finalizado" | "Confirmado" | "Cancelado") => {
    const targetB = bookings.find((b) => b.id === id);
    if (targetB) {
      const isOwner = targetB.usuarioId === currentUser.id || targetB.responsavel.toLowerCase().trim() === currentUser.nome.toLowerCase().trim();
      const isAdmin = currentUser.role === "Administrador";

      // Permission check for cancel action
      if (!isOwner && !isAdmin) {
        addToast(
          "error",
          "Permissão Negada",
          "Apenas quem fez o agendamento ou o administrador pode alterar o status desta reserva."
        );
        return;
      }

      try {
        const res = await fetch(`/api/bookings/${id}/status`, {
          method: "PATCH",
          headers: getHeadersAndBodyType(),
          body: JSON.stringify({ situacao: status })
        });

        if (res.ok) {
          addToast(
            "success",
            "Status Atualizado",
            `A reserva de ${targetB.responsavel} foi alterada para "${status}" com sucesso.`
          );
          fetchBookings();
          fetchEquipments();
        } else {
          const errData = await res.json();
          addToast(
            "warning",
            "Não foi possível salvar",
            errData.error || "Houve um conflito e a reserva não pôde ser salva."
          );
        }
      } catch (e) {
        addToast("error", "Erro", "Erro ao conectar-se ao servidor.");
      }
    }
  };

  // Remote Delete Booking
  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        addToast("success", "Excluído", "O agendamento foi removido.");
        fetchBookings();
        fetchEquipments();
      } else {
        addToast("error", "Erro", "Não foi possível excluir o agendamento.");
      }
    } catch (e) {
      addToast("error", "Erro de Conexão", "Houve uma falha ao enviar o comando.");
    }
  };

  // Trigger form pre-seeded with existing booking but without conflicts
  const handleDuplicateBooking = (booking: Booking) => {
    const duplicated: Booking = {
      ...booking,
      id: "", // clear ID so it registers as brand new
      data: new Date().toISOString().split("T")[0], // default to today
    };
    setEditingBooking(duplicated);
    setIsFormOpen(true);
  };

  // Open scheduler modal with preset date
  const handleAddOnDate = (dateStr: string) => {
    const prefilled: Booking = {
      id: "",
      data: dateStr,
      horaInicial: "09:00",
      horaFinal: "10:30",
      sala: "Sala de reuniões 2",
      tempoDeUso: "1:30hs",
      pessoas: "",
      responsavel: currentUser.nome,
      equipamentos: "Sem material",
      motivo: "",
      situacao: "Confirmado",
    };
    setEditingBooking(prefilled);
    setIsFormOpen(true);
  };

  // Open scheduler modal in empty mode
  const handleAddNewClick = () => {
    setEditingBooking(null);
    setIsFormOpen(true);
  };

  // Trigger edit on specific booking
  const handleEditClick = (booking: Booking) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  // Export current list to CSV file
  const handleExportCSV = () => {
    try {
      const headers = ["Data", "Hora Inicial", "Hora Final", "Sala", "Tempo de Uso", "Pessoas", "Responsavel", "Equipamentos", "Motivo", "Situacao"];
      const csvRows = [headers.join(",")];
      
      bookings.forEach((b) => {
        const row = [
          b.data.split("-").reverse().join("/"),
          b.horaInicial,
          b.horaFinal,
          `"${b.sala.replace(/"/g, '""')}"`,
          b.tempoDeUso,
          `"${(b.pessoas || "").replace(/"/g, '""')}"`,
          `"${b.responsavel.replace(/"/g, '""')}"`,
          `"${b.equipamentos.replace(/"/g, '""')}"`,
          `"${b.motivo.replace(/"/g, '""')}"`,
          b.situacao
        ];
        csvRows.push(row.join(","));
      });
      
      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `agendamentos_salas_${new Date().toLocaleDateString("pt-BR")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Houve um problema ao exportar os dados.");
    }
  };

  // Check how many same-day collisions we currently have in total
  const getSimultaneousConflictsCount = () => {
    let count = 0;
    const active = bookings.filter((b) => b.situacao !== "Cancelado");
    
    // Simple verification
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const b1 = active[i];
        const b2 = active[j];
        if (b1.sala === b2.sala && b1.data === b2.data) {
          const s1 = b1.horaInicial;
          const e1 = b1.horaFinal || b1.horaInicial;
          const s2 = b2.horaInicial;
          const e2 = b2.horaFinal || b2.horaInicial;
          
          const s1Min = parseTimeToMinutes(s1);
          const e1Min = parseTimeToMinutes(e1);
          const s2Min = parseTimeToMinutes(s2);
          const e2Min = parseTimeToMinutes(e2);
          
          if (s1Min < e2Min && e1Min > s2Min) {
            count++;
          }
        }
      }
    }
    return count;
  };

  const currentConflicts = getSimultaneousConflictsCount();

  // Get next 3 upcoming reservations sorted by date (excluding Canceled)
  const nextReservations = useMemo(() => {
    return bookings
      .filter((b) => b.situacao !== "Cancelado")
      .sort((a, b) => a.data.localeCompare(b.data) || a.horaInicial.localeCompare(b.horaInicial))
      .slice(0, 3);
  }, [bookings]);

  // Translate Portuguese Month Name
  const formatHeaderDate = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleDateString("pt-BR", { month: "long" });
    const year = now.getFullYear();
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1);
    return `${day} de ${capMonth}, ${year}`;
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Dynamic Bento Style Container */}
      <div className="w-full max-w-[1240px] mx-auto p-4 md:p-6 lg:p-8 flex-grow flex flex-col gap-6">
        
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-2 gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.svg" 
              alt="Sala Sync Logo" 
              className="w-12 h-12 hover:rotate-12 transition-transform duration-300 ease-out pointer-events-auto"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">SALA-SYNC</h1>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                  v1.4.0
                </span>
              </div>
              <p className="text-slate-500 font-semibold text-sm">
                Gerenciamento de Espaços • {formatHeaderDate()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white px-4 py-2.5 border border-slate-200/80 rounded-2xl shadow-xs">
            <div className="text-right">
              <p className="text-sm font-black text-slate-800">{currentUser.nome}</p>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest text-right mt-0.5">
                Setor: {currentUser.setor} • {currentUser.role}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-violet-700 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 uppercase" title={currentUser.email}>
              {currentUser.avatarUrl || currentUser.nome.charAt(0)}
            </div>
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-xl transition-all shrink-0 cursor-pointer"
              title={theme === "light" ? "Alternar para Modo Escuro" : "Alternar para Modo Claro"}
              aria-label="Alternar Tema"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsTourOpen(true)}
              className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-indigo-400 rounded-xl transition-all shrink-0 cursor-pointer"
              title="Ver Tour de Instruções"
              aria-label="Tour de Instruções"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all shrink-0 cursor-pointer"
              title="Sair da Conta (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Warning Alert: Conflicts */}
        {currentConflicts > 0 && (
          <div className="bg-amber-50 border border-amber-200 text-amber-950 p-4 rounded-3xl flex gap-3 shadow-xs animate-slide-in">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Alerta de Conflitos na Planilha</p>
              <p className="text-xs text-amber-900/95 mt-1">
                Existe(m) <strong>{currentConflicts}</strong> conflito(s) de horário de salas que coincidem no mesmo dia!
                Por favor, confira os horários de início e término das reservas destacadas para evitar transtornos de ocupação.
              </p>
            </div>
          </div>
        )}

        {/* Top Bento Dashboard Ribbon */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: Main statistics trigger */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between min-h-[140px]">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total de Reservas Ativas</p>
              <h3 className="text-4xl font-extrabold text-slate-800 mt-2">
                {bookings.filter(b => b.situacao === "Confirmado").length}
              </h3>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-black tracking-wider pt-2 border-t border-slate-50">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">Filtro: Confirmadas</span>
            </div>
          </div>

          {/* Card 2: Next Reservation Bento list */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col min-h-[140px] md:col-span-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block animate-pulse"></span>
              Próximos Agendamentos
            </h3>
            
            <div className="space-y-2 flex-grow overflow-y-auto max-h-[120px] scrollbar-thin">
              {nextReservations.length > 0 ? (
                nextReservations.map((res) => {
                  const isSchool = res.sala.includes("Escola");
                  return (
                    <div 
                      key={res.id} 
                      onClick={() => handleEditClick(res)}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-center shrink-0">
                          <p className="text-[10px] font-bold text-slate-400">{res.horaInicial}</p>
                          <div className={`w-1 h-4 mx-auto rounded-full ${isSchool ? 'bg-amber-500' : 'bg-emerald-600'}`}></div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{res.motivo}</p>
                          <p className="text-[10px] text-slate-400 font-semibold italic">
                            {res.sala} • {res.responsavel}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        {res.data.split("-").reverse().slice(0, 2).join("/")}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">Sem reservas programadas.</p>
              )}
            </div>
          </div>

          {/* Card 3: Quick Action/New Booking */}
          <div 
            onClick={handleAddNewClick}
            className="bg-slate-900 hover:bg-slate-850 rounded-3xl p-5 text-white flex flex-col justify-center items-center gap-2 cursor-pointer shadow-xs transition-all hover:scale-102 active:scale-98"
          >
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-2xl font-semibold shadow-inner">
              +
            </div>
            <p className="font-bold text-center text-sm leading-tight">Novo<br />Agendamento</p>
            <p className="text-[9px] opacity-60 text-center uppercase tracking-widest font-extrabold">Atalho Rápido</p>
          </div>

        </div>

        {/* Tab Controls Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-2 flex flex-wrap gap-2 shadow-xs">
          {/* 1º - CALENDÁRIO MENSAL */}
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "calendar"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-slate-505 hover:text-slate-850 hover:bg-slate-50/80"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendário Mensal
          </button>

          {/* 2º - PLANILHA INTERATIVA */}
          <button
            onClick={() => setActiveTab("spreadsheet")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "spreadsheet"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-slate-505 hover:text-slate-850 hover:bg-slate-50/80"
            }`}
          >
            <TableIcon className="w-4 h-4" />
            Planilha Interativa
          </button>

          {/* 3º - PAINEL ANALÍTICO */}
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-slate-505 hover:text-slate-850 hover:bg-slate-50/80"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Painel Analítico
          </button>

          {/* 4º - SETOR DE TI & CADASTROS */}
          {currentUser.role === "Administrador" && (
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-505 hover:text-slate-850 hover:bg-slate-50/80"
              }`}
            >
              <Users className="w-4 h-4" />
              Setor de TI & Cadastros
            </button>
          )}

          {/* 5º - EXPORTAR */}
          <button
            onClick={() => setActiveTab("export")}
            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "export"
                ? "bg-indigo-600 text-white shadow-sm font-bold"
                : "text-slate-505 hover:text-slate-850 hover:bg-slate-50/80"
            }`}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col">
          {activeTab === "spreadsheet" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-1 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Planilha Eletrônica de Salas</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Visão tabular semelhante ao Google Planilhas</p>
                </div>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                  Filtros Inteligentes Ativos
                </span>
              </div>
              <BookingTable
                bookings={bookings}
                currentUser={currentUser}
                onEdit={handleEditClick}
                onDelete={handleDeleteBooking}
                onAddClick={handleAddNewClick}
                onUpdateStatus={handleUpdateStatus}
                onDuplicate={handleDuplicateBooking}
              />
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col">
              <div className="pb-3 mb-2 border-b border-slate-100">
                <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Grade de Horários e Ocupação</h2>
                <p className="text-xs text-slate-400 mt-0.5">Selecione dias para cadastrar ou gerenciar as chaves de reservas</p>
              </div>
              <BookingCalendar
                bookings={bookings}
                currentUser={currentUser}
                onAddOnDate={handleAddOnDate}
                onEdit={handleEditClick}
              />
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <BookingStats bookings={bookings} />
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row gap-4 items-start">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Diretrizes de Compartilhamento de Salas</h4>
                  <p className="text-xs text-slate-505 mt-1 leading-relaxed">
                    Esse painel reflete o processamento de dados integrados de recursos e reservas. Caso haja necessidade de 
                    exclusão de registros em massa, utilize o modo checkbox disponível na visualização da tabela. 
                    Reservas canceladas são desconsideradas nas estatísticas de taxa de ocupação para fornecer informações de KPI fidedignas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && currentUser.role === "Administrador" && (
            <UserManagement
              users={users}
              sectors={sectors}
              equipments={equipments}
              rooms={rooms}
              bookings={bookings}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onRefreshSectors={fetchSectors}
              onRefreshEquipments={fetchEquipments}
              onRefreshRooms={fetchRooms}
            />
          )}

          {activeTab === "export" && (
            <ExportPanel
              bookings={bookings}
              rooms={rooms}
              currentUser={currentUser}
            />
          )}
        </div>

      </div>

      {/* Booking Form Edit popup dialog block */}
      {isFormOpen && (
        <BookingForm
          booking={editingBooking}
          allBookings={bookings}
          currentUser={currentUser}
          users={users}
          equipments={equipments}
          rooms={rooms}
          onSave={handleSaveBooking}
          onClose={() => {
            setIsFormOpen(false);
            setEditingBooking(null);
          }}
          addToast={addToast}
        />
      )}

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Welcome Tour Guided walkthrough modal */}
      <AnimatePresence>
        {isTourOpen && (
          <WelcomeTour 
            isOpen={isTourOpen} 
            onClose={() => setIsTourOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Master Footer (Clean Bento-styled footer) */}
      <footer className="w-full max-w-[1240px] mx-auto px-6 py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-t border-slate-200 mt-auto shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>SALA-SYNC SYSTEMS &bull; BASEADO NA PLANILHA OFICIAL</p>
        <p className="text-[9px] text-slate-400/70 font-semibold normal-case">
          &copy; {new Date().getFullYear()} - Soluções de Agilidade e Gestão Corporativa. Todos os direitos reservados.
        </p>
      </footer>

    </div>
  );
}
