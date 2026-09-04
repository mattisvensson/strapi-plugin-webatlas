import { useCallback } from 'react'
import { useAPIErrorHandler, isFetchError } from '@strapi/strapi/admin'

/**
 * Returns a helper that prefers the message the API sent (ApplicationError, ValidationError, ...)
 * over the generic fallback, so users see why an action failed instead of
 * "Request failed with status code 400". Non-API errors fall back to the passed message.
 *
 * The helper is memoized so it can be used as an effect dependency.
 */
export default function useErrorMessage() {
	const { formatAPIError } = useAPIErrorHandler()

	return useCallback(
		(error: unknown, fallback: string): string =>
			isFetchError(error) ? formatAPIError(error) : fallback,
		[formatAPIError],
	)
}
