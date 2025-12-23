import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlayCircle } from "lucide-react";

export type DemoKind = "audio" | "video" | "image";

export type DemoRequest = {
  id: string;
  kind: DemoKind;
  url: string;
  filename: string;
  label: string;
};

type DemoMenuProps = {
  basePath: string; // e.g. "/demos"
  onPick: (demo: DemoRequest) => void;
  disabled?: boolean;
};

const joinUrl = (basePath: string, filename: string) => {
  const base = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  const file = filename.startsWith("/") ? filename.slice(1) : filename;
  return `${base}/${file}`;
};

export function DemoMenu({ basePath, onPick, disabled = false }: DemoMenuProps) {
  const demos = useMemo(
    () =>
      [
        { kind: "image" as const, filename: "real.jpeg", label: "Image — Real (real.jpeg)" },
        { kind: "image" as const, filename: "fake.png", label: "Image — Fake (fake.png)" },
        { kind: "video" as const, filename: "real.mp4", label: "Video — Real (real.mp4)" },
        { kind: "video" as const, filename: "fake.mp4", label: "Video — Fake (fake.mp4)" },
        { kind: "video" as const, filename: "real_video.mp4", label: "Video — Real (real_video.mp4)" },
        { kind: "video" as const, filename: "fake_video.mp4", label: "Video — Fake (fake_video.mp4)" },
        { kind: "audio" as const, filename: "real.wav", label: "Audio — Real (real.wav)" },
        { kind: "audio" as const, filename: "fake.wav", label: "Audio — Fake (fake.wav)" },
      ],
    [],
  );

  const pick = (kind: DemoKind, filename: string, label: string) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    onPick({
      id,
      kind,
      filename,
      label,
      url: joinUrl(basePath, filename),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={disabled}>
          <PlayCircle className="w-4 h-4" />
          Demo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Try sample media</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {demos.map((d) => (
          <DropdownMenuItem key={`${d.kind}:${d.filename}`} onClick={() => pick(d.kind, d.filename, d.label)}>
            {d.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

