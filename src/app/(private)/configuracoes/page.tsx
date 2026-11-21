"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftIcon,
  AtIcon,
  CameraIcon,
  CheckIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  ImageIcon,
  InstagramLogoIcon,
  ShieldStarIcon,
  SparkleIcon,
  TrashIcon,
  WarningIcon,
  XCircleIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { AvatarCropper } from "@/app/components/avatar-cropper";
import { CoverPicker } from "@/app/components/cover-picker";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { saveToken } from "@/lib/auth-storage";
import { useUsernameAvailability } from "@/lib/hooks/use-username-availability";
import { usernameSchema } from "@/lib/schemas/auth-schemas";
import {
  changeMyEmail,
  changeMyPassword,
  deleteMyAccount,
  exportMyData,
  removeMyAvatar,
  removeMyCover,
  updateMyProfile,
  uploadMyAvatar,
} from "@/lib/services/user-service";
import type { UserProfile } from "@/lib/types/user";
import { backdropUrl } from "@/utils/poster";
import { sameUsername } from "@/utils/username";

const NAME_MAX = 60;
const BIO_MAX = 300; // iguais aos limites do backend (AccountService)

const input =
  "w-full px-3 py-2.5 bg-transparent border border-foreground/15 rounded-md text-sm text-foreground placeholder:text-brand-slate/50 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue";
const label = "text-xs uppercase tracking-[0.14em] text-brand-slate";

export default function SettingsPage() {
  const { status, user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Header />
      <main className="pt-24 sm:pt-32 pb-24 px-4 sm:px-6 max-w-[720px] mx-auto">
        {status !== "authenticated" ? (
          <div className="py-24 flex justify-center text-brand-slate/40">
            <CircleNotchIcon size={28} className="animate-spin" />
          </div>
        ) : (
          <>
            <Link href={`/u/${user.username}`} className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground">
              <ArrowLeftIcon size={14} /> Voltar ao perfil
            </Link>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Configurações</h1>
            {/* no celular o atalho do cabeçalho some, então o painel fica acessível por aqui */}
            {user.admin && (
              <Link href="/admin" className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-orange hover:underline underline-offset-4">
                <ShieldStarIcon size={14} weight="fill" /> Painel de admin
              </Link>
            )}

            {/* key: depois de salvar, o formulário recomeça com os dados novos */}
            <ProfileForm key={`${user.name}|${user.username}|${user.bio}|${user.twitter}|${user.instagram}`} user={user} />
            <TasteSection />
            <EmailSection current={user.email ?? null} />
            <PasswordSection />
            <DataSection />
            <DeleteAccountSection username={user.username} />
          </>
        )}
      </main>
    </div>
  );
}

function ProfileForm({ user }: { user: UserProfile }) {
  const { refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio ?? "");
  const [twitter, setTwitter] = useState(user.twitter ?? "");
  const [instagram, setInstagram] = useState(user.instagram ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameChanged = username !== user.username;
  // só trocar maiúsculas/minúsculas do próprio @: a API diria "em uso" (por você mesmo)
  const sameAsMine = sameUsername(username, user.username);
  const usernameError = usernameChanged ? usernameSchema.safeParse(username).error?.issues[0]?.message : undefined;
  const usernameStatus = useUsernameAvailability(sameAsMine ? "" : username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError || usernameStatus === "taken") return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateMyProfile({ name, username, bio, twitter, instagram });
      setSaved(true);
      refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError("Esse nome de usuário já está em uso.");
      else setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <SectionHeading title="Perfil" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <AvatarPicker user={user} previewName={name || user.name} />
        <CoverSetting user={user} />
        <label className="flex flex-col gap-2">
          <span className={label}>Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} required className={input} />
        </label>

        <UsernameInput
          value={username}
          onChange={setUsername}
          error={usernameError}
          status={sameAsMine ? "idle" : usernameStatus}
          changed={usernameChanged}
        />

        <label className="flex flex-col gap-2">
          <span className="flex justify-between">
            <span className={label}>Bio</span>
            <span className={`text-xs tabular-nums ${bio.length > BIO_MAX - 30 ? "text-brand-orange" : "text-brand-slate/60"}`}>
              {bio.length}/{BIO_MAX}
            </span>
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={BIO_MAX}
            rows={3}
            placeholder="Conte que tipo de filme você gosta."
            className={`${input} resize-none leading-relaxed`}
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-6">
          <HandleInput label="X / Twitter" icon={<XLogoIcon size={16} />} value={twitter} onChange={setTwitter} maxLength={15} />
          <HandleInput label="Instagram" icon={<InstagramLogoIcon size={16} />} value={instagram} onChange={setInstagram} maxLength={30} />
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
            <WarningIcon size={16} /> {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy || !!usernameError || usernameStatus === "taken"}
            className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Salvando…" : "Salvar perfil"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-brand-emerald">
              <CheckIcon size={16} weight="bold" /> Salvo
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

const AVATAR_MAX_BYTES = 15 * 1024 * 1024; // fotos de celular passam fácil de 5 MB; o recorte reduz antes do envio

/** a foto é salva assim que enquadrada, sem esperar o "Salvar perfil" */
function AvatarPicker({ user, previewName }: { user: UserProfile; previewName: string }) {
  const { refreshUser } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null); // foto escolhida, ainda sendo enquadrada

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar a foto. Tente outra imagem.");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // escolher o mesmo arquivo de novo dispara o change
    if (!file) return;
    // o servidor confere de novo; aqui é só para não abrir um arquivo enorme no editor
    if (!file.type.startsWith("image/")) {
      setError("Escolha uma imagem (JPG ou PNG).");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError("Imagem grande demais. Use uma de até 15 MB.");
      return;
    }
    setError(null);
    setPending(file);
  };

  const handleCropped = (image: Blob) => {
    setPending(null);
    run(() => uploadMyAvatar(image));
  };

  const handleUnreadable = () => {
    setPending(null);
    setError("Não foi possível abrir essa imagem. Tente outra.");
  };

  return (
    <div className="flex items-center gap-5">
      <span className="relative">
        <Avatar name={previewName} username={user.username} avatar={user.avatar} size="lg" />
        {busy && (
          <span className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center">
            <CircleNotchIcon size={22} className="animate-spin" />
          </span>
        )}
      </span>
      <div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-foreground/15 text-sm hover:bg-surface disabled:opacity-60 transition-colors"
          >
            <CameraIcon size={16} /> {user.avatar ? "Trocar foto" : "Enviar foto"}
          </button>
          {user.avatar && (
            <button
              type="button"
              onClick={() => run(removeMyAvatar)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-crimson disabled:opacity-60 transition-colors"
            >
              <TrashIcon size={15} /> Remover
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={handleFile} className="hidden" />
        {error ? (
          <p role="alert" className="mt-1.5 text-xs text-brand-crimson">{error}</p>
        ) : (
          <p className="mt-1.5 text-xs text-brand-slate/70">JPG ou PNG. Você escolhe o enquadramento antes de salvar.</p>
        )}
      </div>

      <Modal open={pending !== null} onClose={() => setPending(null)} label="Enquadrar foto">
        {pending && (
          <AvatarCropper file={pending} onCancel={() => setPending(null)} onConfirm={handleCropped} onError={handleUnreadable} />
        )}
      </Modal>
    </div>
  );
}

/** o fundo do topo do perfil: uma cena de filme, salva assim que escolhida (como a foto) */
function CoverSetting({ user }: { user: UserProfile }) {
  const { refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = backdropUrl(user.cover?.path, "w780");

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await removeMyCover();
      refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível remover o fundo. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
      <span className="relative w-full sm:w-40 aspect-video shrink-0 overflow-hidden rounded-md bg-surface ring-1 ring-foreground/10">
        {preview ? (
          <Image src={preview} alt="" fill sizes="(min-width: 640px) 160px, 100vw" className="object-cover" />
        ) : (
          <ImageIcon size={22} className="absolute inset-0 m-auto text-foreground/25" />
        )}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-foreground/15 text-sm hover:bg-surface disabled:opacity-60 transition-colors"
          >
            <ImageIcon size={16} /> {user.cover ? "Trocar fundo" : "Escolher fundo"}
          </button>
          {user.cover && (
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-brand-crimson disabled:opacity-60 transition-colors"
            >
              <TrashIcon size={15} /> Remover
            </button>
          )}
        </div>
        {error ? (
          <p role="alert" className="mt-1.5 text-xs text-brand-crimson">{error}</p>
        ) : (
          <p className="mt-1.5 text-xs text-brand-slate/70">
            {user.cover
              ? `Uma cena de ${user.cover.title}${user.cover.year ? ` (${user.cover.year})` : ""}.`
              : "O fundo do topo do seu perfil. Sem escolher, vale a cena do seu primeiro filme favorito."}
          </p>
        )}
      </div>

      <CoverPicker
        open={open}
        onClose={() => setOpen(false)}
        current={user.cover}
        onSaved={() => {
          setOpen(false);
          refreshUser();
        }}
      />
    </div>
  );
}

/** o @ do Nitrate: mesmas regras do cadastro, com a disponibilidade conferida enquanto digita */
function UsernameInput({ value, onChange, error, status, changed }: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  status: ReturnType<typeof useUsernameAvailability>;
  changed: boolean;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={`${label} flex items-center gap-1.5`}><AtIcon size={16} /> Nome de usuário</span>
      <div className="flex items-center rounded-md border border-foreground/15 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue">
        <span className="pl-3 text-sm text-brand-slate">@</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
          maxLength={20}
          required
          autoCapitalize="none"
          autoComplete="username"
          spellCheck={false}
          className="flex-1 min-w-0 pl-1 pr-3 py-2.5 bg-transparent text-sm placeholder:text-brand-slate/50 focus:outline-none"
        />
        <span className="pr-3 flex items-center">
          {status === "checking" && <CircleNotchIcon size={16} className="animate-spin text-brand-slate/50" />}
          {status === "available" && <CheckCircleIcon size={16} weight="fill" className="text-brand-emerald" />}
          {status === "taken" && <XCircleIcon size={16} weight="fill" className="text-brand-crimson" />}
        </span>
      </div>
      {error ? (
        <span className="text-xs text-brand-crimson">{error}</span>
      ) : status === "taken" ? (
        <span className="text-xs text-brand-crimson">Esse nome de usuário já está em uso.</span>
      ) : changed ? (
        <span className="text-xs text-brand-slate/70">
          Seu perfil passa a ficar em <span className="font-mono text-foreground/80">/u/{value}</span>. Links antigos para o @ anterior deixam de funcionar.
        </span>
      ) : null}
    </label>
  );
}

/** campo do @ de uma rede social; aceita colar o link do perfil (o backend extrai o @) */
function HandleInput({ label: text, icon, value, onChange, maxLength }: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={`${label} flex items-center gap-1.5`}>{icon} {text}</span>
      <div className="flex items-center rounded-md border border-foreground/15 focus-within:border-brand-blue focus-within:ring-1 focus-within:ring-brand-blue">
        <span className="pl-3 text-sm text-brand-slate">@</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/^@/, ""))}
          // o link colado é maior que o @, então o limite do campo é só uma folga
          maxLength={maxLength + 40}
          placeholder="usuario"
          autoCapitalize="none"
          spellCheck={false}
          className="flex-1 min-w-0 pl-1 pr-3 py-2.5 bg-transparent text-sm placeholder:text-brand-slate/50 focus:outline-none"
        />
      </div>
    </label>
  );
}

/** atalho para refazer o questionário de gostos do cadastro */
function TasteSection() {
  return (
    <section className="mt-14">
      <SectionHeading title="Seus gostos" />
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-brand-slate">
          O que você curte guia as recomendações enquanto o seu diário ainda é pequeno. Mudou de ideia? Responda de novo.
        </p>
        <Link
          href="/comecar?depois=/configuracoes"
          className="sm:ml-auto shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-surface-strong text-sm font-semibold text-foreground hover:bg-foreground/15 transition-colors"
        >
          <SparkleIcon size={14} weight="fill" className="text-brand-orange" /> Refazer o questionário
        </Link>
      </div>
    </section>
  );
}

/** troca o e-mail confirmando com a senha; as outras sessões caem e esta recebe um token novo */
function EmailSection({ current }: { current: string | null }) {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typed = email.trim().toLowerCase();
  // o servidor confere de novo; aqui é só para não mandar o óbvio
  const invalid = typed.length > 0 && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(typed);
  const same = current !== null && typed === current.toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid || same) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const response = await changeMyEmail(typed, password);
      saveToken(response.token);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setDone(true);
      refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError("Já existe uma conta com esse e-mail.");
      else setError(err instanceof ApiError ? err.message : "Não foi possível trocar o e-mail. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14">
      <SectionHeading title="E-mail" />
      {current && (
        <p className="-mt-1 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-slate">
          <EnvelopeSimpleIcon size={16} className="shrink-0" />
          E-mail atual: <span className="text-foreground break-all">{current}</span>
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <label className="flex flex-col gap-2">
            <span className={label}>Novo e-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setDone(false);
                setEmail(e.target.value);
              }}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              className={input}
            />
            {invalid && <span className="text-xs text-brand-crimson">Informe um e-mail válido.</span>}
            {same && <span className="text-xs text-brand-crimson">Esse já é o e-mail da sua conta.</span>}
          </label>
          <label className="flex flex-col gap-2">
            <span className={label}>Sua senha</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setDone(false);
                  setPassword(e.target.value);
                }}
                autoComplete="current-password"
                required
                className={`${input} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-slate/50 hover:text-foreground focus:outline-none focus-visible:text-brand-blue transition-colors"
              >
                {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </label>
        </div>
        <p className="-mt-2 text-xs text-brand-slate/70">
          Você passa a entrar com o e-mail novo. O antigo recebe um aviso, e as sessões em outros aparelhos são encerradas.
        </p>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
            <WarningIcon size={16} /> {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy || !typed || !password || invalid || same}
            className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Salvando…" : "Trocar e-mail"}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 text-sm text-brand-emerald">
              <CheckIcon size={16} weight="bold" /> E-mail alterado
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/** troca a senha sabendo a atual; as outras sessões caem e esta recebe um token novo */
function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = confirmation.length > 0 && next !== confirmation;
  const tooShort = next.length > 0 && next.length < 8; // igual ao AuthService

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || tooShort) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const response = await changeMyPassword(current, next);
      saveToken(response.token);
      setCurrent("");
      setNext("");
      setConfirmation("");
      setShowPassword(false);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível trocar a senha. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const field = (text: string, value: string, set: (v: string) => void, autoComplete: string, hint?: string) => (
    <label className="flex flex-col gap-2">
      <span className={label}>{text}</span>
      <input
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={(e) => {
          setDone(false);
          set(e.target.value);
        }}
        autoComplete={autoComplete}
        required
        className={input}
      />
      {hint && <span className="text-xs text-brand-crimson">{hint}</span>}
    </label>
  );

  return (
    <section className="mt-14">
      <SectionHeading
        title="Senha"
        action={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            className="inline-flex items-center gap-1.5 text-sm text-brand-slate hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
            {showPassword ? "Ocultar" : "Mostrar"}
          </button>
        }
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {field("Senha atual", current, setCurrent, "current-password")}
        <div className="grid sm:grid-cols-2 gap-6">
          {field("Nova senha", next, setNext, "new-password", tooShort ? "Use pelo menos 8 caracteres." : undefined)}
          {field("Confirme a nova senha", confirmation, setConfirmation, "new-password", mismatch ? "As senhas não coincidem." : undefined)}
        </div>
        <p className="-mt-2 text-xs text-brand-slate/70">
          Ao trocar, você continua conectado aqui, mas as sessões em outros aparelhos são encerradas.
          Esqueceu a atual? <Link href="/esqueci-senha" className="text-brand-blue hover:text-brand-blue/80">Redefina por e-mail</Link>.
        </p>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
            <WarningIcon size={16} /> {error}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy || !current || !next || !confirmation || mismatch || tooShort}
            className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Salvando…" : "Trocar senha"}
          </button>
          {done && (
            <span className="flex items-center gap-1.5 text-sm text-brand-emerald">
              <CheckIcon size={16} weight="bold" /> Senha alterada
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/** LGPD, art. 18: a pessoa pode ter uma cópia de tudo o que guardamos sobre ela */
function DataSection() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nitrate-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Não foi possível gerar o arquivo agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14">
      <SectionHeading title="Seus dados" />
      <p className="text-sm text-brand-slate leading-relaxed">
        Baixe uma cópia de tudo o que o Nitrate guarda sobre você: perfil, diário, reviews, watchlist, favoritos e
        quem você segue. O arquivo vem em JSON, para você guardar ou levar para outro lugar.
      </p>
      <button
        onClick={download}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-foreground/15 text-sm hover:bg-surface disabled:opacity-60 transition-colors"
      >
        {busy ? <CircleNotchIcon size={16} className="animate-spin" /> : <DownloadSimpleIcon size={16} />}
        Baixar meus dados
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-brand-crimson">{error}</p>}
    </section>
  );
}

function DeleteAccountSection({ username }: { username: string }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = sameUsername(confirmation.trim(), username);

  const close = () => {
    setOpen(false);
    setConfirmation("");
    setPassword("");
    setShowPassword(false);
    setError(null);
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(password);
      signOut();
      // navegação completa: com o router, o layout privado veria a sessão sumir antes e mandaria para o login
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível excluir a conta. Tente novamente.");
      setBusy(false);
    }
  };

  return (
    <section className="mt-14">
      <SectionHeading title="Excluir conta" />
      <p className="text-sm text-brand-slate leading-relaxed">
        Apaga sua conta e tudo ligado a ela, para sempre: diário, reviews, notas, watchlist, favoritos, seguidores e
        notificações. Não dá para desfazer. Se quiser guardar alguma coisa, baixe seus dados antes.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 px-4 py-2 rounded-md border border-brand-crimson/40 text-sm text-brand-crimson hover:bg-brand-crimson/10 transition-colors"
      >
        Excluir minha conta
      </button>

      <Modal open={open} onClose={close} label="Excluir conta">
        <form onSubmit={handleDelete} className="flex flex-col gap-5">
          <div className="pr-10">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <WarningIcon size={20} className="text-brand-crimson" /> Excluir sua conta?
            </h2>
            <p className="mt-2 text-sm text-brand-slate leading-relaxed">
              Tudo o que você registrou no Nitrate será apagado na hora e não poderá ser recuperado.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-brand-slate">
              Digite <strong className="font-semibold text-foreground">{username}</strong> para confirmar
            </span>
            <input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              className={input}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm text-brand-slate">Sua senha</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={`${input} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-slate/50 hover:text-foreground focus:outline-none focus-visible:text-brand-blue transition-colors"
              >
                {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
          </label>

          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-brand-crimson">
              <WarningIcon size={16} /> {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={close} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!confirmed || !password || busy}
              className="px-4 py-2 rounded-md bg-brand-crimson text-background text-sm font-semibold hover:bg-brand-crimson/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {busy ? "Excluindo…" : "Excluir para sempre"}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
