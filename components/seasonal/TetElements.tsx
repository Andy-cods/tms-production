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
}

interface Firework {
  id: number;
  left: number;
  top: number;
  delay: number;
}

export function TetElements() {
  const [elements, setElements] = useState<Element[]>([]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    // Tết elements: đào, mai, bánh chưng, lì xì, rồng, pháo, đèn lồng
    const items: Element[] = [];
    const emojis = ["🧧", "🏮", "🐉", "🌸", "🥟", "🎆", "✨", "🦁", "🐲", "🎊"];
    
    for (let i = 0; i < 20; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 5 + Math.random() * 4,
        size: 25 + Math.random() * 35,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
    setElements(items);

    // Fireworks for Tết
    const fireworkItems: Firework[] = [];
    for (let i = 0; i < 8; i++) {
      fireworkItems.push({
        id: i,
        left: 15 + Math.random() * 70,
        top: 10 + Math.random() * 50,
        delay: Math.random() * 4,
      });
    }
    setFireworks(fireworkItems);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Tết decorative elements */}
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute animate-float-slow opacity-60 hover:opacity-100 transition-opacity"
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

      {/* Fireworks */}
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute animate-firework"
          style={{
            left: `${firework.left}%`,
            top: `${firework.top}%`,
            animationDelay: `${firework.delay}s`,
          }}
        >
          <div className="text-5xl">🎆</div>
        </div>
      ))}

      {/* Large zodiac animals */}
      <div className="absolute top-5 left-5 text-7xl animate-float-slow opacity-40" style={{ animationDelay: '0s' }}>
        🐉
      </div>
      <div className="absolute top-10 right-10 text-6xl animate-float-slow opacity-40" style={{ animationDelay: '1.5s' }}>
        🦁
      </div>
      <div className="absolute bottom-10 left-10 text-6xl animate-float-slow opacity-40" style={{ animationDelay: '2.5s' }}>
        🐲
      </div>
      <div className="absolute bottom-5 right-5 text-7xl animate-float-slow opacity-40" style={{ animationDelay: '3.5s' }}>
        🐉
      </div>

      {/* Lanterns hanging */}
      <div className="absolute top-20 left-1/4 text-5xl animate-float-slow opacity-50" style={{ animationDelay: '0.5s' }}>
        🏮
      </div>
      <div className="absolute top-20 right-1/4 text-5xl animate-float-slow opacity-50" style={{ animationDelay: '1s' }}>
        🏮
      </div>
      <div className="absolute top-32 left-1/3 text-4xl animate-float-slow opacity-50" style={{ animationDelay: '1.5s' }}>
        🏮
      </div>
    </div>
  );
}

