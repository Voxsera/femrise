import Image from "next/image";
import clsx from "clsx";

const palette = ["bg-fr-yellow text-ink", "bg-fr-blue text-white", "bg-fr-green text-ink", "bg-fr-orange text-ink", "bg-fr-softblue text-ink"];

function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const initials = name
    .replace(/[@._]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  if (src) {
    return <Image src={src} alt={name} width={size} height={size} className={clsx("rounded-full border-2 border-ink object-cover", className)} />;
  }
  return (
    <span
      className={clsx("inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink font-display font-bold", colorFor(name), className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}
