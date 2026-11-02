import { unzipSync, strFromU8 } from "fflate";

/**
 * Lê o export do Letterboxd (o .zip de Settings → Import & Export) no próprio navegador e
 * consolida, para cada filme, nota, curtida, data em que assistiu e review. O backend recebe
 * o resultado em lotes (ver import-service.ts).
 */

export interface LetterboxdItem {
  name: string;
  year: number | null;
  rating: number | null;
  liked: boolean;
  watchedOn: string | null; // yyyy-mm-dd
  loggedOn: string | null; // quando registrou no Letterboxd
  review: string | null;
  watchlist: boolean;
}

export interface LetterboxdExport {
  username: string | null;
  films: LetterboxdItem[];
  watchlist: LetterboxdItem[];
  stats: { films: number; ratings: number; reviews: number; likes: number; watchlist: number };
}

type Row = Record<string, string>;

/** CSV (RFC 4180): aspas, vírgulas e quebras de linha dentro dos campos (as reviews têm) */
export function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...data] = rows.filter((r) => r.some((cell) => cell !== ""));
  if (!header) return [];
  return data.map((cells) => Object.fromEntries(header.map((h, i) => [h.replace(/^﻿/, ""), cells[i] ?? ""])));
}

/** o Letterboxd guarda citações como <blockquote>; deixamos só o texto */
function cleanReview(text: string): string | null {
  const clean = text
    .replace(/\r\n?/g, "\n")
    .replace(/<\/?blockquote[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean || null;
}

const keyOf = (r: Row) => `${r["Name"]}|${r["Year"]}`;
const dateOrNull = (value: string | undefined) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);
// "a última" por data: compara strings yyyy-mm-dd
const isLater = (a: string | null, b: string | null) => !!a && (!b || a > b);

export class LetterboxdFormatError extends Error {}

export async function readLetterboxdExport(file: File): Promise<LetterboxdExport> {
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new LetterboxdFormatError("Não foi possível abrir o arquivo. Envie o .zip exportado pelo Letterboxd.");
  }

  const read = (name: string): Row[] => {
    // alguns exports vêm dentro de uma pasta; procuramos pelo fim do caminho
    const path = Object.keys(entries).find((p) => p === name || p.endsWith(`/${name}`));
    return path ? parseCsv(strFromU8(entries[path])) : [];
  };

  const watched = read("watched.csv");
  const ratings = read("ratings.csv");
  const diary = read("diary.csv");
  const reviews = read("reviews.csv");
  const likes = read("likes/films.csv");
  const watchlistRows = read("watchlist.csv");
  const profile = read("profile.csv")[0];

  if (!watched.length && !ratings.length && !diary.length && !watchlistRows.length) {
    throw new LetterboxdFormatError("Esse .zip não parece ser um export do Letterboxd (faltam watched.csv e diary.csv).");
  }

  const films = new Map<string, LetterboxdItem>();
  const filmFor = (r: Row): LetterboxdItem => {
    const key = keyOf(r);
    let film = films.get(key);
    if (!film) {
      film = {
        name: r["Name"],
        year: r["Year"] ? Number(r["Year"]) : null,
        rating: null,
        liked: false,
        watchedOn: null,
        loggedOn: null,
        review: null,
        watchlist: false,
      };
      films.set(key, film);
    }
    return film;
  };

  // a data de registro mais antiga é quando o filme entrou no diário
  const noteLogged = (film: LetterboxdItem, date: string | null) => {
    if (date && (!film.loggedOn || date < film.loggedOn)) film.loggedOn = date;
  };

  for (const r of watched) noteLogged(filmFor(r), dateOrNull(r["Date"]));

  for (const r of ratings) {
    const film = filmFor(r);
    const rating = Number(r["Rating"]);
    if (rating >= 0.5 && rating <= 5) film.rating = rating;
    noteLogged(film, dateOrNull(r["Date"]));
  }

  // diário: fica a vez mais recente em que assistiu (reassistidos aparecem mais de uma vez)
  for (const r of diary) {
    const film = filmFor(r);
    const watchedOn = dateOrNull(r["Watched Date"]) ?? dateOrNull(r["Date"]);
    if (isLater(watchedOn, film.watchedOn)) film.watchedOn = watchedOn;
    noteLogged(film, dateOrNull(r["Date"]));
  }

  // reviews: o Nitrate tem uma review por filme, então fica a mais recente
  const latestReview = new Map<string, string>();
  for (const r of reviews) {
    const text = cleanReview(r["Review"] ?? "");
    if (!text) continue;
    const film = filmFor(r);
    const date = dateOrNull(r["Watched Date"]) ?? dateOrNull(r["Date"]) ?? "";
    const key = keyOf(r);
    if (!latestReview.has(key) || date >= latestReview.get(key)!) {
      latestReview.set(key, date);
      film.review = text;
    }
    noteLogged(film, dateOrNull(r["Date"]));
  }

  for (const r of likes) filmFor(r).liked = true;

  // watchlist: só o que ainda não foi assistido
  const watchlist: LetterboxdItem[] = watchlistRows
    .filter((r) => !films.has(keyOf(r)))
    .map((r) => ({
      name: r["Name"],
      year: r["Year"] ? Number(r["Year"]) : null,
      rating: null,
      liked: false,
      watchedOn: null,
      loggedOn: dateOrNull(r["Date"]),
      review: null,
      watchlist: true,
    }));

  const filmList = [...films.values()];
  return {
    username: profile?.["Username"] || null,
    films: filmList,
    watchlist,
    stats: {
      films: filmList.length,
      ratings: filmList.filter((f) => f.rating !== null).length,
      reviews: filmList.filter((f) => f.review).length,
      likes: filmList.filter((f) => f.liked).length,
      watchlist: watchlist.length,
    },
  };
}
