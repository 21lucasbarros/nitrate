import { Fragment } from "react";
import Link from "next/link";
import { UsersIcon } from "@phosphor-icons/react";
import type { ReviewPartner, ReviewTogether } from "@/lib/types/review";
import { Avatar } from "./ui/avatar";

/** depois desse tanto de nomes, o resto vira "e mais N" */
const MAX_NAMES = 2;
const MAX_AVATARS = 3;

export type AcceptedPartner = ReviewPartner & { reviewId: number };

/** uma review de filme ou um registro de série: os dois têm a sessão em conjunto no mesmo formato */
type WithTogether = { together: ReviewTogether | null };

/** quem está na review em conjunto para os outros verem: só quem aceitou (convite pendente não aparece) */
export function acceptedPartners(review: WithTogether): AcceptedPartner[] {
  return (review.together?.partners ?? []).filter(
    (p): p is AcceptedPartner => p.status === "ACCEPTED" && p.reviewId !== null,
  );
}

/** `series`: o registro de série da pessoa, e não a review de filme */
export function partnerReviewHref(partner: AcceptedPartner, series = false): string {
  return `/u/${partner.user.username}/${series ? "series" : "reviews"}/${partner.reviewId}`;
}

/** a review de quem convidou, quando esta review usou o texto dela */
export function sharedTextAuthor(review: WithTogether): AcceptedPartner | null {
  const t = review.together;
  if (!t?.sharedText || !t.invitedBy) return null;
  return acceptedPartners(review).find((p) => p.user.username === t.invitedBy?.username) ?? null;
}

/** "com [avatares] Bia, Caio e mais 2": cada nome leva à review da pessoa */
export function TogetherWith({ partners, emphasis = "font-medium text-foreground/80", series = false }: {
  partners: AcceptedPartner[];
  /** classes dos nomes */
  emphasis?: string;
  /** registro de série: os nomes levam aos registros de série de cada pessoa */
  series?: boolean;
}) {
  const shown = partners.slice(0, partners.length > MAX_NAMES + 1 ? MAX_NAMES : MAX_NAMES + 1);
  const rest = partners.slice(shown.length);

  return (
    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <UsersIcon size={15} className="text-brand-orange" aria-label="Review em conjunto" />
      com
      <span className="flex -space-x-1.5">
        {partners.slice(0, MAX_AVATARS).map((p) => (
          <span key={p.user.username} className="rounded-full ring-2 ring-background">
            <Avatar name={p.user.name} username={p.user.username} avatar={p.user.avatar} size="xs" />
          </span>
        ))}
      </span>
      <span>
        {shown.map((p, i) => (
          <Fragment key={p.user.username}>
            {i > 0 && (i === shown.length - 1 && rest.length === 0 ? " e " : ", ")}
            <Link
              href={partnerReviewHref(p, series)}
              title={`Ver a review de ${p.user.name}`}
              className={`${emphasis} hover:text-brand-orange transition-colors`}
            >
              {p.user.name}
            </Link>
          </Fragment>
        ))}
        {rest.length > 0 && (
          <span title={rest.map((p) => p.user.name).join(", ")}>
            {" "}e mais {rest.length}
          </span>
        )}
      </span>
    </span>
  );
}
