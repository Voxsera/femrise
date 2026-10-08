import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

/**
 * Official Fem Rise logo. Use tone="dark" on light backgrounds (black stroke)
 * and tone="light" on dark backgrounds (white stroke). Coloured dots and the
 * yellow wordmark stay the same in both.
 */
export function Logo({
  tone = "dark",
  size = 44,
  withLink = true,
  className,
  priority,
}: {
  tone?: "dark" | "light";
  size?: number;
  withLink?: boolean;
  className?: string;
  priority?: boolean;
}) {
  const img = (
    <Image
      src={tone === "dark" ? "/brand/femrise-logo.png" : "/brand/femrise-logo-light.png"}
      alt="Fem Rise Club"
      width={size}
      height={Math.round(size * (852 / 860))}
      priority={priority}
      className={clsx("select-none", className)}
    />
  );
  if (!withLink) return img;
  return (
    <Link href="/" aria-label="Fem Rise Club home" className="inline-flex shrink-0">
      {img}
    </Link>
  );
}

/** The three logo dots (blue, green, sun) — used as a recurring brand motif. */
export function BrandDots({ className, size = 10 }: { className?: string; size?: number }) {
  return (
    <span className={clsx("inline-flex items-end gap-1.5", className)} aria-hidden>
      <span className="rounded-full bg-fr-blue" style={{ width: size, height: size, marginBottom: size * 0.9 }} />
      <span className="rounded-full bg-fr-green" style={{ width: size, height: size, marginBottom: size * 0.45 }} />
      <span className="rounded-full bg-fr-orange" style={{ width: size, height: size }} />
    </span>
  );
}
