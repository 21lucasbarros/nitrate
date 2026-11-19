import Link from "next/link";
import type { UserSummary } from "@/lib/types/user";
import { Avatar } from "./ui/avatar";

/** Lista de perfis (seguidores, seguindo, resultados de busca). */
export function UserList({ users, empty, columns = 3, onSelect }: {
  users: UserSummary[];
  empty?: string;
  /** 1 = lista simples (ex.: dentro de um modal); 3 = grade da página */
  columns?: 1 | 3;
  onSelect?: () => void;
}) {
  if (users.length === 0) {
    return empty ? <p className="py-6 px-3 text-brand-slate">{empty}</p> : null;
  }
  return (
    <ul className={columns === 1 ? "flex flex-col gap-1" : "grid sm:grid-cols-2 lg:grid-cols-3 gap-3"}>
      {users.map((user) => (
        <li key={user.username}>
          <Link
            href={`/u/${user.username}`}
            onClick={onSelect}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-surface-strong transition-colors"
          >
            <Avatar name={user.name} username={user.username} avatar={user.avatar} size="md" />
            <span className="min-w-0">
              <span className="block font-medium truncate">{user.name}</span>
              <span className="block text-sm text-brand-slate truncate">@{user.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
