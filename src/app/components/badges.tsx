"use client";

import { useState } from "react";
import {
  BugIcon,
  CodeIcon,
  CoinsIcon,
  CrownIcon,
  FilmSlateIcon,
  FlaskIcon,
  HandHeartIcon,
  HouseLineIcon,
  LightbulbIcon,
  MedalIcon,
  MegaphoneIcon,
  PenNibIcon,
  PopcornIcon,
  RocketIcon,
  SealCheckIcon,
  TrophyIcon,
  type Icon,
} from "@phosphor-icons/react";

import { Modal } from "./ui/modal";
import type { Badge } from "@/lib/types/user";
import { monthYear } from "@/utils/format";

// cores fixas por extenso: o Tailwind só gera as classes que aparecem inteiras no código
const TONES = {
  amber: "text-amber-300 bg-amber-300/10 ring-amber-300/25",
  orange: "text-brand-orange bg-brand-orange/10 ring-brand-orange/25",
  emerald: "text-brand-emerald bg-brand-emerald/10 ring-brand-emerald/25",
  crimson: "text-brand-crimson bg-brand-crimson/10 ring-brand-crimson/25",
  violet: "text-brand-violet bg-brand-violet/10 ring-brand-violet/25",
  blue: "text-brand-blue bg-brand-blue/10 ring-brand-blue/25",
  teal: "text-brand-teal bg-brand-teal/10 ring-brand-teal/25",
  slate: "text-brand-slate bg-surface-strong ring-foreground/10",
} as const;

// espelha o BadgeType do backend; um selo novo que ainda não esteja aqui usa a medalha cinza
const STYLES: Record<string, { icon: Icon; tone: keyof typeof TONES }> = {
  FUNDADOR: { icon: CrownIcon, tone: "amber" },
  EQUIPE: { icon: FilmSlateIcon, tone: "orange" },
  INVESTIDOR: { icon: CoinsIcon, tone: "emerald" },
  APOIADOR: { icon: HandHeartIcon, tone: "crimson" },
  FAMILIA: { icon: HouseLineIcon, tone: "violet" },
  INSPIRACAO: { icon: LightbulbIcon, tone: "amber" },
  COLABORADOR: { icon: CodeIcon, tone: "blue" },
  BETA_TESTER: { icon: FlaskIcon, tone: "teal" },
  PIONEIRO: { icon: RocketIcon, tone: "orange" },
  CACADOR_DE_BUGS: { icon: BugIcon, tone: "emerald" },
  EMBAIXADOR: { icon: MegaphoneIcon, tone: "violet" },
  CRITICO: { icon: PenNibIcon, tone: "blue" },
  CINEFILO: { icon: PopcornIcon, tone: "crimson" },
  VERIFICADO: { icon: SealCheckIcon, tone: "teal" },
  LENDA: { icon: TrophyIcon, tone: "amber" },
};

function styleFor(type: string) {
  const style = STYLES[type] ?? { icon: MedalIcon, tone: "slate" as const };
  return { Icon: style.icon, tone: TONES[style.tone] };
}

/** só o ícone, num círculo com a cor do selo */
export function BadgeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const { Icon, tone } = styleFor(type);
  const box = { sm: "w-6 h-6", md: "w-9 h-9", lg: "w-11 h-11" }[size];
  const icon = { sm: 13, md: 18, lg: 22 }[size];
  return (
    <span aria-hidden="true" className={`${box} ${tone} shrink-0 inline-flex items-center justify-center rounded-full ring-1`}>
      <Icon size={icon} weight="fill" />
    </span>
  );
}

/** ícone e nome do selo, no formato de etiqueta */
export function BadgeChip({ badge, onClick }: { badge: Pick<Badge, "type" | "label" | "description" | "note">; onClick?: () => void }) {
  const { Icon, tone } = styleFor(badge.type);
  const className = `inline-flex items-center gap-1 pl-1.5 pr-2 py-0.5 rounded-full ring-1 text-[11px] font-semibold ${tone}`;
  const content = (
    <>
      <Icon size={12} weight="fill" aria-hidden="true" />
      {badge.label}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} title={badge.note ?? badge.description} className={`${className} hover:brightness-125 transition`}>
      {content}
    </button>
  ) : (
    <span title={badge.note ?? badge.description} className={className}>
      {content}
    </span>
  );
}

/** selos do topo do perfil; clicar abre a lista com a descrição e a nota de cada um */
export function ProfileBadges({ badges, name }: { badges: Badge[]; name: string }) {
  const [open, setOpen] = useState(false);
  if (badges.length === 0) return null;

  return (
    <>
      <ul aria-label="Selos" className="mt-2.5 flex flex-wrap gap-1.5">
        {badges.map((badge) => (
          <li key={badge.type}>
            <BadgeChip badge={badge} onClick={() => setOpen(true)} />
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)} label={`Selos de ${name}`}>
        <h2 className="text-lg font-semibold">Selos de {name}</h2>
        <ul className="mt-5 flex flex-col gap-4">
          {badges.map((badge) => (
            <li key={badge.type} className="flex gap-3.5">
              <BadgeIcon type={badge.type} size="lg" />
              <div className="min-w-0">
                <p className="font-semibold">{badge.label}</p>
                <p className="text-sm text-brand-slate">{badge.description}</p>
                {badge.note && <p className="mt-1 text-sm text-foreground/85 italic">“{badge.note}”</p>}
                {badge.awardedAt && <p className="mt-1 text-xs text-brand-slate/60">desde {monthYear(badge.awardedAt)}</p>}
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
