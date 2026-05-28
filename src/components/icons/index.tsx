import Image from "next/image";

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function IconEscudo({ className, width = 120, height = 203, alt = "Escudo Bolão 2026" }: IconProps) {
  return (
    <Image
      src="/icons/MERCEARIAAMAURI_CopadoMundo_2026_Bolao_Escudo.svg"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

export function IconEstrelas({ className, width = 120, height = 40, alt = "5 Estrelas" }: IconProps) {
  return (
    <Image
      src="/icons/MERCEARIAAMAURI_CopadoMundo_2026_Bolao_Estrelas.svg"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

export function IconBadge2026({ className, width = 160, height = 160, alt = "2026" }: IconProps) {
  return (
    <Image
      src="/icons/MERCEARIAAMAURI_CopadoMundo_2026_Bolao_2026.svg"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

export function IconTacaJules({ className, width = 80, height = 120, alt = "Taça Jules Rimet" }: IconProps) {
  return (
    <Image
      src="/icons/MERCEARIAAMAURI_CopadoMundo_2026_Bolao_TacaJules.svg"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}

export function IconTacaPenta({ className, width = 80, height = 120, alt = "Taça Penta" }: IconProps) {
  return (
    <Image
      src="/icons/MERCEARIAAMAURI_CopadoMundo_2026_Bolao_TacaPenta.svg"
      width={width}
      height={height}
      alt={alt}
      className={className}
    />
  );
}
