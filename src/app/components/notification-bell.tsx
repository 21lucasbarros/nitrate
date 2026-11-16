"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BellIcon, FilmReelIcon, TelevisionIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markNotificationsRead,
} from "@/lib/services/user-service";
import type { AppNotification } from "@/lib/types/user";
import { filmHref } from "@/utils/movie-link";
import { timeAgo } from "@/utils/format";
import { Poster } from "./ui/poster";

// o radar roda uma vez por dia; conferir a cada poucos minutos já é mais que suficiente
const POLL_MS = 5 * 60 * 1000;

const fetchNotifications = () => getMyNotifications();

/** Sino do header: avisos do Radar de Estreias (filmes da watchlist que estrearam). */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const list = useFetch(open ? "me" : null, fetchNotifications);

  // contador de não lidas: na montagem e de tempos em tempos
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      getUnreadNotificationsCount()
        .then(({ count }) => !cancelled && setUnread(count))
        .catch(() => {});
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // clicar fora fecha
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // abrir conta como ler, mas só depois de a lista chegar: assim ela ainda mostra quais eram novas
  const hasUnreadInList = list.data?.some((n) => !n.read) ?? false;
  useEffect(() => {
    if (hasUnreadInList) markNotificationsRead().catch(() => {});
  }, [hasUnreadInList]);

  const toggle = () => {
    if (!open) setUnread(0);
    setOpen(!open);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={unread > 0 ? `Notificações (${unread} novas)` : "Notificações"}
        aria-expanded={open}
        className="relative p-2 text-brand-slate hover:text-foreground transition-colors"
      >
        <BellIcon size={18} weight={open ? "fill" : "regular"} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-orange text-[10px] font-bold leading-4 text-brand-btn-text text-center tabular-nums">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(360px,calc(100vw-2rem))] rounded-md bg-surface ring-1 ring-foreground/10 shadow-2xl shadow-black/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/5">
            <p className="text-sm font-semibold">Radar de Estreias</p>
            <p className="text-xs text-brand-slate">Avisamos quando um filme da sua watchlist estreia.</p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {!list.data ? (
              <p className="px-4 py-6 text-sm text-brand-slate/70">{list.error ? "Não foi possível carregar." : "Carregando…"}</p>
            ) : list.data.length === 0 ? (
              <p className="px-4 py-6 text-sm text-brand-slate leading-relaxed">
                Nenhum aviso ainda. Adicione filmes que ainda vão estrear à sua watchlist e o Nitrate avisa aqui quando
                chegarem aos cinemas ou ao streaming.
              </p>
            ) : (
              <ul>
                {list.data.map((n) => (
                  <NotificationItem key={n.id} notification={n} onSelect={() => setOpen(false)} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification: n, onSelect }: { notification: AppNotification; onSelect: () => void }) {
  const cinema = n.type === "CINEMA";
  return (
    <li>
      <Link
        href={filmHref(n.movie)}
        onClick={onSelect}
        className={`flex gap-3 px-4 py-3 hover:bg-surface-strong transition-colors ${n.read ? "" : "bg-brand-orange/5"}`}
      >
        <div className="w-10 shrink-0">
          <Poster title={n.movie.title} posterPath={n.movie.posterPath} size="w185" sizes="40px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{n.movie.title}</span>{" "}
            {cinema ? "chegou aos cinemas." : "chegou ao streaming."}
          </p>
          {n.detail && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-slate">
              {cinema ? <FilmReelIcon size={12} /> : <TelevisionIcon size={12} />}
              {n.detail}
            </p>
          )}
          <p className="mt-1 text-[11px] text-brand-slate/60">{timeAgo(n.createdAt)}</p>
        </div>
        {!n.read && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-brand-orange" aria-label="Nova" />}
      </Link>
    </li>
  );
}
