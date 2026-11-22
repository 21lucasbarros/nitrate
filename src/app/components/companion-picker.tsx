"use client";

import { useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getFollowers } from "@/lib/services/user-service";
import type { UserSummary } from "@/lib/types/user";
import { Avatar } from "./ui/avatar";

const MAX_RESULTS = 6;
/** igual ao limite do backend: quantas pessoas cabem no "assisti com" */
export const MAX_COMPANIONS = 15;

interface CompanionPickerProps {
  value: UserSummary[];
  onChange: (users: UserSummary[]) => void;
  /** quem já aceitou: aparece sem o X */
  lockedUsernames?: string[];
  /** só mostra quem está na sessão, sem deixar marcar mais ninguém (quem entrou por convite) */
  readOnly?: boolean;
  /** linha embaixo das pessoas escolhidas (ex.: "Aguardando aceitar") */
  hint?: string;
}

/**
 * "Assisti com": marca quem viu o filme junto, até MAX_COMPANIONS pessoas. Cada uma recebe um convite
 * para a review em conjunto, por isso só aparecem (e o backend só aceita) quem segue você.
 */
export function CompanionPicker({ value, onChange, lockedUsernames = [], readOnly = false, hint }: CompanionPickerProps) {
  const { user: me } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const followers = useFetch(open && me ? me.username : null, getFollowers);
  const root = useRef<HTMLDivElement>(null);

  // clicar fora fecha a busca
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const chosen = new Set(value.map((u) => u.username.toLowerCase()));
  const term = query.trim().toLowerCase().replace(/^@/, "");
  const available = (followers.data ?? []).filter((u) => !chosen.has(u.username.toLowerCase()));
  const results = available
    .filter((u) => !term || u.username.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
    .slice(0, MAX_RESULTS);

  const full = value.length >= MAX_COMPANIONS;

  // a busca continua aberta para marcar mais gente em seguida (até encher)
  const choose = (user: UserSummary) => {
    if (full) return;
    onChange([...value, user]);
    setQuery("");
    if (value.length + 1 >= MAX_COMPANIONS) setOpen(false);
  };

  return (
    <div ref={root} className="relative flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Assisti com</span>

      <ul className="flex flex-wrap items-center gap-1.5">
        {value.map((u) => (
          <li
            key={u.username}
            title={`${u.name} @${u.username}`}
            className="flex items-center gap-1.5 max-w-[180px] pl-1 pr-1.5 py-1 rounded-full bg-surface text-sm"
          >
            <Avatar name={u.name} username={u.username} avatar={u.avatar} size="xs" />
            <span className="min-w-0 truncate font-medium">{u.name.split(" ")[0]}</span>
            {!readOnly && !lockedUsernames.some((l) => l.toLowerCase() === u.username.toLowerCase()) && (
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.username !== u.username))}
                aria-label={`Desmarcar ${u.name}`}
                className="p-0.5 rounded-full text-brand-slate hover:text-brand-crimson transition-colors"
              >
                <XIcon size={12} weight="bold" />
              </button>
            )}
          </li>
        ))}
        {!readOnly && !full && (
          <li>
            {value.length > 0 ? (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-label="Marcar mais alguém"
                title="Marcar mais alguém"
                aria-expanded={open}
                className={`flex items-center justify-center w-7 h-7 rounded-full border border-dashed transition-colors ${
                  open ? "border-brand-orange text-brand-orange" : "border-brand-slate/40 text-brand-slate hover:text-foreground hover:border-foreground/50"
                }`}
              >
                <PlusIcon size={14} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                className="flex items-center gap-2 text-sm text-brand-slate/80 hover:text-foreground transition-colors"
              >
                <UserPlusIcon size={18} />
                Marcar quem assistiu com você
              </button>
            )}
          </li>
        )}
      </ul>

      {value.length > 0 && hint && <span className="text-xs text-brand-slate">{hint}</span>}
      {!readOnly && full && (
        <span className="text-xs text-brand-slate/70">Limite de {MAX_COMPANIONS} pessoas numa review em conjunto.</span>
      )}

      {/* por cima do formulário, para o modal não crescer; abre para cima porque o campo fica no fim do formulário */}
      {open && !readOnly && !full && (
        <div className="absolute z-20 bottom-full left-0 mb-2 w-full min-w-[260px] max-w-sm rounded-xl border border-brand-slate/20 bg-background shadow-2xl shadow-black/40 overflow-hidden">
          <label className="flex items-center gap-2 px-3 border-b border-brand-slate/10">
            <MagnifyingGlassIcon size={16} className="shrink-0 text-brand-slate/60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter aqui enviaria o formulário da review
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (results[0]) choose(results[0]);
                }
                if (e.key === "Escape") {
                  // sem fechar o modal junto (o <dialog> fecha no Esc se o keydown não for cancelado)
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                }
              }}
              autoFocus
              placeholder="Buscar entre quem segue você"
              aria-label="Buscar entre quem segue você"
              className="flex-1 py-2.5 bg-transparent text-sm focus:outline-none"
            />
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-brand-slate hover:text-foreground">
              {value.length > 0 ? "Pronto" : "Cancelar"}
            </button>
          </label>
          {!followers.data ? (
            <p className="px-3 py-3 text-sm text-brand-slate/70">
              {followers.error ? "Não foi possível carregar." : "Carregando…"}
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-brand-slate/70">
              {followers.data.length === 0
                ? "Só dá para marcar quem segue você, e ninguém te segue ainda."
                : available.length === 0
                  ? "Você já marcou todo mundo que segue você."
                  : "Ninguém com esse nome entre quem segue você."}
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {results.map((u) => (
                <li key={u.username}>
                  <button
                    type="button"
                    onClick={() => choose(u)}
                    className="flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-surface-strong transition-colors"
                  >
                    <Avatar name={u.name} username={u.username} avatar={u.avatar} size="sm" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{u.name}</span>
                      <span className="block text-xs text-brand-slate truncate">@{u.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
