export interface RoomColorInfo {
  badge: string;
  bg: string;
  dot: string;
  text: string;
}

export const ROOM_COLORS_MAP: Record<string, RoomColorInfo> = {
  emerald: {
    badge: "bg-emerald-100 border-l-[3px] border-emerald-600 text-emerald-950",
    bg: "bg-emerald-50/40",
    dot: "#10b981",
    text: "text-emerald-800 bg-emerald-100"
  },
  sky: {
    badge: "bg-sky-100 border-l-[3px] border-sky-500 text-sky-950",
    bg: "bg-sky-50/40",
    dot: "#0ea5e9",
    text: "text-sky-800 bg-sky-100"
  },
  amber: {
    badge: "bg-amber-100 border-l-[3px] border-amber-500 text-amber-900",
    bg: "bg-amber-50/40",
    dot: "#f59e0b",
    text: "text-amber-800 bg-amber-100"
  },
  purple: {
    badge: "bg-purple-100 border-l-[3px] border-purple-500 text-purple-950",
    bg: "bg-purple-50/40",
    dot: "#8b5cf6",
    text: "text-purple-800 bg-purple-100"
  },
  rose: {
    badge: "bg-rose-100 border-l-[3px] border-rose-500 text-rose-950",
    bg: "bg-rose-50/40",
    dot: "#f43f5e",
    text: "text-rose-800 bg-rose-100"
  },
  indigo: {
    badge: "bg-indigo-100 border-l-[3px] border-indigo-500 text-indigo-950",
    bg: "bg-indigo-50/40",
    dot: "#6366f1",
    text: "text-indigo-800 bg-indigo-100"
  },
  violet: {
    badge: "bg-violet-100 border-l-[3px] border-violet-500 text-violet-950",
    bg: "bg-violet-50/40",
    dot: "#7c3aed",
    text: "text-violet-800 bg-violet-100"
  },
  teal: {
    badge: "bg-teal-100 border-l-[3px] border-teal-500 text-teal-950",
    bg: "bg-teal-50/40",
    dot: "#14b8a6",
    text: "text-teal-800 bg-teal-100"
  }
};

export const getRoomColorInfo = (corBg: string | undefined | null, name: string): RoomColorInfo => {
  if (!corBg) {
    // Fallback based on name for legacy compatibility
    const lowerName = (name || "").toLowerCase();
    if (lowerName.includes("school") || lowerName.includes("saúde") || lowerName.includes("saude")) return ROOM_COLORS_MAP.amber;
    if (lowerName.includes("reuniões") || lowerName.includes("reuniao") || lowerName.includes("reunião")) return ROOM_COLORS_MAP.emerald;
    if (lowerName.includes("conselho") || lowerName.includes("sky") || lowerName.includes("celeste")) return ROOM_COLORS_MAP.sky;
    return ROOM_COLORS_MAP.purple;
  }
  
  if (ROOM_COLORS_MAP[corBg]) {
    return ROOM_COLORS_MAP[corBg];
  }
  
  // Try to parse from custom string
  const str = corBg.toLowerCase();
  if (str.includes("emerald") || str.includes("verde") || str.includes("green")) return ROOM_COLORS_MAP.emerald;
  if (str.includes("sky") || str.includes("celeste") || str.includes("azul")) return ROOM_COLORS_MAP.sky;
  if (str.includes("amber") || str.includes("laranja") || str.includes("amarelo") || str.includes("yellow") || str.includes("orange")) return ROOM_COLORS_MAP.amber;
  if (str.includes("purple") || str.includes("roxo")) return ROOM_COLORS_MAP.purple;
  if (str.includes("rose") || str.includes("rosa") || str.includes("vermelho") || str.includes("red")) return ROOM_COLORS_MAP.rose;
  if (str.includes("indigo")) return ROOM_COLORS_MAP.indigo;
  if (str.includes("violet") || str.includes("violeta")) return ROOM_COLORS_MAP.violet;
  if (str.includes("teal") || str.includes("ciano")) return ROOM_COLORS_MAP.teal;
  
  return ROOM_COLORS_MAP.indigo;
};
