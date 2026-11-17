"use client";

import { useState } from "react";
import Image from "next/image";
import { CircleNotchIcon, InstagramLogoIcon } from "@phosphor-icons/react";
import { shareStoryFile, useStoryImage } from "@/lib/hooks/use-story-image";
import type { MovieReview } from "@/lib/types/review";
import { Modal } from "./ui/modal";

/** modal "Compartilhar nos Stories" da review: prévia do ingresso e o botão de compartilhar a imagem */
export function ShareReviewStoryModal({ review, open, onClose }: { review: MovieReview; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} label="Compartilhar a review nos Stories">
      {open && <ShareBody review={review} />}
    </Modal>
  );
}

function ShareBody({ review }: { review: MovieReview }) {
  // a imagem começa a ser gerada assim que o modal abre: no iOS ela precisa estar pronta antes do toque
  const story = useStoryImage(
    `/u/${review.user.username}/reviews/${review.id}/story`,
    `nitrate-${review.movie.slug ?? review.movie.id}.png`,
  );
  const [saved, setSaved] = useState(false);

  const share = async () => {
    const file = story.file ?? (await story.load());
    if (file && (await shareStoryFile(file)) === "saved") setSaved(true);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative w-44 sm:w-52 shrink-0 aspect-9/16 rounded-xl overflow-hidden ring-1 ring-white/10 bg-background">
        {story.previewUrl ? (
          <Image src={story.previewUrl} alt="Prévia da imagem para os Stories" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brand-slate/50">
            {story.failed ? (
              <span className="px-4 text-center text-sm">Não foi possível gerar a imagem.</span>
            ) : (
              <>
                <CircleNotchIcon size={24} className="animate-spin" />
                <span className="text-xs">Imprimindo o ingresso…</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="text-center sm:text-left">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">Seu ingresso</span>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Mostre o que você assistiu.</h2>
        <p className="mt-2 text-sm text-brand-slate leading-relaxed">
          Pôster, sua nota e a data da sessão num ingresso de cinema. No celular, escolha{" "}
          <strong className="font-medium text-foreground/85">Instagram → Stories</strong> na hora de compartilhar.
        </p>
        <button
          type="button"
          onClick={share}
          disabled={story.failed}
          className="mt-6 inline-flex items-center justify-center gap-2 bg-brand-btn text-brand-btn-text px-6 py-3 rounded-full font-semibold hover:bg-brand-btn/90 transition-colors disabled:opacity-50"
        >
          <InstagramLogoIcon size={20} weight="bold" />
          Compartilhar
        </button>
        {saved && <p className="mt-4 text-sm text-brand-slate">Imagem salva. Envie para o celular e poste nos seus Stories.</p>}
      </div>
    </div>
  );
}
