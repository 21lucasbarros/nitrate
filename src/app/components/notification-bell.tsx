"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellIcon, FilmReelIcon, TelevisionIcon, UsersIcon } from "@phosphor-icons/react";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markNotificationsRead,
} from "@/lib/services/user-service";
import type { AppNotification } from "@/lib/types/user";
import { filmHref } from "@/utils/movie-link";
import { seriesHref } from "@/utils/series-link";
import { seasonLabel } from "@/types/series";
import { timeAgo } from "@/utils/format";
import { Avatar } from "./ui/avatar";
import { Poster } from "./ui/poster";
import { SideDrawer } from "./ui/side-drawer";

// o radar roda uma vez por dia e seguidores novos não são urgentes: a cada poucos minutos basta
const POLL_MS = 5 * 60 * 1000;

const fetchNotifications = () => getMyNotifications();

/** Sino do header: estreias da watchlist (Radar de Estreias), seguidores novos e convites de review em conjunto, numa gaveta à direita. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
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

  // abrir conta como ler, mas só depois de a lista chegar: assim ela ainda mostra quais eram novas
  const hasUnreadInList = list.data?.some((n) => !n.read) ?? false;
  useEffect(() => {
    if (hasUnreadInList) markNotificationsRead().catch(() => {});
  }, [hasUnreadInList]);

  const openDrawer = () => {
    setUnread(0);
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={openDrawer}
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

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        label="Notificações"
        title={
          <>
            <p className="font-semibold">Notificações</p>
            <p className="mt-0.5 text-xs text-brand-slate">Estreias da sua watchlist, novos seguidores e reviews em conjunto.</p>
          </>
        }
      >
        {!list.data ? (
          <p className="px-5 py-6 text-sm text-brand-slate/70">{list.error ? "Não foi possível carregar." : "Carregando…"}</p>
        ) : list.data.length === 0 ? (
          <div className="px-6 py-14 flex flex-col items-center text-center">
            <BellIcon size={36} weight="light" className="text-brand-slate/40" />
            <p className="mt-4 text-sm text-brand-slate leading-relaxed">
              Nenhum aviso ainda. Aqui aparecem os novos seguidores e, se você adicionar à watchlist filmes ou séries que
              ainda vão estrear, o Nitrate avisa quando chegarem aos cinemas, ao streaming ou forem ao ar, e também
              quando uma série que você acompanha ganhar temporada nova.
            </p>
          </div>
        ) : (
          <ul>
            {list.data.map((n) => (
              <NotificationItem key={n.id} notification={n} onSelect={() => setOpen(false)} />
            ))}
          </ul>
        )}
      </SideDrawer>
    </>
  );
}

function NotificationItem({ notification: n, onSelect }: { notification: AppNotification; onSelect: () => void }) {
  if (n.type === "FOLLOW") {
    return (
      <NotificationRow href={`/u/${n.actor.username}`} read={n.read} onSelect={onSelect}>
        <div className="w-10 shrink-0 flex justify-center">
          <Avatar name={n.actor.name} username={n.actor.username} avatar={n.actor.avatar} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{n.actor.name}</span> começou a seguir você.
          </p>
          <p className="mt-0.5 text-xs text-brand-slate truncate">@{n.actor.username}</p>
          <p className="mt-1 text-[11px] text-brand-slate/60">{timeAgo(n.createdAt)}</p>
        </div>
      </NotificationRow>
    );
  }

  if (n.type === "COLLAB_INVITE" || n.type === "COLLAB_ACCEPTED") {
    const invite = n.type === "COLLAB_INVITE";
    const c = n.collaboration;
    // filme ou registro de série: o pôster, o título ("Ruptura, Temporada 2") e os endereços mudam
    const title = n.series
      ? `${n.series.name}${c.seasonNumber !== null ? `, ${seasonLabel(c.seasonNumber, c.episodeNumber)}` : ""}`
      : n.movie.title;
    const poster = n.series ? n.series.posterPath : n.movie.posterPath;
    const inviteHref = `/convite/${c.series ? "serie/" : ""}${c.id}`;
    // o aceite leva à review de quem aceitou; o convite, à página de responder
    const href = invite || !c.inviteeReviewId
      ? inviteHref
      : `/u/${n.actor.username}/${c.series ? "series" : "reviews"}/${c.inviteeReviewId}`;
    return (
      <NotificationRow href={href} read={n.read} onSelect={onSelect}>
        <div className="relative w-10 shrink-0">
          <Poster title={title} posterPath={poster} size="w185" sizes="40px" />
          <span className="absolute -bottom-1.5 -right-1.5 rounded-full ring-2 ring-background">
            <Avatar name={n.actor.name} username={n.actor.username} avatar={n.actor.avatar} size="xs" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{n.actor.name}</span>{" "}
            {invite ? "marcou que assistiu " : "aceitou a review em conjunto de "}
            <span className="font-medium">{title}</span>
            {invite ? " com você." : "."}
          </p>
          {invite && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-brand-slate">
              <UsersIcon size={12} />
              {c.status === "PENDING"
                ? "Responder ao convite de review em conjunto"
                : c.status === "ACCEPTED"
                  ? "Você aceitou"
                  : "Você recusou"}
            </p>
          )}
          <p className="mt-1 text-[11px] text-brand-slate/60">{timeAgo(n.createdAt)}</p>
        </div>
      </NotificationRow>
    );
  }

  if (n.type === "SERIES_PREMIERE" || n.type === "SERIES_SEASON") {
    return (
      <NotificationRow href={seriesHref(n.series)} read={n.read} onSelect={onSelect}>
        <div className="w-10 shrink-0">
          <Poster title={n.series.name} posterPath={n.series.posterPath} size="w185" sizes="40px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">
            <span className="font-medium">{n.series.name}</span>{" "}
            {n.type === "SERIES_SEASON" ? `ganhou a ${n.seasonNumber}ª temporada.` : "estreou."}
          </p>
          {n.detail && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-brand-slate">
              <TelevisionIcon size={12} />
              {n.detail}
            </p>
          )}
          <p className="mt-1 text-[11px] text-brand-slate/60">{timeAgo(n.createdAt)}</p>
        </div>
      </NotificationRow>
    );
  }

  const cinema = n.type === "CINEMA";
  return (
    <NotificationRow href={filmHref(n.movie)} read={n.read} onSelect={onSelect}>
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
    </NotificationRow>
  );
}

function NotificationRow({ href, read, onSelect, children }: {
  href: string;
  read: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onSelect}
        className={`flex gap-3 px-5 py-3.5 hover:bg-surface-strong transition-colors ${read ? "" : "bg-brand-orange/5"}`}
      >
        {children}
        {!read && <span className="mt-1.5 w-2 h-2 shrink-0 rounded-full bg-brand-orange" aria-label="Nova" />}
      </Link>
    </li>
  );
}
