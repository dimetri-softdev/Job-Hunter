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
      src="/job-hunter-animal-logo-5-lynx.svg"
      width={360}
      height={80}
      alt={alt ?? (compact ? "JobHunter" : "JobHunter — Spot your opportunity")}
      className={
        className ??
        (compact
          ? "h-9 w-9 shrink-0 object-cover object-left"
          : "h-10 w-[180px] max-w-full object-contain object-left")
      }
    />
  );
}
