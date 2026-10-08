import clsx from "clsx";
import { Reveal } from "@/components/ui/motion";

/** Eyebrow + oversized headline + optional intro, used at the top of every section. */
export function SectionHead({
  eyebrow,
  title,
  intro,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal className={clsx(align === "center" && "mx-auto text-center", className)}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="h-display mt-5 text-[2.4rem] sm:text-6xl lg:text-7xl">{title}</h2>
      {intro && <p className={clsx("mt-5 max-w-xl text-[17px] leading-relaxed text-fr-charcoal", align === "center" && "mx-auto")}>{intro}</p>}
    </Reveal>
  );
}
