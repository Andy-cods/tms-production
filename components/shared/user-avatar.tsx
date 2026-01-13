import { Avatar } from "@/components/gamification/avatar";

interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    stats?: { 
      level?: number; 
      experiencePoints?: number;
      avatarSkin?: string | null;
      avatarHair?: string | null;
      avatarHairColor?: string | null;
      avatarEyes?: string | null;
      avatarMouth?: string | null;
      avatarAccessory?: string | null;
      avatarBackground?: string | null;
    } | null;
    gamification?: {
      avatarSkin: string;
      avatarHair: string;
      avatarHairColor: string;
      avatarEyes: string;
      avatarMouth: string;
      avatarAccessory: string | null;
      avatarBackground: string;
      level?: number;
    } | null;
  } | null; // ← CRITICAL: user itself can be null
  size?: number;
  showLevel?: boolean;
  className?: string;
}

export function UserAvatar({
  user,
  size = 40,
  showLevel = false,
  className = "",
}: UserAvatarProps) {
  // CRITICAL: Check if user exists first
  if (!user) {
    // Fallback for null user
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-gray-300 text-gray-600 font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }

  // SAFE CHECK: Check avatar from stats first, then gamification
  const avatarFromStats = user.stats && 
    user.stats.avatarSkin && 
    user.stats.avatarHair;
  
  const avatarFromGamification = 
    user.gamification !== null &&
    user.gamification !== undefined &&
    user.gamification.avatarSkin &&
    user.gamification.avatarHair;
  
  // Prefer stats over gamification
  const avatarData = avatarFromStats ? {
    skin: user.stats!.avatarSkin!,
    hair: user.stats!.avatarHair!,
    hairColor: user.stats!.avatarHairColor || 'black',
    eyes: user.stats!.avatarEyes || 'normal',
    mouth: user.stats!.avatarMouth || 'smile',
    accessory: user.stats!.avatarAccessory || undefined,
    background: user.stats!.avatarBackground || 'blue',
  } : (avatarFromGamification ? {
    skin: user.gamification!.avatarSkin,
    hair: user.gamification!.avatarHair,
    hairColor: user.gamification!.avatarHairColor,
    eyes: user.gamification!.avatarEyes,
    mouth: user.gamification!.avatarMouth,
    accessory: user.gamification!.avatarAccessory || undefined,
    background: user.gamification!.avatarBackground,
  } : null);

  // Fallback: Initials if no avatar
  if (!avatarData) {
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className="relative">
        <div
          className={`flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
          {initials}
        </div>
        {showLevel && (user.stats?.level ?? undefined) && (
          <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
            {user.stats!.level}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Avatar
        skin={avatarData.skin}
        hair={avatarData.hair}
        hairColor={avatarData.hairColor}
        eyes={avatarData.eyes}
        mouth={avatarData.mouth}
        accessory={avatarData.accessory}
        background={avatarData.background}
        size={size}
      />
      {showLevel && (user.stats?.level ?? undefined) && (
        <div className="absolute -bottom-1 -right-1 bg-primary-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
          {user.stats!.level}
        </div>
      )}
    </div>
  );
}
