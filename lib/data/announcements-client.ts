export function announcementPosterUrl(posterPath: string | null): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!posterPath || !base) return null;
  return `${base}/storage/v1/object/public/announcement-posters/${posterPath}`;
}
