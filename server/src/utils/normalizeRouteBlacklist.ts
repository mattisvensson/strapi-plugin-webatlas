/**
 * Brings blacklist entries into the same shape as stored route paths (lowercase, no surrounding
 * slashes), so that entries like "/Admin/" still match the path "admin".
 */
export default function normalizeRouteBlacklist(entries: unknown): string[] {
	if (!Array.isArray(entries)) return []

	return entries
		.filter((entry): entry is string => typeof entry === 'string')
		.map((entry) => entry.trim().toLowerCase().replace(/^\/+/, '').replace(/\/+$/, ''))
		.filter(Boolean)
}
