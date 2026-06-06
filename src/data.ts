import { Booking, RoomConfig, EquipmentConfig, SystemUser } from "./types";

export const USUARIOS_PREDEFINIDOS: SystemUser[] = [
  {
    id: "user-admin",
    nome: "admin",
    email: "admin@sala-sync.com",
    role: "Administrador",
    setor: "TI",
    avatarUrl: "AD",
    senha: "123456",
  },
];

export const SALAS_PREDEFINIDAS: RoomConfig[] = [
  {
    id: "sala-escola",
    nome: "Sala (Escola de Saúde)",
    corBg: "bg-amber-50 text-amber-800 border-amber-200",
    corTexto: "#78350f",
    capacidade: 30,
  },
  {
    id: "sala-reunioes-2",
    nome: "Sala de reuniões 2",
    corBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    corTexto: "#065f46",
    capacidade: 12,
  },
  {
    id: "sala-conselho",
    nome: "Sala do Conselho",
    corBg: "bg-blue-50 text-blue-800 border-blue-200",
    corTexto: "#075985",
    capacidade: 20,
  },
  {
    id: "auditorio",
    nome: "Auditório Principal",
    corBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    corTexto: "#5B5CEB",
    capacidade: 80,
  },
];

export const EQUIPAMENTOS_PREDEFINIDOS: EquipmentConfig[] = [
  {
    nome: "DATA SHOW/PROJETOR",
    corBg: "bg-[#78350F] text-white border-amber-800", // Brown color like the image
    corTexto: "#ffffff",
  },
  {
    nome: "TV/COMPUTADOR",
    corBg: "bg-slate-800 text-white border-slate-950", // Drak/slate like the image
    corTexto: "#ffffff",
  },
  {
    nome: "Sem material",
    corBg: "bg-slate-100 text-slate-600 border-slate-200",
    corTexto: "#475569",
  },
];

export const INITIAL_BOOKINGS: Booking[] = [];
