"use client";

import { useEffect, useRef, useState } from "react";
import { CircleNotchIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from "@phosphor-icons/react";

const VIEW = 256; // lado da área de enquadramento, em px
const MAX_ZOOM = 4;
const OUTPUT_SIDE = 512; // o backend ainda reduz para 400; aqui é só para o upload ficar leve

interface Frame {
  zoom: number; // 1 = a foto cobre a área inteira pelo lado menor
  x: number; // canto superior esquerdo da foto, relativo à área
  y: number;
}

interface AvatarCropperProps {
  file: File;
  onCancel: () => void;
  onConfirm: (image: Blob) => void;
  onError: () => void;
}

/**
 * Enquadramento da foto de perfil: arrastar move, a roda do mouse / pinça / slider dão zoom.
 * O círculo mostra o que aparece nos avatares; o envio é o quadrado inteiro em volta dele.
 */
export function AvatarCropper({ file, onCancel, onConfirm, onError }: AvatarCropperProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [frame, setFrame] = useState<Frame>({ zoom: 1, x: 0, y: 0 });
  const viewRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  // a foto só é carregada de novo se o arquivo mudar, não a cada render do pai
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    let loaded: ImageBitmap | null = null;
    const objectUrl = URL.createObjectURL(file);
    // já respeita a orientação (EXIF) da foto, igual ao <img>
    createImageBitmap(file).then(
      (bmp) => {
        if (cancelled) return bmp.close();
        loaded = bmp;
        setBitmap(bmp);
        setUrl(objectUrl);
        setFrame(clamp(bmp, { zoom: 1, x: -Infinity, y: -Infinity }, true));
      },
      () => !cancelled && onErrorRef.current(),
    );
    return () => {
      cancelled = true;
      loaded?.close();
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  // a roda do mouse precisa de preventDefault, e o onWheel do React é passivo
  useEffect(() => {
    const view = viewRef.current;
    if (!view || !bitmap) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = local(view, e.clientX, e.clientY);
      setFrame((f) => zoomAt(bitmap, f, f.zoom * Math.exp(-e.deltaY * 0.002), p.x, p.y));
    };
    view.addEventListener("wheel", onWheel, { passive: false });
    return () => view.removeEventListener("wheel", onWheel);
  }, [bitmap]);

  if (!bitmap || !url) {
    return (
      <div className="flex justify-center py-24 text-brand-slate/40">
        <CircleNotchIcon size={28} className="animate-spin" />
      </div>
    );
  }

  const scale = baseScale(bitmap) * frame.zoom;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const all = [...pointers.current.values()];
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);

    if (all.length === 1) {
      setFrame((f) => clamp(bitmap, { ...f, x: f.x + next.x - prev.x, y: f.y + next.y - prev.y }));
    } else if (all.length === 2) {
      // pinça: o zoom segue a distância entre os dedos, centrado no meio deles
      const other = all.find((p) => p !== prev)!;
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(next.x - other.x, next.y - other.y);
      const mid = local(viewRef.current!, (next.x + other.x) / 2, (next.y + other.y) / 2);
      if (before > 0) setFrame((f) => zoomAt(bitmap, f, f.zoom * (after / before), mid.x, mid.y));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 10;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setFrame((f) => clamp(bitmap, { ...f, x: f.x + dx, y: f.y + dy }));
    } else if (e.key === "+" || e.key === "=" || e.key === "-") {
      e.preventDefault();
      const factor = e.key === "-" ? 1 / 1.1 : 1.1;
      setFrame((f) => zoomAt(bitmap, f, f.zoom * factor, VIEW / 2, VIEW / 2));
    }
  };

  const confirm = () => {
    // o que está dentro da área, em pixels da foto original
    const side = VIEW / scale;
    const target = Math.max(1, Math.min(OUTPUT_SIDE, Math.round(side)));
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = target;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff"; // PNG transparente: o JPEG não tem canal alfa
    ctx.fillRect(0, 0, target, target);
    ctx.drawImage(bitmap, -frame.x / scale, -frame.y / scale, side, side, 0, 0, target, target);
    canvas.toBlob((blob) => (blob ? onConfirm(blob) : onError()), "image/jpeg", 0.9);
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="self-stretch pr-10">
        <h2 className="text-lg font-semibold">Enquadrar foto</h2>
        <p className="mt-1 text-sm text-brand-slate">Arraste para posicionar e use o zoom para ajustar.</p>
      </div>

      <div
        ref={viewRef}
        tabIndex={0}
        role="application"
        aria-label="Área de enquadramento. Use as setas para mover e + ou - para o zoom."
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        style={{ width: VIEW, height: VIEW }}
        className="relative shrink-0 overflow-hidden rounded-md bg-background touch-none select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob local, não passa pelo otimizador */}
        <img
          src={url}
          alt=""
          draggable={false}
          className="absolute top-0 left-0 max-w-none pointer-events-none"
          style={{
            width: bitmap.width * scale,
            height: bitmap.height * scale,
            transform: `translate(${frame.x}px, ${frame.y}px)`,
          }}
        />
        {/* escurece o que fica fora do círculo do avatar */}
        <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-white/40 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
      </div>

      <label className="flex items-center gap-3 w-full max-w-[256px] text-brand-slate">
        <MagnifyingGlassMinusIcon size={18} className="shrink-0" />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={frame.zoom}
          onChange={(e) => setFrame((f) => zoomAt(bitmap, f, Number(e.target.value), VIEW / 2, VIEW / 2))}
          aria-label="Zoom"
          className="flex-1 accent-brand-orange"
        />
        <MagnifyingGlassPlusIcon size={18} className="shrink-0" />
      </label>

      <div className="self-stretch flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md text-sm text-brand-slate hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          className="px-4 py-2 rounded-md bg-brand-btn text-brand-btn-text text-sm font-semibold hover:bg-brand-btn/90 transition-colors"
        >
          Salvar foto
        </button>
      </div>
    </div>
  );
}

/** escala em que o lado menor da foto preenche a área */
function baseScale(bitmap: ImageBitmap): number {
  return VIEW / Math.min(bitmap.width, bitmap.height);
}

/** mantém o zoom no intervalo e a foto cobrindo a área inteira (sem bordas vazias) */
function clamp(bitmap: ImageBitmap, f: Frame, center = false): Frame {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, f.zoom));
  const scale = baseScale(bitmap) * zoom;
  const minX = VIEW - bitmap.width * scale;
  const minY = VIEW - bitmap.height * scale;
  if (center) return { zoom, x: minX / 2, y: minY / 2 };
  return { zoom, x: Math.min(0, Math.max(minX, f.x)), y: Math.min(0, Math.max(minY, f.y)) };
}

/** muda o zoom mantendo parado o ponto (px, py) da área, como em qualquer editor de foto */
function zoomAt(bitmap: ImageBitmap, f: Frame, nextZoom: number, px: number, py: number): Frame {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
  const ratio = zoom / f.zoom;
  return clamp(bitmap, { zoom, x: px - (px - f.x) * ratio, y: py - (py - f.y) * ratio });
}

/** coordenadas da tela -> coordenadas dentro da área */
function local(view: HTMLElement, clientX: number, clientY: number) {
  const rect = view.getBoundingClientRect();
  return { x: clientX - rect.left, y: clientY - rect.top };
}
