import Link from "next/link";
import type { UserSummary } from "@/lib/types/user";
import { Avatar } from "./ui/avatar";

/** Lista de perfis (seguidores, seguindo, resultados de busca). */
export function UserList({ users, empty }: { users: UserSummary[]; empty?: string }) {
  if (users.length === 0) {
    return empty ? <p className="py-6 text-brand-slate">{empty}</p> : null;
  }
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {users.map((user) => (
        <li key={user.username}>
          <Link
            href={`/u/${user.username}`}
            className="flex items-center gap-3 p-3 rounded-md hover:bg-surface transition-colors"
          >
            <Avatar name={user.name} username={user.username} size="md" />
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
