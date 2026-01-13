"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
import { Star, Crown, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { equipBadge, unequipBadge } from "@/actions/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BadgeCollectionProps {
  badges: Array<{
    id: string;
    badge: {
      id: string;
      name: string;
      description: string;
      icon: string;
      tier: BadgeTier;
      isRare: boolean;
    };
    earnedAt: Date;
    isEquipped: boolean;
  }>;
  onEquip?: (badgeId: string) => void;
  onUnequip?: (badgeId: string) => void;
}

export function BadgeCollection({
  badges,
  onEquip,
  onUnequip,
}: BadgeCollectionProps) {
  const router = useRouter();
  const [selectedBadge, setSelectedBadge] = useState<any>(null);

  const handleEquip = async (userBadgeId: string) => {
    const result = await equipBadge(userBadgeId);
    if (result.success) {
      toast.success("Badge equipped");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleUnequip = async (userBadgeId: string) => {
    const result = await unequipBadge(userBadgeId);
    if (result.success) {
      toast.success("Badge unequipped");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const tierColors: Record<BadgeTier, string> = {
    BRONZE: "border-orange-400 bg-orange-50",
    SILVER: "border-gray-400 bg-gray-50",
    GOLD: "border-yellow-400 bg-yellow-50",
    PLATINUM: "border-blue-400 bg-blue-50",
    DIAMOND: "border-purple-400 bg-purple-50",
  };

  const tierIcons: Record<BadgeTier, React.ReactElement> = {
    BRONZE: <Award className="h-4 w-4 text-orange-600" />,
    SILVER: <Star className="h-4 w-4 text-gray-600" />,
    GOLD: <Crown className="h-4 w-4 text-yellow-600" />,
    PLATINUM: <Star className="h-4 w-4 text-blue-600" />,
    DIAMOND: <Crown className="h-4 w-4 text-purple-600" />,
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {badges.map((userBadge) => (
          <Card
            key={userBadge.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
              tierColors[userBadge.badge.tier],
              userBadge.isEquipped && "ring-2 ring-primary-500"
            )}
            onClick={() => setSelectedBadge(userBadge)}
          >
            <CardContent className="p-4 flex flex-col items-center">
              {/* Badge icon */}
              <div className="text-4xl mb-2">{userBadge.badge.icon}</div>

              {/* Badge name */}
              <p className="text-sm font-semibold text-center line-clamp-2">
                {userBadge.badge.name}
              </p>

              {/* Tier indicator */}
              <div className="flex items-center gap-1 mt-2">
                {tierIcons[userBadge.badge.tier]}
                <span className="text-xs text-gray-600">
                  {userBadge.badge.tier}
                </span>
              </div>

              {/* Rare indicator */}
              {userBadge.badge.isRare && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  RARE
                </Badge>
              )}

              {/* Equipped indicator */}
              {userBadge.isEquipped && (
                <Badge variant="default" className="mt-2 text-xs">
                  Equipped
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Badge Detail Dialog */}
      <Dialog
        open={!!selectedBadge}
        onOpenChange={() => setSelectedBadge(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-4xl">{selectedBadge?.badge.icon}</span>
              <div>
                <p>{selectedBadge?.badge.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {selectedBadge && tierIcons[selectedBadge.badge.tier as BadgeTier]}
                  <span className="text-sm text-gray-500">
                    {selectedBadge?.badge.tier}
                  </span>
                  {selectedBadge?.badge.isRare && (
                    <Badge variant="destructive" className="text-xs">
                      RARE
                    </Badge>
                  )}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedBadge?.badge.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p>
                <strong>Earned:</strong>{" "}
                {selectedBadge && new Date(selectedBadge.earnedAt).toLocaleDateString()}
              </p>
            </div>

            <Button
              onClick={async () => {
                if (selectedBadge?.isEquipped) {
                  await handleUnequip(selectedBadge.id);
                } else {
                  await handleEquip(selectedBadge.id);
                }
                setSelectedBadge(null);
              }}
              className="w-full"
            >
              {selectedBadge?.isEquipped ? "Unequip" : "Equip Badge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

