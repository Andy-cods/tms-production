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

export function SpringElements() {
  const [elements, setElements] = useState<Element[]>([]);

  useEffect(() => {
    const items: Element[] = [];
    const emojis = ["🌸", "🌺", "🌷", "🦋", "🐝", "🌿"];
    
    for (let i = 0; i < 12; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 5 + Math.random() * 3,
        size: 20 + Math.random() * 25,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
      });
    }
    setElements(items);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {elements.map((element) => (
        <div
          key={element.id}
          className="absolute animate-float-slow opacity-50 hover:opacity-100 transition-opacity"
          style={{
            left: `${element.left}%`,
            top: `${element.top}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${element.duration}s`,
            fontSize: `${element.size}px`,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          }}
        >
          {element.emoji}
        </div>
      ))}
    </div>
  );
}

