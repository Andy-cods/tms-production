"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PetAdoptionDialog } from "@/components/gamification/pet-adoption-dialog";

export function PetAdoptionDialogClient() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        🐾 Adopt a Pet
      </Button>
      <PetAdoptionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

