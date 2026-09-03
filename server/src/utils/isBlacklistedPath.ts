export default function isBlacklistedPath(url: string, routeBlacklist: string[]): boolean {
	if (!url) return false

	const path = url.toLowerCase()
	return routeBlacklist.some((segment) => path.startsWith(`${segment}/`) || path === segment)
}
