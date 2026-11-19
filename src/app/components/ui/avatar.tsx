import { API_BASE_URL } from "@/lib/config";

// sem foto de perfil: a inicial do nome numa cor derivada do username
const COLORS = [
  "bg-brand-blue",
  "bg-brand-orange",
  "bg-brand-violet",
  "bg-brand-crimson",
  "bg-brand-emerald",
  "bg-brand-teal",
];

function colorFor(username: string): string {
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

interface AvatarProps {
  name: string;
  username: string;
  /** caminho da foto na API (UserSummary.avatar); sem ele, mostra a inicial */
  avatar?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  lg: "w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl",
  xl: "w-24 h-24 sm:w-28 sm:h-28 text-4xl sm:text-5xl",
};

export function Avatar({ name, username, avatar, size = "md" }: AvatarProps) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a foto já sai do backend recortada e pequena (400px)
      <img
        src={`${API_BASE_URL}${avatar}`}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={`${SIZES[size]} shrink-0 rounded-full object-cover bg-surface select-none`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} ${colorFor(username)} shrink-0 rounded-full flex items-center justify-center font-semibold text-white uppercase select-none`}
    >
      {name.trim().charAt(0) || username.charAt(0)}
    </span>
  );
}
