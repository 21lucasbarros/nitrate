"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleNotchIcon, EyeIcon, EyeSlashIcon, TrophyIcon } from "@phosphor-icons/react";

import { PersonPhoto } from "./ui/person-photo";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getUserAchievements, setAchievementHidden } from "@/lib/services/person-service";
import type { Achievement } from "@/types/person";
import { personHref } from "@/utils/person-link";

/**
 * Aba Conquistas do perfil. Por enquanto, filmografias completas: todos os filmes já lançados
 * de um diretor ou ator. Na própria aba, a dona pode tirar uma conquista do perfil (ela continua
 * aqui, apagada, só para ela) e colocar de volta.
 */
export function ProfileAchievements({ username, name, isMe }: { username: string; name: string; isMe: boolean }) {
  const achievements = useFetch(username, getUserAchievements);
  const [saving, setSaving] = useState<number | null>(null);

  if (!achievements.data) {
    return (
      <div className="py-24 flex justify-center text-brand-slate/40">
        {achievements.error ? "Não foi possível carregar as conquistas." : <CircleNotchIcon size={28} className="animate-spin" />}
      </div>
    );
  }

  const items = achievements.data;
  if (items.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center text-brand-slate">
        <TrophyIcon size={32} weight="light" className="text-brand-slate/50" />
        {isMe ? (
          <p className="max-w-md">
            Veja todos os filmes de um diretor ou ator para ganhar sua primeira conquista. O quanto você já viu aparece na
            página de cada pessoa.
          </p>
        ) : (
          <p>{name} ainda não tem conquistas.</p>
        )}
      </div>
    );
  }

  const toggle = async (achievement: Achievement) => {
    const previous = items;
    const hidden = !achievement.hidden;
    setSaving(achievement.id);
    achievements.setData(items.map((a) => (a.id === achievement.id ? { ...a, hidden } : a)));
    try {
      await setAchievementHidden(achievement.id, hidden);
    } catch {
      achievements.setData(previous);
    } finally {
      setSaving(null);
    }
  };

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((achievement) => (
        <li
          key={achievement.id}
          className={`flex items-center gap-4 p-4 rounded-lg bg-surface ring-1 ${achievement.hidden ? "ring-foreground/5" : "ring-brand-orange/20"}`}
        >
          <Link
            href={personHref(achievement.person)}
            className={`group relative shrink-0 transition-opacity ${achievement.hidden ? "opacity-40" : ""}`}
          >
            <PersonPhoto
              name={achievement.person.name}
              profilePath={achievement.person.profilePath}
              sizes="64px"
              className="w-16 group-hover:ring-2 group-hover:ring-brand-orange transition-shadow"
            />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center size-6 rounded-full bg-brand-orange text-background ring-2 ring-surface">
              <TrophyIcon size={13} weight="fill" />
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <p
              className={`text-[11px] font-bold tracking-[0.15em] uppercase ${achievement.hidden ? "text-brand-slate/60" : "text-brand-orange"}`}
            >
              {achievement.hidden ? "Fora do perfil" : "Filmografia completa"}
            </p>
            <Link
              href={personHref(achievement.person)}
              className="mt-0.5 block font-semibold leading-tight truncate hover:text-brand-orange transition-colors"
            >
              {achievement.person.name}
            </Link>
            <p className="mt-1 text-xs text-brand-slate">
              Todos os {achievement.films} filmes · {achievedOn(achievement.achievedAt)}
            </p>
          </div>
          {isMe && (
            <button
              type="button"
              onClick={() => toggle(achievement)}
              disabled={saving === achievement.id}
              aria-label={achievement.hidden ? "Mostrar no perfil" : "Tirar do perfil"}
              title={achievement.hidden ? "Oculta para quem visita. Clique para mostrar no perfil" : "Tirar do perfil"}
              className="self-start shrink-0 -mr-1 -mt-1 p-1.5 rounded-md text-brand-slate hover:text-foreground hover:bg-foreground/10 transition-colors disabled:opacity-50"
            >
              {achievement.hidden ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/** "21 nov. 2026" */
function achievedOn(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}
