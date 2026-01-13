"use client";

import { useEffect, useState } from "react";

interface Element {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  emoji: string;
  type: "floating" | "ground" | "character";
}

export function ChristmasElements() {
  const [elements, setElements] = useState<Element[]>([]);
  const [snowdrifts, setSnowdrifts] = useState<Array<{ id: number; left: number; width: number; height: number }>>([]);

  useEffect(() => {
    const items: Element[] = [];
    
    // Floating elements (snowflakes, stars, bells)
    const floatingEmojis = ["❄️", "⭐", "🔔", "✨"];
    for (let i = 0; i < 25; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 80, // Keep in upper area
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 3,
        size: 15 + Math.random() * 20,
        emoji: floatingEmojis[Math.floor(Math.random() * floatingEmojis.length)],
        type: "floating",
      });
    }

    // Ground elements (trees, presents)
    const groundEmojis = ["🎄", "🎁", "🎄", "🎁"];
    for (let i = 25; i < 35; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        top: 70 + Math.random() * 25, // Bottom area
        delay: Math.random() * 2,
        duration: 6 + Math.random() * 2,
        size: 40 + Math.random() * 50,
        emoji: groundEmojis[Math.floor(Math.random() * groundEmojis.length)],
        type: "ground",
      });
    }

    // Characters (Santa, Snowman, Reindeer)
    const characters = [
      { emoji: "🎅", size: 60, top: 65 },
      { emoji: "⛄", size: 55, top: 70 },
      { emoji: "🦌", size: 50, top: 68 },
    ];
    characters.forEach((char, index) => {
      items.push({
        id: 35 + index,
        left: 10 + index * 30 + Math.random() * 10,
        top: char.top,
        delay: index * 0.5,
        duration: 8,
        size: char.size,
        emoji: char.emoji,
        type: "character",
      });
    });

    setElements(items);

    // Snowdrifts at bottom
    const drifts: Array<{ id: number; left: number; width: number; height: number }> = [];
    for (let i = 0; i < 5; i++) {
      drifts.push({
        id: i,
        left: i * 20 + Math.random() * 10,
        width: 15 + Math.random() * 20,
        height: 8 + Math.random() * 12,
      });
    }
    setSnowdrifts(drifts);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Snowdrifts at bottom */}
      <div className="absolute bottom-0 left-0 right-0" style={{ height: "25%" }}>
        {snowdrifts.map((drift) => (
          <div
            key={drift.id}
            className="absolute bottom-0 rounded-t-full bg-white/30 backdrop-blur-sm"
            style={{
              left: `${drift.left}%`,
              width: `${drift.width}%`,
              height: `${drift.height}%`,
              filter: "blur(2px)",
            }}
          />
        ))}
      </div>

      {/* Floating elements */}
      {elements.filter(e => e.type === "floating").map((element) => (
        <div
          key={element.id}
          className="absolute animate-float-slow opacity-70 hover:opacity-100 transition-opacity"
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
            fontSize: `${element.size}px`,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))",
          }}
        >
          {element.emoji}
        </div>
      ))}

      {/* Ground elements (trees, presents) */}
      {elements.filter(e => e.type === "ground").map((element) => (
        <div
          key={element.id}
          className="absolute animate-float-slow opacity-80"
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
            fontSize: `${element.size}px`,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.4))",
            transform: "translateY(0)",
          }}
        >
          {element.emoji}
        </div>
      ))}

      {/* Characters with special animations */}
      {elements.filter(e => e.type === "character").map((element, index) => {
        let animationClass = "animate-float-slow";
        if (element.emoji === "🎅") {
          animationClass = "animate-santa-walk";
        } else if (element.emoji === "⛄") {
          animationClass = "animate-snowman-bounce";
        } else if (element.emoji === "🦌") {
          animationClass = "animate-reindeer-trot";
        }
        
        return (
          <div
            key={element.id}
            className={`absolute ${animationClass} opacity-90`}
            style={{
              left: `${element.left}%`,
              top: `${element.top}%`,
              animationDelay: `${element.delay}s`,
              fontSize: `${element.size}px`,
              filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
              transform: index === 2 ? "scaleX(-1)" : "none", // Flip reindeer
            }}
          >
            {element.emoji}
          </div>
        );
      })}

      {/* Additional decorative trees in background */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={`tree-${i}`}
          className="absolute opacity-40 animate-float-slow"
          style={{
            left: `${15 + i * 25}%`,
            top: `${60 + Math.random() * 10}%`,
            fontSize: `${30 + Math.random() * 20}px`,
            animationDelay: `${i * 0.3}s`,
            animationDuration: "10s",
            filter: "blur(1px)",
          }}
        >
          🎄
        </div>
      ))}
    </div>
  );
}

