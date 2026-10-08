import Link from "next/link";
import clsx from "clsx";
import { Burst } from "@/components/doodle/Doodles";

type Variant = "primary" | "yellow" | "outline";

/** Pill CTA. `burst` adds the yellow hand-drawn accent strokes next to it. */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  burst = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: Variant;
  burst?: boolean;
  className?: string;
}) {
  return (
    <span className="relative inline-flex">
      <Link href={href} className={clsx(variant === "primary" ? "btn-primary" : variant === "yellow" ? "btn-yellow" : "btn-outline", className)}>
        {children}
      </Link>
      {burst && <Burst className="absolute -right-9 top-1/2 h-9 w-9 -translate-y-1/2" />}
    </span>
  );
}
