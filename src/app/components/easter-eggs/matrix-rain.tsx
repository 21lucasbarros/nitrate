"use client";

import { useEffect, useRef, useState } from "react";
import { showQuote } from "@/lib/hooks/use-easter-eggs";

const GLYPHS = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:・.=*+-<>¦";
const GREEN = "#3CFF7A";
const RAIN_MS = 1100; // a "fração de segundo" em que a página vira código
const FADE_MS = 450;

/**
 * Easter egg de Matrix: ao abrir a página, a tela vira código verde caindo por um instante.
 * Depois sobra uma única coluna descendo pela lateral, escrevendo "スプーン" (colher).
 * Quem clicar nela descobre que não existe colher.
 */
export function MatrixRain() {
  const [phase, setPhase] = useState<"rain" | "fade" | "done">("rain");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fade = setTimeout(() => setPhase("fade"), reduced ? 0 : RAIN_MS);
    const done = setTimeout(() => setPhase("done"), reduced ? 0 : RAIN_MS + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  return (
    <>
      {phase !== "done" && <RainCanvas fading={phase === "fade"} />}
      {phase === "done" && <Spoon />}
    </>
  );
}

function RainCanvas({ fading }: { fading: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.scale(ratio, ratio);

    const size = 18;
    const columns = Math.ceil(width / size);
    // cada coluna começa numa altura diferente, para a chuva já chegar "no meio"
    const drops = Array.from({ length: columns }, () => Math.random() * -height / size);
    ctx.font = `${size}px "Geist Mono", monospace`;

    let frame = 0;
    const draw = () => {
      // rastro: pinta um preto translúcido por cima do quadro anterior
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < columns; i++) {
        const y = drops[i] * size;
        const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        // a ponta da coluna é mais clara, como na abertura do filme
        ctx.fillStyle = Math.random() > 0.96 ? "#D9FFE6" : GREEN;
        ctx.fillText(char, i * size, y);
        drops[i] = y > height && Math.random() > 0.95 ? 0 : drops[i] + 1;
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`fixed inset-0 z-[70] w-screen h-screen bg-black/80 pointer-events-none transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    />
  );
}

/** a coluna que ficou para trás: "スプーン" descendo devagar pela margem */
function Spoon() {
  return (
    <button
      type="button"
      onClick={() => showQuote("There is no spoon.", "matrix")}
      // sem nome visível: é para ser descoberto
      aria-label="Código"
      className="fixed left-2 sm:left-4 top-0 z-40 flex flex-col items-center px-1.5 font-mono text-sm leading-tight text-[#3CFF7A] opacity-40 hover:opacity-100 animate-[spoon-fall_14s_linear_infinite] motion-reduce:animate-none motion-reduce:top-1/3 transition-opacity [text-shadow:0_0_8px_rgba(60,255,122,0.8)]"
    >
      {["ス", "プ", "ー", "ン"].map((char, i) => (
        <span key={i} style={{ opacity: 0.4 + i * 0.2 }}>{char}</span>
      ))}
    </button>
  );
}
