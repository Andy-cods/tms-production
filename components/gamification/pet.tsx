"use client";

type PetType = any;
import { useState, useEffect } from "react";

interface PetProps {
  type: PetType;
  name: string;
  level: number;
  happiness: number;
  size?: number;
  className?: string;
}

export function Pet({
  type,
  name,
  level,
  happiness,
  size = 100,
  className = "",
}: PetProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Random animation every 3-5 seconds
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }, Math.random() * 2000 + 3000);

    return () => clearInterval(interval);
  }, []);

  // Happiness affects color intensity
  const happinessOpacity = 0.5 + (happiness / 100) * 0.5;

  function renderPet() {
    switch (type) {
      case "CAT":
        return (
          <g transform={isAnimating ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Body */}
            <ellipse
              cx="50"
              cy="60"
              rx="25"
              ry="20"
              fill="#FF8C42"
              opacity={happinessOpacity}
            />
            {/* Head */}
            <circle
              cx="50"
              cy="40"
              r="18"
              fill="#FF8C42"
              opacity={happinessOpacity}
            />
            {/* Ears */}
            <polygon points="35,30 40,20 45,30" fill="#FF8C42" opacity={happinessOpacity} />
            <polygon points="55,30 60,20 65,30" fill="#FF8C42" opacity={happinessOpacity} />
            {/* Eyes */}
            <ellipse cx="43" cy="38" rx="3" ry="5" fill="#2C2C2C" />
            <ellipse cx="57" cy="38" rx="3" ry="5" fill="#2C2C2C" />
            {/* Nose */}
            <circle cx="50" cy="44" r="2" fill="#FFB6C1" />
            {/* Whiskers */}
            <line x1="30" y1="42" x2="40" y2="42" stroke="#2C2C2C" strokeWidth="1" />
            <line x1="60" y1="42" x2="70" y2="42" stroke="#2C2C2C" strokeWidth="1" />
            {/* Tail */}
            <path
              d="M 70 55 Q 80 50 85 60"
              stroke="#FF8C42"
              strokeWidth="5"
              fill="none"
              opacity={happinessOpacity}
            />
            {/* Level badge */}
            <circle cx="70" cy="30" r="8" fill="#FFD700" />
            <text x="70" y="33" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      case "DOG":
        return (
          <g transform={isAnimating ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Body */}
            <ellipse
              cx="50"
              cy="60"
              rx="28"
              ry="22"
              fill="#8B4513"
              opacity={happinessOpacity}
            />
            {/* Head */}
            <ellipse
              cx="50"
              cy="38"
              rx="20"
              ry="18"
              fill="#8B4513"
              opacity={happinessOpacity}
            />
            {/* Ears (floppy) */}
            <ellipse cx="32" cy="35" rx="8" ry="15" fill="#6B3410" opacity={happinessOpacity} />
            <ellipse cx="68" cy="35" rx="8" ry="15" fill="#6B3410" opacity={happinessOpacity} />
            {/* Eyes */}
            <circle cx="43" cy="36" r="3" fill="#2C2C2C" />
            <circle cx="57" cy="36" r="3" fill="#2C2C2C" />
            <circle cx="44" cy="35" r="1.5" fill="#FFFFFF" />
            <circle cx="58" cy="35" r="1.5" fill="#FFFFFF" />
            {/* Nose */}
            <ellipse cx="50" cy="43" rx="4" ry="3" fill="#2C2C2C" />
            {/* Mouth */}
            <path d="M 50 43 L 45 46 M 50 43 L 55 46" stroke="#2C2C2C" strokeWidth="2" fill="none" />
            {/* Tongue (if happy) */}
            {happiness > 70 && (
              <ellipse cx="50" cy="50" rx="3" ry="5" fill="#FF69B4" />
            )}
            {/* Tail */}
            <path
              d="M 72 58 Q 85 55 90 65"
              stroke="#8B4513"
              strokeWidth="6"
              fill="none"
              opacity={happinessOpacity}
              strokeLinecap="round"
            />
            {/* Level badge */}
            <circle cx="70" cy="25" r="8" fill="#FFD700" />
            <text x="70" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      case "DRAGON":
        return (
          <g transform={isAnimating ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Body */}
            <ellipse
              cx="50"
              cy="60"
              rx="30"
              ry="25"
              fill="#8B008B"
              opacity={happinessOpacity}
            />
            {/* Head */}
            <circle
              cx="50"
              cy="35"
              r="20"
              fill="#8B008B"
              opacity={happinessOpacity}
            />
            {/* Horns */}
            <polygon points="40,20 35,10 38,25" fill="#FFD700" />
            <polygon points="60,20 65,10 62,25" fill="#FFD700" />
            {/* Eyes */}
            <circle cx="43" cy="33" r="4" fill="#FF0000" />
            <circle cx="57" cy="33" r="4" fill="#FF0000" />
            <circle cx="44" cy="32" r="2" fill="#FFFFFF" />
            <circle cx="58" cy="32" r="2" fill="#FFFFFF" />
            {/* Nostrils */}
            <ellipse cx="45" cy="42" rx="2" ry="3" fill="#2C2C2C" />
            <ellipse cx="55" cy="42" rx="2" ry="3" fill="#2C2C2C" />
            {/* Wings */}
            <ellipse
              cx="25"
              cy="50"
              rx="15"
              ry="25"
              fill="#9370DB"
              opacity={happinessOpacity * 0.8}
            />
            <ellipse
              cx="75"
              cy="50"
              rx="15"
              ry="25"
              fill="#9370DB"
              opacity={happinessOpacity * 0.8}
            />
            {/* Tail */}
            <path
              d="M 75 70 Q 85 75 95 85"
              stroke="#8B008B"
              strokeWidth="8"
              fill="none"
              opacity={happinessOpacity}
            />
            <polygon points="95,85 100,80 98,90" fill="#FF0000" />
            {/* Fire breath (if happy) */}
            {happiness > 80 && (
              <>
                <circle cx="55" cy="45" r="3" fill="#FF4500" opacity="0.7" />
                <circle cx="60" cy="43" r="2" fill="#FFA500" opacity="0.7" />
              </>
            )}
            {/* Level badge */}
            <circle cx="75" cy="25" r="8" fill="#FFD700" />
            <text x="75" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      case "UNICORN":
        return (
          <g transform={isAnimating ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Body */}
            <ellipse
              cx="50"
              cy="60"
              rx="30"
              ry="25"
              fill="#FFB6C1"
              opacity={happinessOpacity}
            />
            {/* Head */}
            <ellipse
              cx="50"
              cy="35"
              rx="18"
              ry="20"
              fill="#FFB6C1"
              opacity={happinessOpacity}
            />
            {/* Horn */}
            <polygon points="50,10 48,25 52,25" fill="#FFD700" />
            <circle cx="50" cy="10" r="2" fill="#FFFFFF" />
            {/* Mane */}
            <ellipse cx="40" cy="25" rx="8" ry="12" fill="#FF69B4" opacity="0.6" />
            <ellipse cx="50" cy="22" rx="8" ry="12" fill="#9370DB" opacity="0.6" />
            <ellipse cx="60" cy="25" rx="8" ry="12" fill="#87CEEB" opacity="0.6" />
            {/* Eyes */}
            <circle cx="43" cy="33" r="3" fill="#2C2C2C" />
            <circle cx="57" cy="33" r="3" fill="#2C2C2C" />
            <circle cx="44" cy="32" r="1.5" fill="#FFFFFF" />
            <circle cx="58" cy="32" r="1.5" fill="#FFFFFF" />
            {/* Nose */}
            <ellipse cx="50" cy="40" rx="3" ry="2" fill="#FFB6C1" />
            {/* Sparkles (if happy) */}
            {happiness > 70 && (
              <>
                <text x="70" y="30" fontSize="12" fill="#FFD700">✨</text>
                <text x="30" y="30" fontSize="12" fill="#FFD700">✨</text>
                <text x="50" y="15" fontSize="10" fill="#FFFFFF">⭐</text>
              </>
            )}
            {/* Tail */}
            <path
              d="M 75 65 Q 85 60 90 70"
              stroke="#FF69B4"
              strokeWidth="6"
              fill="none"
              opacity={happinessOpacity}
            />
            {/* Level badge */}
            <circle cx="70" cy="30" r="8" fill="#FFD700" />
            <text x="70" y="33" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      case "ROBOT":
        return (
          <g>
            {/* Body */}
            <rect
              x="30"
              y="50"
              width="40"
              height="35"
              fill="#4169E1"
              opacity={happinessOpacity}
              rx="5"
            />
            {/* Head */}
            <rect
              x="35"
              y="25"
              width="30"
              height="30"
              fill="#4169E1"
              opacity={happinessOpacity}
              rx="3"
            />
            {/* Antenna */}
            <line x1="50" y1="25" x2="50" y2="15" stroke="#FFD700" strokeWidth="2" />
            <circle cx="50" cy="15" r="3" fill="#FF0000" className={isAnimating ? "animate-pulse" : ""} />
            {/* Eyes (LCD display) */}
            <rect x="40" y="33" width="8" height="6" fill="#00FF00" opacity="0.8" />
            <rect x="52" y="33" width="8" height="6" fill="#00FF00" opacity="0.8" />
            {/* Mouth (LED) */}
            <rect x="42" y="45" width="16" height="3" fill="#00FF00" opacity="0.8" />
            {/* Arms */}
            <rect x="20" y="55" width="8" height="20" fill="#4169E1" opacity={happinessOpacity} rx="2" />
            <rect x="72" y="55" width="8" height="20" fill="#4169E1" opacity={happinessOpacity} rx="2" />
            {/* Legs */}
            <rect x="35" y="85" width="10" height="10" fill="#2C2C2C" rx="2" />
            <rect x="55" y="85" width="10" height="10" fill="#2C2C2C" rx="2" />
            {/* Level badge */}
            <rect x="62" y="20" width="16" height="16" fill="#FFD700" rx="2" />
            <text x="70" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      case "PHOENIX":
        return (
          <g transform={isAnimating ? "translate(0, -5)" : "translate(0, 0)"}>
            {/* Body */}
            <ellipse
              cx="50"
              cy="55"
              rx="25"
              ry="20"
              fill="#FF4500"
              opacity={happinessOpacity}
            />
            {/* Head */}
            <circle
              cx="50"
              cy="35"
              r="15"
              fill="#FF6347"
              opacity={happinessOpacity}
            />
            {/* Crest */}
            <path
              d="M 40 30 Q 35 20 40 25 Q 38 15 42 22 Q 40 10 45 20"
              fill="#FFD700"
            />
            <path
              d="M 60 30 Q 65 20 60 25 Q 62 15 58 22 Q 60 10 55 20"
              fill="#FFD700"
            />
            {/* Eyes */}
            <circle cx="45" cy="33" r="3" fill="#FFFFFF" />
            <circle cx="55" cy="33" r="3" fill="#FFFFFF" />
            <circle cx="46" cy="32" r="1.5" fill="#2C2C2C" />
            <circle cx="56" cy="32" r="1.5" fill="#2C2C2C" />
            {/* Beak */}
            <polygon points="50,38 47,42 53,42" fill="#FFA500" />
            {/* Wings */}
            <ellipse
              cx="25"
              cy="50"
              rx="20"
              ry="15"
              fill="#FF8C00"
              opacity={happinessOpacity * 0.8}
              transform="rotate(-30 25 50)"
            />
            <ellipse
              cx="75"
              cy="50"
              rx="20"
              ry="15"
              fill="#FF8C00"
              opacity={happinessOpacity * 0.8}
              transform="rotate(30 75 50)"
            />
            {/* Tail feathers */}
            <ellipse
              cx="50"
              cy="75"
              rx="12"
              ry="25"
              fill="#FF4500"
              opacity={happinessOpacity}
            />
            <ellipse
              cx="40"
              cy="78"
              rx="10"
              ry="22"
              fill="#FFD700"
              opacity={happinessOpacity * 0.7}
            />
            <ellipse
              cx="60"
              cy="78"
              rx="10"
              ry="22"
              fill="#FFD700"
              opacity={happinessOpacity * 0.7}
            />
            {/* Flames (if happy) */}
            {happiness > 70 && (
              <>
                <circle cx="30" cy="40" r="4" fill="#FF4500" opacity="0.6" />
                <circle cx="70" cy="40" r="4" fill="#FF4500" opacity="0.6" />
                <circle cx="50" cy="80" r="5" fill="#FFA500" opacity="0.6" />
              </>
            )}
            {/* Level badge */}
            <circle cx="70" cy="25" r="8" fill="#FFD700" />
            <text x="70" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2C2C2C">
              {level}
            </text>
          </g>
        );

      default:
        return null;
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300"
      >
        {renderPet()}
      </svg>
      <p className="text-sm font-semibold text-gray-700 mt-2">{name}</p>
      {/* Happiness bar */}
      <div className="w-full max-w-[80px] mt-1">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
            style={{ width: `${happiness}%` }}
          />
        </div>
      </div>
    </div>
  );
}

