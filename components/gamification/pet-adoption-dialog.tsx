"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pet } from "./pet";
type PetType = any;
import { adoptPet } from "@/actions/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface PetAdoptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PET_OPTIONS = [
  { type: "CAT" as PetType, name: "Cat", emoji: "🐱", description: "Cute and cuddly" },
  { type: "DOG" as PetType, name: "Dog", emoji: "🐶", description: "Loyal friend" },
  { type: "DRAGON" as PetType, name: "Dragon", emoji: "🐉", description: "Powerful guardian" },
  { type: "UNICORN" as PetType, name: "Unicorn", emoji: "🦄", description: "Magical companion" },
  { type: "ROBOT" as PetType, name: "Robot", emoji: "🤖", description: "Tech assistant" },
  { type: "PHOENIX" as PetType, name: "Phoenix", emoji: "🔥", description: "Immortal bird" },
];

export function PetAdoptionDialog({ open, onOpenChange }: PetAdoptionDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<PetType>("CAT");
  const [petName, setPetName] = useState("");

  async function handleAdopt() {
    if (!petName.trim()) {
      toast.error("Vui lòng đặt tên cho pet");
      return;
    }

    setLoading(true);

    try {
      const result = await adoptPet({
        petType: selectedType,
        petName: petName.trim(),
      });

      if (result.success) {
        toast.success(`Chúc mừng! Bạn đã nhận ${petName} 🎉`);
        onOpenChange(false);
        // Force refresh to show new pet
        router.refresh();
        // Also trigger a page reload after a short delay to ensure data is fresh
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adopt a Pet</DialogTitle>
          <DialogDescription>
            Choose your companion! Pets gain XP and level up as you complete tasks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pet selection */}
          <div>
            <Label>Choose Pet Type</Label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {PET_OPTIONS.map((pet) => (
                <button
                  key={pet.type}
                  onClick={() => setSelectedType(pet.type)}
                  className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                    selectedType === pet.type
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="text-3xl mb-2">{pet.emoji}</div>
                  <p className="font-semibold text-sm">{pet.name}</p>
                  <p className="text-xs text-gray-500">{pet.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
            <Pet
              type={selectedType}
              name={petName || "Your Pet"}
              level={1}
              happiness={100}
              size={150}
            />
          </div>

          {/* Pet name */}
          <div>
            <Label>Pet Name</Label>
            <Input
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Enter pet name..."
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              {petName.length}/20 characters
            </p>
          </div>

          {/* Adopt button */}
          <Button
            onClick={handleAdopt}
            disabled={loading || !petName.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang nhận nuôi...
              </>
            ) : (
              <>
                🐾 Nhận nuôi Pet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

