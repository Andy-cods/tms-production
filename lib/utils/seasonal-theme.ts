/**
 * Seasonal Theme System
 * Tự động phát hiện mùa và áp dụng theme tương ứng
 */

export type Season = "spring" | "summer" | "autumn" | "winter" | "christmas" | "newyear" | "tet";

export interface SeasonalTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  effects?: string[];
  decorations?: string[];
}

export function getCurrentSeason(): Season {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Giáng sinh: 1-25 tháng 12
  if (month === 12 && day >= 1 && day <= 25) {
    return "christmas";
  }

  // Tết Nguyên Đán: Tháng 1-2 (khoảng thời gian Tết, có thể điều chỉnh)
  // Thường Tết rơi vào cuối tháng 1 hoặc đầu tháng 2
  if ((month === 1 && day >= 20) || (month === 2 && day <= 15)) {
    return "tet";
  }

  // Năm mới: 26-31 tháng 12 và 1-19 tháng 1 (trước Tết)
  if ((month === 12 && day >= 26) || (month === 1 && day < 20)) {
    return "newyear";
  }

  // Xuân: 16/2-4 (sau Tết đến hết tháng 4)
  if ((month === 2 && day >= 16) || (month >= 3 && month <= 4)) {
    return "spring";
  }

  // Hè: 5-7 (tháng 5, 6, 7)
  if (month >= 5 && month <= 7) {
    return "summer";
  }

  // Thu: 8-10 (tháng 8, 9, 10)
  if (month >= 8 && month <= 10) {
    return "autumn";
  }

  // Đông: 11-1 (tháng 11, 12, 1)
  return "winter";
}

export function getSeasonalTheme(season?: Season): SeasonalTheme {
  const currentSeason = season || getCurrentSeason();

  const themes: Record<Season, SeasonalTheme> = {
    spring: {
      name: "Mùa Xuân",
      colors: {
        primary: "#10b981", // Green
        secondary: "#34d399",
        accent: "#fbbf24", // Yellow
        background: "from-emerald-600 via-green-500 to-emerald-400",
        text: "text-white",
      },
      effects: ["cherry-blossoms", "butterflies"],
      decorations: ["🌸", "🌺", "🌷"],
    },
    summer: {
      name: "Mùa Hè",
      colors: {
        primary: "#3b82f6", // Blue
        secondary: "#60a5fa",
        accent: "#fbbf24", // Yellow
        background: "from-blue-600 via-cyan-500 to-blue-400",
        text: "text-white",
      },
      effects: ["sunshine", "waves"],
      decorations: ["☀️", "🌊", "🏖️"],
    },
    autumn: {
      name: "Mùa Thu",
      colors: {
        primary: "#f59e0b", // Orange
        secondary: "#fb923c",
        accent: "#dc2626", // Red
        background: "from-orange-600 via-amber-500 to-orange-400",
        text: "text-white",
      },
      effects: ["falling-leaves", "wind"],
      decorations: ["🍂", "🍁", "🌾"],
    },
    winter: {
      name: "Mùa Đông",
      colors: {
        primary: "#6366f1", // Indigo
        secondary: "#818cf8",
        accent: "#e0e7ff", // Light blue
        background: "from-indigo-600 via-blue-500 to-indigo-400",
        text: "text-white",
      },
      effects: ["snowflakes", "frost"],
      decorations: ["❄️", "⛄", "🌨️"],
    },
    christmas: {
      name: "Giáng Sinh",
      colors: {
        primary: "#dc2626", // Red
        secondary: "#ef4444",
        accent: "#10b981", // Green
        background: "from-red-600 via-red-500 to-green-600",
        text: "text-white",
      },
      effects: ["snowflakes", "sparkles", "lights"],
      decorations: ["🎄", "🎅", "🎁", "❄️", "⭐"],
    },
    newyear: {
      name: "Năm Mới",
      colors: {
        primary: "#fbbf24", // Gold
        secondary: "#fcd34d",
        accent: "#dc2626", // Red
        background: "from-yellow-600 via-amber-500 to-red-600",
        text: "text-white",
      },
      effects: ["confetti", "sparkles", "fireworks"],
      decorations: ["🎆", "🎊", "🎉", "✨"],
    },
    tet: {
      name: "Tết Nguyên Đán",
      colors: {
        primary: "#dc2626", // Red
        secondary: "#ef4444",
        accent: "#fbbf24", // Gold
        background: "from-red-600 via-red-500 to-yellow-500",
        text: "text-white",
      },
      effects: ["fireworks", "sparkles", "lanterns"],
      decorations: ["🧧", "🏮", "🐉", "🌸", "🥟", "🎆", "✨"],
    },
  };

  return themes[currentSeason];
}

export function isSpecialSeason(): boolean {
  const season = getCurrentSeason();
  return season === "christmas" || season === "newyear" || season === "tet";
}

