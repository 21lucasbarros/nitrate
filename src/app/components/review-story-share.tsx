"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { CheckIcon, CircleNotchIcon, ImageIcon, InstagramLogoIcon } from "@phosphor-icons/react";
import { easterEggFor } from "@/lib/easter-eggs";
import { useFetch } from "@/lib/hooks/use-fetch";
import { shareStoryFile, useStoryImage } from "@/lib/hooks/use-story-image";
import { getMovieScenes } from "@/lib/services/movie-service";
import { getSeriesScenes } from "@/lib/services/series-service";
import type { MovieReview } from "@/lib/types/review";
import type { MovieBackdrops } from "@/lib/types/user";
import type { SeriesReview } from "@/types/series";
import { backdropUrl } from "@/utils/poster";
import { Modal } from "./ui/modal";

interface StoryCopy {
  /** rota que devolve o PNG */
  url: string;
  fileName: string;
  eyebrow: string;
  title: string;
  description: string;
  loadingLabel: string;
}

/** um estilo da imagem: o valor vai no ?estilo da rota (o primeiro é o padrão, sem parâmetro) */
interface StoryStyle {
  value: string;
  label: string;
  eyebrow: string;
  description: string;
  loadingLabel: string;
}

const SCENE_STYLE: StoryStyle = {
  value: "cena",
  label: "Cena",
  eyebrow: "Sua cena",
  description: "A cena em tela cheia, com o pôster, sua nota e a data da sessão. ",
  loadingLabel: "Revelando a cena…",
};

const MOVIE_STYLES: StoryStyle[] = [
  {
    value: "ingresso",
    label: "Ingresso",
    eyebrow: "Seu ingresso",
    description: "Pôster, sua nota e a data da sessão num ingresso de cinema. ",
    loadingLabel: "Imprimindo o ingresso…",
  },
  SCENE_STYLE,
];

const SERIES_STYLES: StoryStyle[] = [
  {
    value: "tv",
    label: "TV",
    eyebrow: "Sua maratona",
    description: "A série numa TV de tubo, com sua nota, a temporada e quando você terminou. ",
    loadingLabel: "Ligando a TV…",
  },
  { ...SCENE_STYLE, description: "A cena em tela cheia, com o pôster, sua nota, a temporada e quando você assistiu. " },
];

/** modal "Compartilhar nos Stories" da review: prévia do ingresso e o botão de compartilhar a imagem */
export function ShareReviewStoryModal({ review, open, onClose }: { review: MovieReview; open: boolean; onClose: () => void }) {
  // easter egg (Psicopata Americano): a imagem é um cartão de visita
  const businessCard = easterEggFor(review.movie)?.story === "business-card";
  return (
    <Modal open={open} onClose={onClose} label="Compartilhar a review nos Stories">
      {open &&
        (businessCard ? (
          <ShareBody
            url={`/u/${review.user.username}/reviews/${review.id}/story`}
            fileName={`nitrate-${review.movie.slug ?? review.movie.id}.png`}
            eyebrow="Seu cartão de visita"
            title="Let's see Paul Allen's card."
            description="Off-white sutil, espessura de bom gosto: sua review num cartão corporativo, com nota e tudo. "
            loadingLabel="Imprimindo os cartões…"
          />
        ) : (
          <StyledShareBody
            url={`/u/${review.user.username}/reviews/${review.id}/story`}
            fileName={`nitrate-${review.movie.slug ?? review.movie.id}.png`}
            title="Mostre o que você assistiu."
            styles={MOVIE_STYLES}
            name={review.movie.title}
            kind="filme"
            sceneKey={review.movie}
            loadScenes={getMovieScenes}
          />
        ))}
    </Modal>
  );
}

/** o mesmo modal para um registro de série: a TV de tubo ou a cena em tela cheia, com a temporada */
export function ShareSeriesStoryModal({ review, open, onClose }: { review: SeriesReview | null; open: boolean; onClose: () => void }) {
  return (
    <Modal open={open && review !== null} onClose={onClose} label="Compartilhar a série nos Stories">
      {open && review && (
        <StyledShareBody
          url={`/u/${review.user.username}/series/${review.id}/story`}
          fileName={`nitrate-${review.series.slug ?? review.series.id}${review.seasonNumber !== null ? `-t${review.seasonNumber}` : ""}${review.episodeNumber !== null ? `e${review.episodeNumber}` : ""}.png`}
          title="Mostre o que você maratonou."
          styles={SERIES_STYLES}
          name={review.series.name}
          kind="série"
          sceneKey={review.series.id}
          loadScenes={getSeriesScenes}
        />
      )}
    </Modal>
  );
}

/** os estilos da imagem e o fundo escolhido entre as cenas do próprio filme ou da própria série */
function StyledShareBody<K>({
  url,
  fileName,
  title,
  styles,
  name,
  kind,
  sceneKey,
  loadScenes,
}: {
  url: string;
  fileName: string;
  title: string;
  styles: StoryStyle[];
  /** o título do filme ou o nome da série, no seletor de cenas */
  name: string;
  kind: "filme" | "série";
  sceneKey: K;
  /** busca as cenas (função estável, dos services) */
  loadScenes: (key: K) => Promise<MovieBackdrops>;
}) {
  const [style, setStyle] = useState(styles[0]);
  const [scene, setScene] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const scenes = useFetch(picking ? sceneKey : null, loadScenes);

  const params = new URLSearchParams();
  if (style !== styles[0]) params.set("estilo", style.value);
  if (scene) params.set("fundo", scene);
  const query = params.toString();

  return (
    <>
      {picking && (
        <StoryScenePicker
          name={name}
          kind={kind}
          scenes={scenes}
          current={scene}
          onCancel={() => setPicking(false)}
          onPick={(path) => {
            setScene(path);
            setPicking(false);
          }}
        />
      )}
      {/* fica montado durante a escolha: a prévia atual não precisa ser gerada de novo ao cancelar */}
      <div className={picking ? "hidden" : undefined}>
        <ShareBody
          url={`${url}${query ? `?${query}` : ""}`}
          fileName={fileName}
          eyebrow={style.eyebrow}
          title={title}
          description={style.description}
          loadingLabel={style.loadingLabel}
        >
          <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <div role="radiogroup" aria-label="Estilo da imagem" className="inline-flex p-1 rounded-full bg-surface-strong">
              {styles.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={style === option}
                  onClick={() => setStyle(option)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full text-sm transition-colors ${style === option ? "bg-foreground text-background font-medium" : "text-brand-slate hover:text-foreground"}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-sm text-brand-slate ring-1 ring-foreground/15 hover:text-foreground hover:ring-foreground/30 transition-colors"
            >
              <ImageIcon size={16} />
              {scene ? "Trocar cena" : "Escolher cena"}
            </button>
            {scene && (
              <button
                type="button"
                onClick={() => setScene(null)}
                className="px-2 py-2 text-sm text-brand-slate/80 hover:text-foreground transition-colors"
              >
                Usar a padrão
              </button>
            )}
          </div>
        </ShareBody>
      </div>
    </>
  );
}

/** as cenas do filme ou da série, já no recorte do story (9:16) */
function StoryScenePicker({
  name,
  kind,
  scenes,
  current,
  onCancel,
  onPick,
}: {
  name: string;
  kind: "filme" | "série";
  scenes: { data?: MovieBackdrops; error?: unknown };
  current: string | null;
  onCancel: () => void;
  onPick: (path: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(current);
  const which = kind === "filme" ? "desse filme" : "dessa série";

  return (
    <div className="flex flex-col gap-5">
      <div className="pr-10">
        <h2 className="text-lg font-semibold">Fundo da imagem</h2>
        <p className="mt-1 text-sm text-brand-slate">Escolha uma cena de {name}. O recorte é o mesmo que vai para o story.</p>
      </div>

      {scenes.error ? (
        <p className="py-10 text-center text-sm text-brand-slate">Não foi possível carregar as cenas {which}.</p>
      ) : !scenes.data ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-9/16 rounded-md bg-surface-strong animate-pulse" />
          ))}
        </div>
      ) : scenes.data.backdrops.length === 0 ? (
        <p className="py-10 text-center text-sm text-brand-slate">{kind === "filme" ? "Esse filme não tem" : "Essa série não tem"} cenas no TMDB.</p>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 max-h-[min(58vh,560px)] overflow-y-auto -mx-1 px-1 py-1">
          {scenes.data.backdrops.map((path) => {
            const active = selected === path;
            return (
              <li key={path}>
                <button
                  type="button"
                  onClick={() => setSelected(path)}
                  aria-pressed={active}
                  aria-label="Usar esta cena"
                  className={`group relative block w-full aspect-9/16 overflow-hidden rounded-md bg-surface-strong ring-2 transition-all ${active ? "ring-brand-orange" : "ring-transparent hover:ring-foreground/30"}`}
                >
                  <Image
                    src={backdropUrl(path, "w780")!}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 150px, 30vw"
                    className={`object-cover transition-opacity ${active ? "" : "opacity-85 group-hover:opacity-100"}`}
                  />
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-brand-orange text-brand-btn-text flex items-center justify-center shadow-lg">
                      <CheckIcon size={14} weight="bold" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => selected && onPick(selected)}
          disabled={!selected}
          className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Usar esta cena
        </button>
      </div>
    </div>
  );
}

function ShareBody({ url, fileName, eyebrow, title, description, loadingLabel, children }: StoryCopy & { children?: ReactNode }) {
  // a imagem começa a ser gerada assim que o modal abre: no iOS ela precisa estar pronta antes do toque
  const story = useStoryImage(url, fileName);
  const [saved, setSaved] = useState(false);

  const share = async () => {
    const file = story.file ?? (await story.load());
    if (file && (await shareStoryFile(file)) === "saved") setSaved(true);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
      {/* no celular a prévia acompanha a altura da tela, para o botão de compartilhar caber sem rolar */}
      <div className="relative h-[min(36dvh,313px)] sm:h-auto sm:w-52 shrink-0 aspect-9/16 rounded-xl overflow-hidden ring-1 ring-white/10 bg-background">
        {story.previewUrl ? (
          <Image src={story.previewUrl} alt="Prévia da imagem para os Stories" fill unoptimized className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-brand-slate/50">
            {story.failed ? (
              <span className="px-4 text-center text-sm">Não foi possível gerar a imagem.</span>
            ) : (
              <>
                <CircleNotchIcon size={24} className="animate-spin" />
                <span className="text-xs">{loadingLabel}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="text-center sm:text-left">
        <span className="text-xs font-bold tracking-[0.2em] uppercase text-brand-orange">{eyebrow}</span>
        <h2 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-brand-slate leading-relaxed">
          {description}
          No celular, escolha{" "}
          <strong className="font-medium text-foreground/85">Instagram → Stories</strong> na hora de compartilhar.
        </p>
        {children}
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
