import Image from "next/image";

export function BrandLogo({
  compact = false,
  className,
  alt,
}: {
  compact?: boolean;
  className?: string;
  alt?: string;
}) {
  return (
    <Image
      src={
        compact
          ? "/job-hunter-lynx-mark.svg"
          : "/job-hunter-animal-logo-5-lynx.svg"
      }
      width={compact ? 80 : 360}
      height={80}
      alt={
        alt ??
        (compact ? "JobHunter lynx mark" : "JobHunter — Spot your opportunity")
      }
      className={
        className ??
        (compact
          ? "size-12 shrink-0"
          : "h-14 w-[252px] max-w-full object-contain object-left")
      }
    />
  );
}
