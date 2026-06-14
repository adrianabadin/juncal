import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  height?: number;
  href?: string;
  priority?: boolean;
}

// Relación de aspecto del asset de marca (public/brand/logo-juncal.png): 215 x 160.
const RATIO = 215 / 160;

export default function Logo({ height = 44, href, priority = false }: LogoProps) {
  const width = Math.round(height * RATIO);

  const img = (
    <Image
      src="/brand/logo-juncal.png"
      alt="Sanatorio Juncal"
      width={width}
      height={height}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="Inicio">
        {img}
      </Link>
    );
  }

  return img;
}
