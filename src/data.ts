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

export const SALAS_PREDEFINIDAS: RoomConfig[] = [];

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
