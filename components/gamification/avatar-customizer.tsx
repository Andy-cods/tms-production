"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar } from "./avatar";
import { updateUserAvatar } from "@/actions/gamification";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";

interface AvatarCustomizerProps {
  currentAvatar: {
    skin: string;
    hair: string;
    hairColor: string;
    eyes: string;
    mouth: string;
    accessory: string | null;
    background: string;
  };
}

export function AvatarCustomizer({ currentAvatar }: AvatarCustomizerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [avatar, setAvatar] = useState({
    skin: currentAvatar.skin || "default",
    hair: currentAvatar.hair || "short",
    hairColor: currentAvatar.hairColor || "black",
    eyes: currentAvatar.eyes || "normal",
    mouth: currentAvatar.mouth || "smile",
    accessory: currentAvatar.accessory || "none",
    background: currentAvatar.background || "blue",
  });

  const options = {
    skin: [
      { value: "default", label: "Default" },
      { value: "light", label: "Light" },
      { value: "medium", label: "Medium" },
      { value: "dark", label: "Dark" },
      { value: "tan", label: "Tan" },
    ],
    hair: [
      { value: "short", label: "Short" },
      { value: "long", label: "Long" },
      { value: "curly", label: "Curly" },
      { value: "bald", label: "Bald" },
      { value: "mohawk", label: "Mohawk" },
    ],
    hairColor: [
      { value: "black", label: "Black" },
      { value: "brown", label: "Brown" },
      { value: "blonde", label: "Blonde" },
      { value: "red", label: "Red" },
      { value: "gray", label: "Gray" },
      { value: "blue", label: "Blue" },
      { value: "pink", label: "Pink" },
      { value: "green", label: "Green" },
    ],
    eyes: [
      { value: "normal", label: "Normal" },
      { value: "happy", label: "Happy" },
      { value: "cool", label: "Cool" },
      { value: "surprised", label: "Surprised" },
    ],
    mouth: [
      { value: "smile", label: "Smile" },
      { value: "happy", label: "Happy" },
      { value: "neutral", label: "Neutral" },
      { value: "sad", label: "Sad" },
      { value: "surprised", label: "Surprised" },
    ],
    accessory: [
      { value: "none", label: "None" },
      { value: "glasses", label: "Glasses" },
      { value: "hat", label: "Hat" },
      { value: "crown", label: "Crown" },
      { value: "mask", label: "Mask" },
    ],
    background: [
      { value: "blue", label: "Blue" },
      { value: "green", label: "Green" },
      { value: "purple", label: "Purple" },
      { value: "pink", label: "Pink" },
      { value: "orange", label: "Orange" },
      { value: "red", label: "Red" },
      { value: "gradient", label: "Gradient" },
    ],
  };

  async function handleSave() {
    setLoading(true);

    try {
      const result = await updateUserAvatar({
        avatarSkin: avatar.skin,
        avatarHair: avatar.hair,
        avatarHairColor: avatar.hairColor,
        avatarEyes: avatar.eyes,
        avatarMouth: avatar.mouth,
        avatarAccessory: avatar.accessory === "none" ? null : avatar.accessory,
        avatarBackground: avatar.background,
      });

      if (result.success) {
        toast.success("Avatar đã được cập nhật!");
        router.refresh();
        // Force reload to show updated avatar
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

  function handleRandomize() {
    const randomChoice = <T,>(arr: T[]): T =>
      arr[Math.floor(Math.random() * arr.length)];

    setAvatar({
      skin: randomChoice(options.skin).value,
      hair: randomChoice(options.hair).value,
      hairColor: randomChoice(options.hairColor).value,
      eyes: randomChoice(options.eyes).value,
      mouth: randomChoice(options.mouth).value,
      accessory: randomChoice(options.accessory).value,
      background: randomChoice(options.background).value,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <Avatar
              skin={avatar.skin}
              hair={avatar.hair}
              hairColor={avatar.hairColor}
              eyes={avatar.eyes}
              mouth={avatar.mouth}
              accessory={avatar.accessory === "none" ? undefined : avatar.accessory}
              background={avatar.background}
              size={200}
            />
          </div>

          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleRandomize}
              className="flex-1"
            >
              🎲 Random
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading} 
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "💾 Lưu Avatar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customization options */}
      <Card>
        <CardHeader>
          <CardTitle>Customize</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skin */}
          <div>
            <Label>Skin Tone</Label>
            <Select value={avatar.skin} onValueChange={(v) => setAvatar({ ...avatar, skin: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.skin.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hair */}
          <div>
            <Label>Hair Style</Label>
            <Select value={avatar.hair} onValueChange={(v) => setAvatar({ ...avatar, hair: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.hair.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hair Color */}
          <div>
            <Label>Hair Color</Label>
            <Select value={avatar.hairColor} onValueChange={(v) => setAvatar({ ...avatar, hairColor: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.hairColor.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eyes */}
          <div>
            <Label>Eyes</Label>
            <Select value={avatar.eyes} onValueChange={(v) => setAvatar({ ...avatar, eyes: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.eyes.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mouth */}
          <div>
            <Label>Mouth</Label>
            <Select value={avatar.mouth} onValueChange={(v) => setAvatar({ ...avatar, mouth: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.mouth.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Accessory */}
          <div>
            <Label>Accessory</Label>
            <Select value={avatar.accessory || "none"} onValueChange={(v) => setAvatar({ ...avatar, accessory: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.accessory.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background */}
          <div>
            <Label>Background</Label>
            <Select value={avatar.background} onValueChange={(v) => setAvatar({ ...avatar, background: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.background.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

