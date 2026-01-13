"use client";

import { useEffect, useState } from "react";

interface Leaf {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
}

export function AutumnElements() {
  const [leaves, setLeaves] = useState<Leaf[]>([]);

  useEffect(() => {
    const items: Leaf[] = [];
    
    for (let i = 0; i < 20; i++) {
      items.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 4,
        rotation: Math.random() * 360,
        size: 15 + Math.random() * 20,
      });
    }
    setLeaves(items);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute animate-falling-leaf opacity-60"
          style={{
            left: `${leaf.left}%`,
            animationDelay: `${leaf.delay}s`,
            animationDuration: `${leaf.duration}s`,
            fontSize: `${leaf.size}px`,
            transform: `rotate(${leaf.rotation}deg)`,
          }}
        >
          {Math.random() > 0.5 ? "🍂" : "🍁"}
        </div>
      ))}
    </div>
  );
}

