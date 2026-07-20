export interface RoomColorInfo {
  badge: string;
  bg: string;
  dot: string;
  text: string;
  badgeStyle?: Record<string, string>;
  textStyle?: Record<string, string>;
  style?: Record<string, string>;
}

export const ROOM_COLORS_MAP: Record<string, RoomColorInfo> = {
  red: {
    badge: "bg-red-50 border-l-[3px] border-red-500 text-red-950",
    bg: "bg-red-50/40",
    dot: "#ef4444",
    text: "text-red-800 bg-red-100",
    badgeStyle: { backgroundColor: "#ef444415", borderLeftColor: "#ef4444", color: "#b91c1c" },
    textStyle: { color: "#b91c1c", backgroundColor: "#ef444415" },
    style: { backgroundColor: "#ef44440d", borderLeftColor: "#ef4444" }
  },
  orange: {
    badge: "bg-orange-50 border-l-[3px] border-orange-500 text-orange-950",
    bg: "bg-orange-50/40",
    dot: "#f97316",
    text: "text-orange-800 bg-orange-100",
    badgeStyle: { backgroundColor: "#f9731615", borderLeftColor: "#f97316", color: "#c2410c" },
    textStyle: { color: "#c2410c", backgroundColor: "#f9731615" },
    style: { backgroundColor: "#f973160d", borderLeftColor: "#f97316" }
  },
  amber: {
    badge: "bg-amber-50 border-l-[3px] border-amber-500 text-amber-900",
    bg: "bg-amber-50/40",
    dot: "#f59e0b",
    text: "text-amber-850 bg-amber-100",
    badgeStyle: { backgroundColor: "#f59e0b15", borderLeftColor: "#f59e0b", color: "#b45309" },
    textStyle: { color: "#b45309", backgroundColor: "#f59e0b15" },
    style: { backgroundColor: "#f59e0b0d", borderLeftColor: "#f59e0b" }
  },
  emerald: {
    badge: "bg-emerald-50 border-l-[3px] border-emerald-600 text-emerald-950",
    bg: "bg-emerald-50/40",
    dot: "#10b981",
    text: "text-emerald-800 bg-emerald-100",
    badgeStyle: { backgroundColor: "#10b98115", borderLeftColor: "#10b981", color: "#047857" },
    textStyle: { color: "#047857", backgroundColor: "#10b98115" },
    style: { backgroundColor: "#10b9810d", borderLeftColor: "#10b981" }
  },
  teal: {
    badge: "bg-teal-50 border-l-[3px] border-teal-500 text-teal-950",
    bg: "bg-teal-50/40",
    dot: "#14b8a6",
    text: "text-teal-800 bg-teal-100",
    badgeStyle: { backgroundColor: "#14b8a615", borderLeftColor: "#14b8a6", color: "#0f766e" },
    textStyle: { color: "#0f766e", backgroundColor: "#14b8a615" },
    style: { backgroundColor: "#14b8a60d", borderLeftColor: "#14b8a6" }
  },
  sky: {
    badge: "bg-sky-50 border-l-[3px] border-sky-500 text-sky-950",
    bg: "bg-sky-50/40",
    dot: "#0ea5e9",
    text: "text-sky-800 bg-sky-100",
    badgeStyle: { backgroundColor: "#0ea5e915", borderLeftColor: "#0ea5e9", color: "#0369a1" },
    textStyle: { color: "#0369a1", backgroundColor: "#0ea5e915" },
    style: { backgroundColor: "#0ea5e90d", borderLeftColor: "#0ea5e9" }
  },
  blue: {
    badge: "bg-blue-50 border-l-[3px] border-blue-500 text-blue-950",
    bg: "bg-blue-50/40",
    dot: "#3b82f6",
    text: "text-blue-800 bg-blue-100",
    badgeStyle: { backgroundColor: "#3b82f615", borderLeftColor: "#3b82f6", color: "#1d4ed8" },
    textStyle: { color: "#1d4ed8", backgroundColor: "#3b82f615" },
    style: { backgroundColor: "#3b82f60d", borderLeftColor: "#3b82f6" }
  },
  indigo: {
    badge: "bg-indigo-50 border-l-[3px] border-indigo-500 text-indigo-950",
    bg: "bg-indigo-50/40",
    dot: "#6366f1",
    text: "text-indigo-800 bg-indigo-100",
    badgeStyle: { backgroundColor: "#6366f115", borderLeftColor: "#6366f1", color: "#4338ca" },
    textStyle: { color: "#4338ca", backgroundColor: "#6366f115" },
    style: { backgroundColor: "#6366f10d", borderLeftColor: "#6366f1" }
  },
  purple: {
    badge: "bg-purple-50 border-l-[3px] border-purple-500 text-purple-950",
    bg: "bg-purple-50/40",
    dot: "#8b5cf6",
    text: "text-purple-800 bg-purple-100",
    badgeStyle: { backgroundColor: "#8b5cf615", borderLeftColor: "#8b5cf6", color: "#6d28d9" },
    textStyle: { color: "#6d28d9", backgroundColor: "#8b5cf615" },
    style: { backgroundColor: "#8b5cf60d", borderLeftColor: "#8b5cf6" }
  },
  violet: {
    badge: "bg-violet-50 border-l-[3px] border-violet-500 text-violet-950",
    bg: "bg-violet-50/40",
    dot: "#7c3aed",
    text: "text-violet-800 bg-violet-100",
    badgeStyle: { backgroundColor: "#7c3aed15", borderLeftColor: "#7c3aed", color: "#5b21b6" },
    textStyle: { color: "#5b21b6", backgroundColor: "#7c3aed15" },
    style: { backgroundColor: "#7c3aed0d", borderLeftColor: "#7c3aed" }
  },
  fuchsia: {
    badge: "bg-fuchsia-50 border-l-[3px] border-fuchsia-500 text-fuchsia-950",
    bg: "bg-fuchsia-50/40",
    dot: "#d946ef",
    text: "text-fuchsia-800 bg-fuchsia-100",
    badgeStyle: { backgroundColor: "#d946ef15", borderLeftColor: "#d946ef", color: "#a21caf" },
    textStyle: { color: "#a21caf", backgroundColor: "#d946ef15" },
    style: { backgroundColor: "#d946ef0d", borderLeftColor: "#d946ef" }
  },
  rose: {
    badge: "bg-rose-50 border-l-[3px] border-rose-500 text-rose-950",
    bg: "bg-rose-50/40",
    dot: "#f43f5e",
    text: "text-rose-800 bg-rose-100",
    badgeStyle: { backgroundColor: "#f43f5e15", borderLeftColor: "#f43f5e", color: "#be123c" },
    textStyle: { color: "#be123c", backgroundColor: "#f43f5e15" },
    style: { backgroundColor: "#f43f5e0d", borderLeftColor: "#f43f5e" }
  },
  slate: {
    badge: "bg-slate-50 border-l-[3px] border-slate-500 text-slate-950",
    bg: "bg-slate-50/40",
    dot: "#64748b",
    text: "text-slate-800 bg-slate-100",
    badgeStyle: { backgroundColor: "#64748b15", borderLeftColor: "#64748b", color: "#334155" },
    textStyle: { color: "#334155", backgroundColor: "#64748b15" },
    style: { backgroundColor: "#64748b0d", borderLeftColor: "#64748b" }
  }
};

export const getRoomColorInfo = (corBg: string | undefined | null, name: string): RoomColorInfo => {
  if (!corBg) {
    // Fallback based on name for legacy compatibility
    const lowerName = (name || "").toLowerCase();
    if (lowerName.includes("school") || lowerName.includes("saúde") || lowerName.includes("saude")) return ROOM_COLORS_MAP.amber;
    if (lowerName.includes("reuniões") || lowerName.includes("reuniao") || lowerName.includes("reunião")) return ROOM_COLORS_MAP.emerald;
    if (lowerName.includes("conselho") || lowerName.includes("sky") || lowerName.includes("celeste")) return ROOM_COLORS_MAP.sky;
    return ROOM_COLORS_MAP.indigo;
  }
  
  // If it's a predefined color key (e.g. "emerald", "red")
  if (ROOM_COLORS_MAP[corBg]) {
    return ROOM_COLORS_MAP[corBg];
  }
  
  // If it's a HEX color code (starts with '#')
  if (corBg.startsWith("#")) {
    const hex = corBg;
    return {
      badge: "border-l-[3px]",
      bg: "bg-slate-50/40",
      dot: hex,
      text: "font-semibold",
      badgeStyle: {
        backgroundColor: `${hex}15`,
        borderLeftColor: hex,
        color: hex
      },
      textStyle: {
        color: hex,
        backgroundColor: `${hex}15`
      },
      style: {
        backgroundColor: `${hex}0d`,
        borderLeftColor: hex
      }
    };
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
  
  // Try to use it directly if it looks like a hex color code but missing #
  if (/^[0-9A-F]{6}$/i.test(corBg)) {
    const hex = `#${corBg}`;
    return {
      badge: "border-l-[3px]",
      bg: "bg-slate-50/40",
      dot: hex,
      text: "font-semibold",
      badgeStyle: {
        backgroundColor: `${hex}15`,
        borderLeftColor: hex,
        color: hex
      },
      textStyle: {
        color: hex,
        backgroundColor: `${hex}15`
      },
      style: {
        backgroundColor: `${hex}0d`,
        borderLeftColor: hex
      }
    };
  }

  return ROOM_COLORS_MAP.indigo;
};
