"use client";

interface AvatarProps {
  skin?: string;
  hair?: string;
  hairColor?: string;
  eyes?: string;
  mouth?: string;
  accessory?: string;
  background?: string;
  size?: number;
  className?: string;
}

export function Avatar({
  skin = "default",
  hair = "short",
  hairColor = "black",
  eyes = "normal",
  mouth = "smile",
  accessory,
  background = "blue",
  size = 100,
  className = "",
}: AvatarProps) {
  // Color mappings
  const skinColors: Record<string, string> = {
    default: "#FFDAB9",
    light: "#FFF5E1",
    medium: "#D2B48C",
    dark: "#8B6F47",
    tan: "#E3C7A7",
  };

  const hairColors: Record<string, string> = {
    black: "#2C2C2C",
    brown: "#5C4033",
    blonde: "#F4E4C1",
    red: "#A52A2A",
    gray: "#808080",
    blue: "#4169E1",
    pink: "#FF69B4",
    green: "#90EE90",
  };

  const backgrounds: Record<string, string> = {
    blue: "#60A5FA",
    green: "#34D399",
    purple: "#A78BFA",
    pink: "#F472B6",
    orange: "#FB923C",
    red: "#EF4444",
    gradient: "url(#grad1)",
  };

  const skinColor = skinColors[skin] || skinColors.default;
  const hairColorValue = hairColors[hairColor] || hairColors.black;
  const bgColor = backgrounds[background] || backgrounds.blue;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradient backgrounds */}
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#60A5FA", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "#A78BFA", stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={bgColor} />

      {/* Face (skin) */}
      <circle cx="50" cy="55" r="30" fill={skinColor} />

      {/* Hair */}
      {hair === "short" && (
        <>
          <ellipse cx="50" cy="35" rx="32" ry="20" fill={hairColorValue} />
        </>
      )}
      {hair === "long" && (
        <>
          <ellipse cx="50" cy="35" rx="32" ry="20" fill={hairColorValue} />
          <rect x="20" y="45" width="60" height="30" fill={hairColorValue} rx="15" />
        </>
      )}
      {hair === "curly" && (
        <>
          <circle cx="30" cy="30" r="12" fill={hairColorValue} />
          <circle cx="50" cy="25" r="12" fill={hairColorValue} />
          <circle cx="70" cy="30" r="12" fill={hairColorValue} />
        </>
      )}
      {hair === "bald" && (
        <ellipse cx="50" cy="35" rx="32" ry="15" fill={hairColorValue} />
      )}
      {hair === "mohawk" && (
        <rect x="45" y="15" width="10" height="25" fill={hairColorValue} rx="5" />
      )}

      {/* Eyes */}
      {eyes === "normal" && (
        <>
          <ellipse cx="40" cy="50" rx="4" ry="5" fill="#2C2C2C" />
          <ellipse cx="60" cy="50" rx="4" ry="5" fill="#2C2C2C" />
          <circle cx="41" cy="49" r="1.5" fill="#FFFFFF" />
          <circle cx="61" cy="49" r="1.5" fill="#FFFFFF" />
        </>
      )}
      {eyes === "happy" && (
        <>
          <path
            d="M 36 50 Q 40 46 44 50"
            stroke="#2C2C2C"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M 56 50 Q 60 46 64 50"
            stroke="#2C2C2C"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
      {eyes === "cool" && (
        <>
          <rect x="35" y="48" width="10" height="4" fill="#2C2C2C" rx="2" />
          <rect x="55" y="48" width="10" height="4" fill="#2C2C2C" rx="2" />
        </>
      )}
      {eyes === "surprised" && (
        <>
          <circle cx="40" cy="50" r="5" fill="#2C2C2C" />
          <circle cx="60" cy="50" r="5" fill="#2C2C2C" />
          <circle cx="40" cy="49" r="2" fill="#FFFFFF" />
          <circle cx="60" cy="49" r="2" fill="#FFFFFF" />
        </>
      )}

      {/* Mouth */}
      {mouth === "smile" && (
        <path
          d="M 40 65 Q 50 70 60 65"
          stroke="#2C2C2C"
          strokeWidth="2"
          fill="none"
        />
      )}
      {mouth === "happy" && (
        <>
          <path
            d="M 40 65 Q 50 72 60 65"
            stroke="#2C2C2C"
            strokeWidth="2"
            fill="none"
          />
          <ellipse cx="50" cy="68" rx="8" ry="4" fill="#FF6B9D" opacity="0.6" />
        </>
      )}
      {mouth === "neutral" && (
        <line x1="40" y1="65" x2="60" y2="65" stroke="#2C2C2C" strokeWidth="2" />
      )}
      {mouth === "sad" && (
        <path
          d="M 40 68 Q 50 63 60 68"
          stroke="#2C2C2C"
          strokeWidth="2"
          fill="none"
        />
      )}
      {mouth === "surprised" && (
        <ellipse cx="50" cy="66" rx="5" ry="7" fill="#2C2C2C" />
      )}

      {/* Accessories */}
      {accessory === "glasses" && (
        <>
          <circle
            cx="40"
            cy="50"
            r="7"
            fill="none"
            stroke="#2C2C2C"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="50"
            r="7"
            fill="none"
            stroke="#2C2C2C"
            strokeWidth="2"
          />
          <line x1="47" y1="50" x2="53" y2="50" stroke="#2C2C2C" strokeWidth="2" />
        </>
      )}
      {accessory === "hat" && (
        <>
          <ellipse cx="50" cy="25" rx="25" ry="5" fill="#D2691E" />
          <rect x="35" y="20" width="30" height="8" fill="#D2691E" rx="2" />
        </>
      )}
      {accessory === "crown" && (
        <>
          <polygon points="30,25 35,20 40,25 45,15 50,25 55,15 60,25 65,20 70,25 50,30" fill="#FFD700" />
        </>
      )}
      {accessory === "mask" && (
        <rect x="30" y="48" width="40" height="15" fill="#4169E1" opacity="0.8" rx="3" />
      )}
    </svg>
  );
}

