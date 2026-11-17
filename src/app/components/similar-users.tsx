import Link from "next/link";
import type { SimilarUser } from "@/lib/types/user";
import { Avatar } from "./ui/avatar";

/** Cinéfilos com gosto parecido: quantos filmes em comum e o quanto as notas batem. */
export function SimilarUsers({ users }: { users: SimilarUser[] }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {users.map((user) => (
        <li key={user.username}>
          <Link
            href={`/u/${user.username}`}
            className="group flex items-center gap-3 h-full p-3 rounded-md bg-surface hover:bg-surface-strong transition-colors"
          >
            <Avatar name={user.name} username={user.username} size="md" />
            <span className="flex-1 min-w-0">
              <span className="block font-medium truncate group-hover:text-brand-orange transition-colors">{user.name}</span>
              <span className="block text-xs text-brand-slate truncate">
                {user.sharedFilms} {user.sharedFilms === 1 ? "filme" : "filmes"} em comum
              </span>
            </span>
            <span className="shrink-0 text-right" title="O quanto as notas de vocês batem">
              <span className="block text-sm font-semibold tabular-nums text-brand-emerald">{user.compatibility}%</span>
              <span className="block text-[10px] uppercase tracking-wider text-brand-slate/60">afinidade</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
