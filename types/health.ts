export type HealthSeverity = 'error' | 'warning' | 'info'

export type HealthCheck =
	// Errors: the frontend API resolves a wrong or no page
	| 'pathConflict'
	| 'orphanedRoute'
	| 'blacklistedPath'
	// Warnings
	| 'invalidExternalUrl'
	| 'unpublishedInNavigation'
	| 'tooDeepItem'
	// Info
	| 'notInNavigation'
	| 'emptyWrapper'

export type HealthIssueDetails = {
	// pathConflict: the shared value and the other routes using it
	value?: string
	conflictingRoutes?: { documentId: string; title: string }[]
	// orphanedRoute
	reason?: 'missingContentType' | 'disabledContentType' | 'missingDocument'
	// tooDeepItem, unpublishedInNavigation, emptyWrapper
	navigationName?: string
	depth?: number
	maxDepth?: number
}

// One issue per affected route, so the admin panel can filter and mark the routes directly
export type HealthIssue = {
	check: HealthCheck
	severity: HealthSeverity
	routeDocumentId: string
	details?: HealthIssueDetails
}

export type HealthReport = {
	issues: HealthIssue[]
	checkedAt: string
}
