/**
 * Strapi's useFetchClient aborts every in-flight request when its component unmounts. The resulting
 * rejection is expected behaviour, not a failure, and must not reach the user as a notification.
 */
export default function isAbortError(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError'
}
