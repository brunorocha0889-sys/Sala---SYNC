export interface Booking {
  id: string;
  data: string; // YYYY-MM-DD
  horaInicial: string; // HH:MM
  horaFinal: string; // HH:MM
  sala: string;
  tempoDeUso: string; // e.g., "1:30hs", "2h", "4hs"
  pessoas: string; // Equipes ou número de pessoas
  responsavel: string;
  equipamentos: string; // "DATA SHOW/PROJETOR" | "TV/COMPUTADOR" | "Sem material"
  motivo: string;
  situacao: "Finalizado" | "Confirmado" | "Cancelado";
  // Permissions and notification fields
  usuarioId?: string; // ID of user who created this booking
  lembreteAntecedencia?: "none" | "15min" | "30min" | "1h" | "2h" | "24h";
  lembreteMeio?: "none" | "email" | "push" | "ambos";
}

export type UserRole = "Administrador" | "Usuário Padrão";

export interface SystemUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  setor: string;
  avatarUrl?: string;
  senha?: string;
}

export interface BookingFilters {
  search: string;
  sala: string;
  situacao: string;
  dataInicio: string;
  dataFim: string;
}

export interface RoomConfig {
  id: string;
  nome: string;
  corBg: string;
  corTexto: string;
  capacidade: number;
}

export interface EquipmentConfig {
  nome: string;
  corBg: string;
  corTexto: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

