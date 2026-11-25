"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowsClockwiseIcon,
  CheckIcon,
  CircleNotchIcon,
  GlobeHemisphereWestIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { BadgeChip, BadgeIcon } from "@/app/components/badges";
import { listHref } from "@/app/components/list-card";
import { ListEditor } from "@/app/components/list-editor";
import { DeleteConfirmBar } from "@/app/components/ui/delete-confirm-bar";
import { Avatar } from "@/app/components/ui/avatar";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { SearchInput } from "@/app/components/ui/search-input";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useFetch } from "@/lib/hooks/use-fetch";
import {
  awardBadge,
  createOfficialList,
  deleteOfficialList,
  getAdminStats,
  getBadgeAwards,
  getBadgeCatalog,
  getOfficialListAdmin,
  getOfficialListsAdmin,
  getUserBadges,
  revokeBadge,
  updateOfficialList,
} from "@/lib/services/admin-service";
import { searchUsers } from "@/lib/services/user-service";
import type { AdminDay, AdminStats } from "@/lib/types/admin";
import type { MovieList, MovieListRequest } from "@/lib/types/list";
import type { Badge, UserSummary } from "@/lib/types/user";
import { timeAgo } from "@/utils/format";

const TABS = [
  { id: "geral", label: "Visão geral" },
  { id: "selos", label: "Selos" },
  { id: "listas", label: "Listas do Nitrate" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const NOTE_MAX = 140; // igual ao BadgeService

const input =
  "w-full px-3 py-2.5 bg-transparent border border-foreground/15 rounded-md text-sm text-foreground placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue";

// o useFetch precisa de um argumento: "1" busca, null não
const fetchStats = () => getAdminStats();
const fetchCatalog = () => getBadgeCatalog();
const fetchAwards = () => getBadgeAwards();
const fetchOfficialLists = () => getOfficialListsAdmin();

// o editor de listas salva na conta do Nitrate em vez da de quem está logado
const saveOfficialList = (data: MovieListRequest, list: MovieList | null) =>
  list ? updateOfficialList(list.id, data) : createOfficialList(data);

export default function AdminPage() {
  const { status, user } = useAuth();
  const [tab, setTab] = useState<TabId>("geral");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[1100px] mx-auto">
        {status !== "authenticated" ? (
          <Loading />
        ) : !user.admin ? (
          // quem não é admin vê o mesmo que numa página que não existe
          <div className="py-32 text-center">
            <h1 className="text-2xl font-semibold">Página não encontrada.</h1>
            <Link href="/" className="mt-3 inline-block text-brand-slate hover:text-foreground">Voltar para o início</Link>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold tracking-tight">Painel</h1>
            <div
              role="tablist"
              aria-label="Seções do painel"
              className="mt-6 flex gap-6 shadow-[inset_0_-1px_0_rgb(236_237_238/0.1)]"
            >
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`pb-3 text-sm border-b-2 transition-colors ${tab === t.id ? "border-brand-orange text-foreground" : "border-transparent text-brand-slate hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <section role="tabpanel" className="pt-8">
              {tab === "geral" ? <Overview /> : tab === "selos" ? <Badges /> : <OfficialLists />}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ visão geral */

function Overview() {
  const stats = useFetch("1", fetchStats);

  if (!stats.data) {
    return stats.error ? <ErrorMessage error={stats.error} onRetry={stats.reload} /> : <Loading />;
  }

  const { users, content } = stats.data;
  const comments = content.reviewComments + content.listComments;

  return (
    <div className="flex flex-col gap-12">
      <div>
        <SectionHeading
          title="Pessoas"
          action={
            <button
              onClick={stats.reload}
              disabled={stats.loading}
              className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground disabled:opacity-50"
            >
              <ArrowsClockwiseIcon size={14} className={stats.loading ? "animate-spin" : ""} /> Atualizar
            </button>
          }
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Contas" value={users.total} hint={`+${fmt(users.new7d)} na semana · +${fmt(users.new30d)} no mês`} highlight />
          <StatCard label="Ativas hoje" value={users.active1d} hint="usaram logadas nas últimas 24 h" />
          <StatCard label="Ativas na semana" value={users.active7d} hint={pct(users.active7d, users.total)} />
          <StatCard label="Ativas no mês" value={users.active30d} hint={pct(users.active30d, users.total)} />
        </div>
      </div>

      <div>
        <SectionHeading title="Conteúdo" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Registros no diário" value={content.reviews} hint={`+${fmt(content.reviews7d)} na semana · +${fmt(content.reviews30d)} no mês`} highlight />
          <StatCard label="Reviews escritas" value={content.writtenReviews} hint={pct(content.writtenReviews, content.reviews, "dos registros")} />
          <StatCard label="Curtidas em reviews" value={content.reviewLikes} />
          <StatCard label="Comentários" value={comments} hint={`${fmt(content.reviewComments)} em reviews · ${fmt(content.listComments)} em listas`} />
          <StatCard label="Listas" value={content.lists} hint={`${fmt(content.listLikes)} curtidas`} />
          <StatCard label="Seguidas" value={content.follows} />
          <StatCard label="Na watchlist" value={content.watchlist} />
          <StatCard label="Filmes no acervo" value={content.movies} hint={`${fmt(content.badges)} selos concedidos`} />
        </div>
      </div>

      <ActivityChart days={stats.data.days} />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
        <RecentUsers users={stats.data.recentUsers} />
        <TopReviewers users={stats.data.topReviewers} />
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, highlight }: { label: string; value: number; hint?: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-surface ring-1 ring-foreground/5 p-4">
      <p className="text-xs text-brand-slate">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${highlight ? "text-brand-orange" : ""}`}>{fmt(value)}</p>
      {hint && <p className="mt-1 text-xs text-brand-slate/70 leading-snug">{hint}</p>}
    </div>
  );
}

const METRICS = [
  { id: "signups", label: "Cadastros" },
  { id: "reviews", label: "Registros" },
  { id: "reviewers", label: "Pessoas registrando" },
] as const satisfies readonly { id: keyof AdminDay; label: string }[];

type MetricId = (typeof METRICS)[number]["id"];

function ActivityChart({ days }: { days: AdminDay[] }) {
  const [metric, setMetric] = useState<MetricId>("reviews");
  const values = days.map((d) => d[metric]);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);
  const label = METRICS.find((m) => m.id === metric)!.label;

  return (
    <div>
      <SectionHeading
        title="Últimos 30 dias"
        action={
          <div className="flex gap-1">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                aria-pressed={metric === m.id}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${metric === m.id ? "bg-surface-strong text-foreground" : "text-brand-slate hover:text-foreground"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        }
      />
      <p className="text-sm text-brand-slate">
        {metric === "reviewers" ? (
          <>pico de <span className="text-foreground font-semibold tabular-nums">{fmt(max)}</span> pessoas num dia</>
        ) : (
          <><span className="text-foreground font-semibold tabular-nums">{fmt(total)}</span> {label.toLowerCase()} no período</>
        )}
      </p>
      <div className="mt-4 h-40 flex items-end gap-[3px]" role="img" aria-label={`${label} por dia nos últimos 30 dias`}>
        {days.map((d) => {
          const value = d[metric];
          return (
            <div key={d.date} className="group relative flex-1 h-full flex items-end">
              <div
                className={`w-full rounded-t-sm transition-colors ${value > 0 ? "bg-brand-orange/70 group-hover:bg-brand-orange" : "bg-foreground/10"}`}
                style={{ height: value > 0 ? `${Math.max(4, (value / max) * 100)}%` : "2px" }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-surface-strong px-2 py-1 text-[11px] text-foreground opacity-0 group-hover:opacity-100 transition-opacity z-10">
                {dayLabel(d.date)}: <span className="font-semibold tabular-nums">{value}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-brand-slate/60">
        <span>{dayLabel(days[0].date)}</span>
        <span>hoje</span>
      </div>
    </div>
  );
}

function RecentUsers({ users }: { users: AdminStats["recentUsers"] }) {
  return (
    <div>
      <SectionHeading title="Cadastros recentes" />
      {users.length === 0 ? (
        <p className="text-sm text-brand-slate">Ninguém ainda.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/5">
          {users.map(({ user, createdAt, lastSeenAt, reviews }) => (
            <li key={user.username}>
              <UserRow user={user}>
                <span className="text-right text-xs text-brand-slate leading-relaxed">
                  entrou {timeAgo(createdAt)}
                  <br />
                  <span className="text-brand-slate/60">
                    {reviews} {reviews === 1 ? "registro" : "registros"}
                    {lastSeenAt && ` · visto ${timeAgo(lastSeenAt)}`}
                  </span>
                </span>
              </UserRow>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopReviewers({ users }: { users: AdminStats["topReviewers"] }) {
  return (
    <div>
      <SectionHeading title="Quem mais registrou no mês" />
      {users.length === 0 ? (
        <p className="text-sm text-brand-slate">Nenhum registro nos últimos 30 dias.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-foreground/5">
          {users.map(({ user, reviews }, i) => (
            <li key={user.username} className="flex items-center gap-3">
              <span className="w-5 text-right text-xs tabular-nums text-brand-slate/60">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <UserRow user={user}>
                  <span className="text-sm font-semibold tabular-nums">{fmt(reviews)}</span>
                </UserRow>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function UserRow({ user, children }: { user: UserSummary; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Link href={`/u/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1 group">
        <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium group-hover:text-brand-orange transition-colors">{user.name}</span>
          <span className="block truncate text-xs text-brand-slate">@{user.username}</span>
        </span>
      </Link>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ selos */

function Badges() {
  const catalog = useFetch("1", fetchCatalog);
  const awards = useFetch("1", fetchAwards);
  const [selected, setSelected] = useState<UserSummary | null>(null);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="min-w-0">
        <SectionHeading title="Dar um selo" />
        {selected ? (
          catalog.data ? (
            <UserBadgeEditor
              key={selected.username}
              user={selected}
              catalog={catalog.data}
              onClose={() => setSelected(null)}
              onChange={awards.reload}
            />
          ) : catalog.error ? (
            <ErrorMessage error={catalog.error} onRetry={catalog.reload} />
          ) : (
            <Loading />
          )
        ) : (
          <UserPicker onPick={setSelected} />
        )}
      </div>

      <aside className="min-w-0">
        <SectionHeading title="Selos concedidos" count={awards.data?.length} />
        {!awards.data ? (
          awards.error ? <ErrorMessage error={awards.error} onRetry={awards.reload} /> : <Loading />
        ) : awards.data.length === 0 ? (
          <p className="text-sm text-brand-slate">Nenhum selo concedido ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {awards.data.map(({ user, badge }) => (
              <li key={`${user.username}|${badge.type}`}>
                <button
                  onClick={() => setSelected(user)}
                  className="w-full flex items-center gap-3 rounded-md px-2 py-2 -mx-2 text-left hover:bg-surface transition-colors"
                >
                  <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    {badge.note && <span className="block truncate text-xs text-brand-slate">{badge.note}</span>}
                  </span>
                  <BadgeChip badge={badge} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function UserPicker({ onPick }: { onPick: (user: UserSummary) => void }) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 250);
  const results = useFetch(debounced.length >= 2 ? debounced : null, searchUsers);

  return (
    <div>
      <SearchInput
        autoFocus
        value={query}
        onChange={setQuery}
        pending={results.loading}
        label="Buscar perfil"
        placeholder="Buscar pelo nome ou @"
      />
      {debounced.length >= 2 && (
        <div className="mt-3">
          {!results.data ? (
            results.error ? <ErrorMessage error={results.error} onRetry={results.reload} /> : <Loading />
          ) : results.data.length === 0 ? (
            <p className="py-4 text-sm text-brand-slate">Ninguém encontrado com “{debounced}”.</p>
          ) : (
            <ul className="flex flex-col">
              {results.data.map((user) => (
                <li key={user.username}>
                  <button
                    onClick={() => onPick(user)}
                    className="w-full flex items-center gap-3 rounded-md px-2 py-2 -mx-2 text-left hover:bg-surface transition-colors"
                  >
                    <Avatar name={user.name} username={user.username} avatar={user.avatar} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{user.name}</span>
                      <span className="block truncate text-xs text-brand-slate">@{user.username}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {debounced.length < 2 && (
        <p className="mt-3 text-sm text-brand-slate/70">Encontre a pessoa e escolha o selo. Dá para escrever uma nota, como “Primeiro investidor do Nitrate”.</p>
      )}
    </div>
  );
}

function UserBadgeEditor({
  user,
  catalog,
  onClose,
  onChange,
}: {
  user: UserSummary;
  catalog: Badge[];
  onClose: () => void;
  onChange: () => void;
}) {
  const owned = useFetch(user.username, getUserBadges);
  const [editing, setEditing] = useState<string | null>(null); // tipo do selo com o formulário aberto

  const ownedByType = new Map((owned.data ?? []).map((b) => [b.type, b]));

  const afterSave = () => {
    setEditing(null);
    owned.reload();
    onChange();
  };

  return (
    <div>
      <div className="flex items-center gap-3 rounded-lg bg-surface ring-1 ring-foreground/5 p-3">
        <Avatar name={user.name} username={user.username} avatar={user.avatar} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/u/${user.username}`} className="block truncate font-medium hover:text-brand-orange">{user.name}</Link>
          <p className="truncate text-xs text-brand-slate">@{user.username}</p>
        </div>
        <button onClick={onClose} aria-label="Escolher outra pessoa" title="Escolher outra pessoa" className="p-2 text-brand-slate hover:text-foreground">
          <XIcon size={16} />
        </button>
      </div>

      {owned.error ? (
        <div className="mt-6"><ErrorMessage error={owned.error} onRetry={owned.reload} /></div>
      ) : !owned.data ? (
        <Loading />
      ) : (
        <ul className="mt-6 grid sm:grid-cols-2 gap-2">
          {catalog.map((badge) => {
            const current = ownedByType.get(badge.type);
            const open = editing === badge.type;
            return (
              <li
                key={badge.type}
                className={`rounded-lg ring-1 transition-colors ${open ? "sm:col-span-2 ring-brand-orange/40 bg-surface" : current ? "ring-foreground/15 bg-surface" : "ring-foreground/5 hover:ring-foreground/15"}`}
              >
                <button
                  onClick={() => setEditing(open ? null : badge.type)}
                  aria-expanded={open}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <BadgeIcon type={badge.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{badge.label}</span>
                    <span className="block text-xs text-brand-slate truncate">{current?.note ?? badge.description}</span>
                  </span>
                  {current && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-emerald">
                      <CheckIcon size={12} weight="bold" /> Tem
                    </span>
                  )}
                </button>
                {open && (
                  <BadgeForm username={user.username} badge={badge} current={current} onSaved={afterSave} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BadgeForm({
  username,
  badge,
  current,
  onSaved,
}: {
  username: string;
  badge: Badge;
  current: Badge | undefined;
  onSaved: () => void;
}) {
  const [note, setNote] = useState(current?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(() => awardBadge(username, badge.type, note));
      }}
      className="px-3 pb-3 flex flex-col gap-3"
    >
      <label className="flex flex-col gap-1.5">
        <span className="flex justify-between text-xs text-brand-slate">
          <span>Nota (opcional), aparece junto do selo</span>
          <span className="tabular-nums text-brand-slate/60">{note.length}/{NOTE_MAX}</span>
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={NOTE_MAX}
          placeholder={badge.description}
          autoFocus
          className={input}
        />
      </label>
      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
          <WarningIcon size={16} /> {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60 transition-colors"
        >
          {busy ? "Salvando…" : current ? "Salvar nota" : "Dar o selo"}
        </button>
        {current && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => revokeBadge(username, badge.type))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-brand-crimson hover:bg-brand-crimson/10 disabled:opacity-60 transition-colors"
          >
            <TrashIcon size={14} /> Remover selo
          </button>
        )}
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ listas do nitrate */

function OfficialLists() {
  const lists = useFetch("1", fetchOfficialLists);
  // null: fechado; "nova": criando; uma lista: editando (completa, com todos os filmes)
  const [editing, setEditing] = useState<MovieList | "nova" | null>(null);
  const [opening, setOpening] = useState<number | null>(null); // id da lista sendo carregada para editar
  const [confirming, setConfirming] = useState<number | null>(null); // id da lista com a confirmação de apagar
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const edit = async (id: number) => {
    setError(null);
    setOpening(id);
    try {
      setEditing(await getOfficialListAdmin(id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível abrir a lista.");
    } finally {
      setOpening(null);
    }
  };

  const remove = async (id: number) => {
    setError(null);
    setDeleting(true);
    try {
      await deleteOfficialList(id);
      setConfirming(null);
      lists.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível apagar a lista.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <SectionHeading
        title="Listas do Nitrate"
        count={lists.data?.length}
        action={
          <button
            onClick={() => setEditing("nova")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
          >
            <PlusIcon size={14} weight="bold" /> Nova lista
          </button>
        }
      />
      <p className="-mt-1 mb-6 text-sm text-brand-slate/70">
        Feitas como o perfil <Link href="/u/nitrate" className="text-foreground hover:text-brand-orange">@nitrate</Link>.
        As públicas aparecem na home de todo mundo; as privadas são rascunhos e só aparecem aqui.
      </p>

      {error && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-brand-crimson">
          <WarningIcon size={16} /> {error}
        </p>
      )}

      {!lists.data ? (
        lists.error ? <ErrorMessage error={lists.error} onRetry={lists.reload} /> : <Loading />
      ) : lists.data.length === 0 ? (
        <p className="text-sm text-brand-slate">Nenhuma lista ainda. Comece por “Os filmes para ver antes de Vingadores”.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-foreground/5">
          {lists.data.map((list) => (
            <li key={list.id} className="py-3">
              {confirming === list.id ? (
                <DeleteConfirmBar
                  title={`Apagar a lista ${list.name}?`}
                  busy={deleting}
                  onKeep={() => setConfirming(null)}
                  onConfirm={() => remove(list.id)}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={listHref(list)} className="block truncate text-sm font-medium hover:text-brand-orange transition-colors">
                      {list.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-brand-slate">
                      {list.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-brand-emerald">
                          <GlobeHemisphereWestIcon size={12} /> Pública
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <LockSimpleIcon size={12} /> Rascunho
                        </span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{list.filmsCount} {list.filmsCount === 1 ? "filme" : "filmes"}</span>
                      <span aria-hidden="true">·</span>
                      <span>atualizada {timeAgo(list.updatedAt)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => edit(list.id)}
                    disabled={opening !== null}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-brand-slate hover:text-foreground hover:bg-surface disabled:opacity-60 transition-colors"
                  >
                    {opening === list.id ? <CircleNotchIcon size={14} className="animate-spin" /> : <PencilSimpleIcon size={14} />} Editar
                  </button>
                  <button
                    onClick={() => {
                      setError(null);
                      setConfirming(list.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-brand-crimson hover:bg-brand-crimson/10 transition-colors"
                  >
                    <TrashIcon size={14} /> Apagar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ListEditor
        open={editing !== null}
        list={editing === "nova" ? null : editing}
        save={saveOfficialList}
        official
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          lists.reload();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ comum */

function Loading() {
  return (
    <div className="py-16 flex justify-center text-brand-slate/40">
      <CircleNotchIcon size={28} className="animate-spin" />
    </div>
  );
}

function ErrorMessage({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const forbidden = error instanceof ApiError && (error.status === 403 || error.status === 401);
  return (
    <div className="py-8 text-center text-sm text-brand-slate">
      <p>
        {forbidden
          ? "A API não reconheceu esta conta como admin. Confira o ADMIN_EMAILS no backend."
          : "Não foi possível carregar."}
      </p>
      {!forbidden && (
        <button onClick={onRetry} className="mt-2 text-foreground underline underline-offset-4">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

const numberFormatter = new Intl.NumberFormat("pt-BR");

function fmt(n: number): string {
  return numberFormatter.format(n);
}

/** "12% das contas" */
function pct(part: number, total: number, of = "das contas"): string {
  if (total === 0) return "";
  return `${Math.round((part / total) * 100)}% ${of}`;
}

/** "20 nov." a partir de "2026-11-20" (sem converter fuso, é só uma data) */
function dayLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
