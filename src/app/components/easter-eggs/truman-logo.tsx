"use client";

import { useRef, useState } from "react";
import { showQuote } from "@/lib/hooks/use-easter-eggs";

const CLICK_WINDOW_MS = 1500; // cliques mais espaçados que isso recomeçam a contagem
const CRACK_AT = 3; // a primeira rachadura
const BREAK_AT = 5; // a rachadura cresce e o Truman se despede

interface Crack {
  x: number;
  y: number;
  branches: string[]; // caminhos SVG, gerados no clique
  hole: string; // o buraco no meio, por onde aparece o céu do estúdio
}

/** um galho da rachadura: uma linha em zigue-zague saindo do ponto do impacto */
function branch(angle: number, length: number): string {
  let x = 0;
  let y = 0;
  let a = angle;
  const points = ["M0 0"];
  const steps = 6 + Math.floor(Math.random() * 5);
  for (let i = 0; i < steps; i++) {
    a += (Math.random() - 0.5) * 0.9;
    const step = (length / steps) * (0.6 + Math.random() * 0.8);
    x += Math.cos(a) * step;
    y += Math.sin(a) * step;
    points.push(`L${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return points.join(" ");
}

function makeCrack(x: number, y: number): Crack {
  const count = 9;
  const branches = Array.from({ length: count }, (_, i) =>
    branch((i / count) * Math.PI * 2 + Math.random() * 0.5, 140 + Math.random() * 260),
  );
  const hole = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2;
    const r = 7 + Math.random() * 9;
    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return { x, y, branches, hole };
}

/**
 * Easter egg de O Show de Truman: clicar várias vezes seguidas na logo do rodapé racha o
 * "cenário" do site, como o barco do Truman batendo na parede pintada de céu.
 */
export function TrumanLogo() {
  const clicks = useRef<{ count: number; last: number }>({ count: 0, last: 0 });
  const [crack, setCrack] = useState<Crack | null>(null);
  const [broken, setBroken] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const state = clicks.current;
    state.count = now - state.last > CLICK_WINDOW_MS ? 1 : state.count + 1;
    state.last = now;

    if (state.count === CRACK_AT && !crack) {
      // o impacto fica um pouco acima do rodapé, no "fundo" da página
      setCrack(makeCrack(e.clientX, Math.max(120, e.clientY - 180)));
    }
    if (state.count === BREAK_AT && !broken) {
      setBroken(true);
      showQuote("In case I don't see ya, good afternoon, good evening, and good night!", "truman", 8000);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="text-xl sm:text-2xl font-bold tracking-tighter text-foreground uppercase flex items-center justify-center md:justify-start gap-1 select-none"
      >
        Nitrate<span className="w-1.5 h-1.5 rounded-full bg-brand-orange mt-1" />
      </button>

      {crack && (
        <svg
          aria-hidden="true"
          className="fixed inset-0 z-30 w-screen h-screen pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="truman-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CFEAFF" />
              <stop offset="100%" stopColor="#7DB9EC" />
            </linearGradient>
          </defs>
          {/* começa pequena e cresce no quinto clique */}
          <g
            className="transition-transform duration-700 ease-out"
            style={{ transform: `translate(${crack.x}px, ${crack.y}px) scale(${broken ? 1 : 0.35})` }}
          >
            {/* atrás do cenário, o céu pintado do estúdio */}
            <polygon points={crack.hole} fill="url(#truman-sky)" className="drop-shadow-[0_0_12px_rgba(173,216,255,0.8)]" />
            {crack.branches.map((d, i) => (
              <g key={i}>
                {/* sombra e brilho: a rachadura parece funda */}
                <path d={d} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth={3} strokeLinejoin="round" transform="translate(1 1)" />
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(236,237,238,0.85)"
                  strokeWidth={1.2}
                  strokeLinejoin="round"
                  // pathLength 1: o traço "se desenha" do impacto para fora
                  pathLength={1}
                  strokeDasharray={1}
                  className="animate-[crack-draw_600ms_ease-out_both]"
                />
              </g>
            ))}
          </g>
        </svg>
      )}
    </>
  );
}
