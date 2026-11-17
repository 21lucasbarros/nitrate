import { Permanent_Marker } from "next/font/google";

// letra de canetão, como o "dream big" rabiscado na foto
const marker = Permanent_Marker({ weight: "400", subsets: ["latin"], display: "swap" });

/** Easter egg de Marty Supreme: a logo vira um "DREAM BIG" escrito à mão, e o ponto vira a bolinha de pingue-pongue */
export function DreamBigLogo() {
  return (
    <span
      title="Dream big. — Marty Supreme"
      className={`${marker.className} relative flex items-start gap-1.5 -rotate-3 text-[#FF5A1F] leading-none select-none animate-[logo-egg-in_400ms_ease-out]`}
    >
      <span className="text-[21px] tracking-wide">DREAM</span>
      {/* o BIG desce um pouco, como na foto */}
      <span className="text-[21px] tracking-wide translate-y-2 rotate-2">BIG</span>
      <PingPongBall />
    </span>
  );
}

/** a bolinha laranja, com as três estrelas, quicando no lugar do ponto da logo */
function PingPongBall() {
  return (
    <span aria-hidden="true" className="relative ml-0.5 mt-1 w-4 h-6 flex flex-col items-center">
      <span
        className="w-3.5 h-3.5 rounded-full animate-[pingpong_900ms_cubic-bezier(0.5,0,0.5,1)_infinite_alternate] motion-reduce:animate-none flex items-center justify-center"
        style={{ background: "radial-gradient(circle at 35% 30%, #FFD3A6 0%, #FF8A2A 45%, #E2560E 100%)" }}
      >
        <span className="text-[4px] leading-none tracking-[-0.5px] text-black/60">★★★</span>
      </span>
      {/* sombra na "mesa": encolhe quando a bolinha sobe */}
      <span className="absolute bottom-0 w-3 h-1 rounded-full bg-black/50 blur-[1px] animate-[pingpong-shadow_900ms_cubic-bezier(0.5,0,0.5,1)_infinite_alternate] motion-reduce:animate-none" />
    </span>
  );
}
