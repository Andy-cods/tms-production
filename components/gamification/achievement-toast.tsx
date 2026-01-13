"use client";

import { toast } from "sonner";

interface AchievementToastProps {
  achievement: {
    name: string;
    description: string;
    icon: string;
    xpReward: number;
  };
}

export function showAchievementToast(achievement: AchievementToastProps["achievement"]) {
  // Dynamic import to avoid SSR issues
  import("canvas-confetti").then((confetti) => {
    // Fire confetti
    confetti.default({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      zIndex: 9999,
    });
  });

  // Show toast
  toast.custom(
    (t) => (
      <div className="bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 border-2 border-yellow-400 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-top-5">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{achievement.icon}</div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">🎉 Achievement Unlocked!</p>
            <p className="text-lg font-semibold text-gray-800 mt-1">
              {achievement.name}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {achievement.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                +{achievement.xpReward} XP
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: "top-center",
    }
  );
}

