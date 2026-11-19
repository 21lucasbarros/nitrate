"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  CircleNotchIcon,
  DownloadSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  InstagramLogoIcon,
  TrashIcon,
  WarningIcon,
  XLogoIcon,
} from "@phosphor-icons/react";

import Header from "@/app/components/header";
import { AvatarCropper } from "@/app/components/avatar-cropper";
import { Avatar } from "@/app/components/ui/avatar";
import { Modal } from "@/app/components/ui/modal";
import { SectionHeading } from "@/app/components/ui/section-heading";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { deleteMyAccount, exportMyData, removeMyAvatar, updateMyProfile, uploadMyAvatar } from "@/lib/services/user-service";
import type { UserProfile } from "@/lib/types/user";

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
      <main className="pt-28 sm:pt-32 pb-24 px-6 max-w-[720px] mx-auto">
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

            {/* key: depois de salvar, o formulário recomeça com os dados novos */}
            <ProfileForm key={`${user.name}|${user.bio}|${user.twitter}|${user.instagram}`} user={user} />
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
  const [bio, setBio] = useState(user.bio ?? "");
  const [twitter, setTwitter] = useState(user.twitter ?? "");
  const [instagram, setInstagram] = useState(user.instagram ?? "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateMyProfile({ name, bio, twitter, instagram });
      setSaved(true);
      refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10">
      <SectionHeading title="Perfil" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <AvatarPicker user={user} previewName={name || user.name} />
        <label className="flex flex-col gap-2">
          <span className={label}>Nome</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={NAME_MAX} required className={input} />
        </label>

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
            disabled={busy}
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
    if (file) {
      setError(null);
      setPending(file);
    }
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

  const confirmed = confirmation.trim().toLowerCase() === username;

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
