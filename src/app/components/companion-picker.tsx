"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, UserPlusIcon, XIcon } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth-context";
import { useFetch } from "@/lib/hooks/use-fetch";
import { getFollowers } from "@/lib/services/user-service";
import type { UserSummary } from "@/lib/types/user";
import { Avatar } from "./ui/avatar";

const MAX_RESULTS = 6;

interface CompanionPickerProps {
  value: UserSummary | null;
  onChange: (user: UserSummary | null) => void;
  /** par já confirmado: mostra quem é, sem deixar trocar */
  locked?: boolean;
  /** linha embaixo da pessoa escolhida (ex.: "Aguardando aceitar") */
  hint?: string;
}

/**
 * "Assisti com": marca quem viu o filme junto. A pessoa recebe um convite para a review em conjunto,
 * por isso só aparecem (e o backend só aceita) quem segue você.
 */
export function CompanionPicker({ value, onChange, locked = false, hint }: CompanionPickerProps) {
  const { user: me } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const followers = useFetch(open && me ? me.username : null, getFollowers);

  const term = query.trim().toLowerCase().replace(/^@/, "");
  const results = (followers.data ?? [])
    .filter((u) => !term || u.username.toLowerCase().includes(term) || u.name.toLowerCase().includes(term))
    .slice(0, MAX_RESULTS);

  const choose = (user: UserSummary) => {
    onChange(user);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.15em] text-brand-slate/60">Assisti com</span>

      {value ? (
        <div className="flex items-center gap-2.5 w-fit max-w-full pl-1.5 pr-2 py-1.5 rounded-full bg-surface">
          <Avatar name={value.name} username={value.username} avatar={value.avatar} size="xs" />
          <span className="min-w-0 truncate text-sm">
            <span className="font-medium">{value.name}</span>{" "}
            <span className="text-brand-slate">@{value.username}</span>
          </span>
          {!locked && (
            <button
              type="button"
              onClick={() => onChange(null)}
              aria-label={`Desmarcar ${value.name}`}
              className="p-0.5 rounded-full text-brand-slate hover:text-brand-crimson transition-colors"
            >
              <XIcon size={14} weight="bold" />
            </button>
          )}
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-fit text-sm text-brand-slate/80 hover:text-foreground transition-colors"
        >
          <UserPlusIcon size={18} />
          Marcar quem assistiu com você
        </button>
      ) : (
        <div className="rounded-xl border border-brand-slate/20 overflow-hidden">
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
                if (e.key === "Escape") setOpen(false);
              }}
              autoFocus
              placeholder="Buscar entre quem segue você"
              aria-label="Buscar entre quem segue você"
              className="flex-1 py-2.5 bg-transparent text-sm focus:outline-none"
            />
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-brand-slate hover:text-foreground">
              Cancelar
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
                : "Ninguém com esse nome entre quem segue você."}
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
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

      {value && hint && <span className="text-xs text-brand-slate">{hint}</span>}
    </div>
  );
}
