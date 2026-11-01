// ainda não temos foto de perfil: usamos a inicial do nome numa cor derivada do username
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
  size?: "sm" | "md" | "xl";
}

const SIZES = {
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-base",
  xl: "w-24 h-24 sm:w-28 sm:h-28 text-4xl sm:text-5xl",
};

export function Avatar({ name, username, size = "md" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`${SIZES[size]} ${colorFor(username)} shrink-0 rounded-full flex items-center justify-center font-semibold text-white uppercase select-none`}
    >
      {name.trim().charAt(0) || username.charAt(0)}
    </span>
  );
}
