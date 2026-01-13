"use client";

import { useEffect, useState } from "react";

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
}

interface Firework {
  id: number;
  left: number;
  top: number;
  delay: number;
}

export function NewYearElements() {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const [fireworks, setFireworks] = useState<Firework[]>([]);

  useEffect(() => {
    // Confetti
    const confettiItems: Confetti[] = [];
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6B9D", "#C7CEEA"];
    const emojis = ["🎊", "🎉", "✨", "⭐"];
    
    for (let i = 0; i < 30; i++) {
      confettiItems.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 12,
      });
    }
    setConfetti(confettiItems);

    // Fireworks
    const fireworkItems: Firework[] = [];
    for (let i = 0; i < 5; i++) {
      fireworkItems.push({
        id: i,
        left: 20 + Math.random() * 60,
        top: 10 + Math.random() * 40,
        delay: Math.random() * 3,
      });
    }
    setFireworks(fireworkItems);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Confetti */}
      {confetti.map((item) => (
        <div
          key={item.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${item.left}%`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            fontSize: `${item.size}px`,
          }}
        >
          {["🎊", "🎉", "✨", "⭐"][Math.floor(Math.random() * 4)]}
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
          <div className="text-4xl">🎆</div>
        </div>
      ))}

      {/* Zodiac animals floating */}
      <div className="absolute top-10 left-10 text-6xl animate-float-slow opacity-50" style={{ animationDelay: '0s' }}>
        🐉
      </div>
      <div className="absolute top-20 right-20 text-5xl animate-float-slow opacity-50" style={{ animationDelay: '1s' }}>
        🐲
      </div>
      <div className="absolute bottom-20 left-20 text-4xl animate-float-slow opacity-50" style={{ animationDelay: '2s' }}>
        🦁
      </div>
    </div>
  );
}

