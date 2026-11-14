"use client";

import { useState } from "react";
import { CheckIcon, UserPlusIcon } from "@phosphor-icons/react";
import { followUser, unfollowUser } from "@/lib/services/user-service";

/** Seguir / deixar de seguir. Atualiza na hora e desfaz se o servidor recusar. */
export function FollowButton({ username, following, onChange, onSaved, size = "md" }: {
  username: string;
  following: boolean;
  onChange: (following: boolean) => void;
  /** depois que o servidor confirmou */
  onSaved?: () => void;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  const toggle = async () => {
    const next = !following;
    setBusy(true);
    onChange(next);
    try {
      if (next) await followUser(username);
      else await unfollowUser(username);
      onSaved?.();
    } catch {
      onChange(!next);
    } finally {
      setBusy(false);
    }
  };

  const padding = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs";

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={following}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold transition-colors disabled:opacity-60 ${padding} ${
        following
          ? "bg-surface-strong text-foreground/80 hover:bg-brand-crimson/15 hover:text-brand-crimson"
          : "bg-brand-btn text-brand-btn-text hover:bg-brand-btn/90"
      }`}
    >
      {following ? <CheckIcon size={12} weight="bold" /> : <UserPlusIcon size={12} weight="bold" />}
      {following ? (hover ? "Deixar de seguir" : "Seguindo") : "Seguir"}
    </button>
  );
}
