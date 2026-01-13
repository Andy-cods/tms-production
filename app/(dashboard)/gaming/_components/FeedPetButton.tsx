"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { feedPet } from "@/actions/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Cookie } from "lucide-react";

export function FeedPetButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFeed() {
    setLoading(true);

    try {
      const result = await feedPet();

      if (result.success) {
        toast.success(
          `Pet fed! Happiness: ${result.happiness}% (+5 XP)`
        );
        router.refresh();
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
    <Button
      onClick={handleFeed}
      disabled={loading}
      variant="outline"
      size="sm"
      className="mt-3 w-full"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Feeding...
        </>
      ) : (
        <>
          <Cookie className="h-4 w-4 mr-2" />
          Feed Pet
        </>
      )}
    </Button>
  );
}

