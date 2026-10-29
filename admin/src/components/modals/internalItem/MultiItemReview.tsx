import type { ConfigContentType, Entity, NestedNavItem, Route } from '../../../../../types'
import {
	Field,
	IconButton,
	Loader,
	RawTable,
	Tbody,
	Td,
	Th,
	Thead,
	Tr,
	Typography,
} from '@strapi/design-system'
import { Cross } from '@strapi/icons'
import { useEffect, useRef, useState } from 'react'
import { useIntl } from 'react-intl'
import { useFetchClient } from '@strapi/strapi/admin'
import { duplicateCheck, getTranslation, isAbortError } from '../../../utils'
import { transformToUrl } from '../../../../../utils'
import { useApi } from '../../../hooks'
import type { SelectedEntry } from './EntrySelection'
import { getSelectionKey } from './EntrySelection'

type RowStatus =
	| 'loading'
	| 'checking'
	| 'ok'
	| 'replaced'
	| 'blacklisted'
	| 'duplicate'
	| 'noRoute'
	| 'error'

export type ReviewRow = {
	key: string
	entry: Entity
	contentType: ConfigContentType
	route: Route | null
	title: string
	slug: string
	path: string
	status: RowStatus
}

const URL_CHECK_DELAY = 500

/**
 * A row can be added when its path is checked and unique, also among the other selected entries.
 */
export const isRowValid = (row: ReviewRow) =>
	(row.status === 'ok' || row.status === 'replaced') &&
	row.title.trim() !== '' &&
	transformToUrl(row.slug) !== ''

// Paths that occur more than once in the selection, the server does not know the other new items
const markDuplicates = (rows: ReviewRow[]): ReviewRow[] => {
	const counts = new Map<string, number>()
	rows.forEach((row) => row.route && counts.set(row.path, (counts.get(row.path) ?? 0) + 1))
	return rows.map((row) =>
		(counts.get(row.path) ?? 0) > 1 && (row.status === 'ok' || row.status === 'replaced')
			? { ...row, status: 'duplicate' }
			: row,
	)
}

export default function MultiItemReview({
	selectedEntries,
	parentNavItem,
	onRowsChange,
}: {
	selectedEntries: SelectedEntry[]
	parentNavItem: NestedNavItem | null
	onRowsChange: (rows: ReviewRow[]) => void
}) {
	const { formatMessage } = useIntl()
	const { getRelatedRoute } = useApi()
	const { get } = useFetchClient()
	const [rows, setRows] = useState<ReviewRow[]>([])
	// Latest path per row, results of outdated checks are ignored
	const checkedPathsRef = useRef(new Map<string, string>())
	const checkTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

	// Same as in the single item form: the path of the parent plus the slug
	const parentPath = parentNavItem?.clientModifications?.path || parentNavItem?.route.path || ''
	// Always the normalized slug, otherwise e.g. "Page-1" would be checked instead of "page-1"
	const buildPath = (slug: string) =>
		parentPath ? `${parentPath}/${transformToUrl(slug)}` : transformToUrl(slug)

	const updateRow = (key: string, update: Partial<ReviewRow>) =>
		setRows((current) => current.map((row) => (row.key === key ? { ...row, ...update } : row)))

	async function checkPath(key: string, path: string, route: Route) {
		checkedPathsRef.current.set(key, path)

		// The route keeps its current path, there is nothing to check
		if (path === route.path) return updateRow(key, { status: 'ok' })

		updateRow(key, { status: 'checking' })
		try {
			const { uniquePath, blacklisted } = await duplicateCheck({
				fetchFunction: get,
				path,
				routeDocumentId: route.documentId,
				withoutTransform: true,
			})
			if (checkedPathsRef.current.get(key) !== path) return

			if (blacklisted) return updateRow(key, { status: 'blacklisted' })
			if (uniquePath && uniquePath !== path) {
				checkedPathsRef.current.set(key, uniquePath)
				// The path of an item is built from its slug, so the slug has to match the replaced path
				return updateRow(key, {
					path: uniquePath,
					slug: uniquePath.split('/').pop() ?? '',
					status: 'replaced',
				})
			}
			updateRow(key, { status: 'ok' })
		} catch (error) {
			if (isAbortError(error) || checkedPathsRef.current.get(key) !== path) return
			console.error(error)
			updateRow(key, { status: 'error' })
		}
	}

	useEffect(() => {
		setRows(
			selectedEntries.map(({ entry, contentType }) => ({
				key: getSelectionKey(contentType, entry),
				entry,
				contentType,
				route: null,
				title: '',
				slug: '',
				path: '',
				status: 'loading',
			})),
		)

		selectedEntries.forEach(async ({ entry, contentType }) => {
			const key = getSelectionKey(contentType, entry)
			try {
				const route = await getRelatedRoute(entry.documentId)
				if (!route) return updateRow(key, { status: 'noRoute' })

				const path = buildPath(route.slug)
				updateRow(key, { route, title: route.title, slug: route.slug, path })
				checkPath(key, path, route)
			} catch (error) {
				if (isAbortError(error)) return
				console.error(error)
				updateRow(key, { status: 'error' })
			}
		})

		const timeouts = checkTimeoutsRef.current
		return () => timeouts.forEach(clearTimeout)
	}, [selectedEntries])

	useEffect(() => {
		onRowsChange(markDuplicates(rows))
	}, [rows])

	const handleSlugChange = (row: ReviewRow, slug: string) => {
		if (!row.route) return
		const path = buildPath(slug)
		const route = row.route

		checkedPathsRef.current.set(row.key, path)
		updateRow(row.key, { slug, path, status: 'checking' })

		clearTimeout(checkTimeoutsRef.current.get(row.key))
		checkTimeoutsRef.current.set(
			row.key,
			setTimeout(() => checkPath(row.key, path, route), URL_CHECK_DELAY),
		)
	}

	const statusText: Record<RowStatus, { text: string; color: string }> = {
		loading: { text: '', color: 'neutral600' },
		checking: { text: '', color: 'neutral600' },
		ok: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.ok'),
				defaultMessage: 'OK',
			}),
			color: 'success600',
		},
		replaced: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.replaced'),
				defaultMessage: 'Path was taken, replaced',
			}),
			color: 'warning600',
		},
		blacklisted: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.blacklisted'),
				defaultMessage: 'Path is blocked',
			}),
			color: 'danger600',
		},
		duplicate: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.duplicate'),
				defaultMessage: 'Path is selected twice',
			}),
			color: 'danger600',
		},
		noRoute: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.noRoute'),
				defaultMessage: 'Entry has no route',
			}),
			color: 'danger600',
		},
		error: {
			text: formatMessage({
				id: getTranslation('modal.multiItem.status.error'),
				defaultMessage: 'Check failed',
			}),
			color: 'danger600',
		},
	}

	const displayedRows = markDuplicates(rows)

	return (
		// RawTable instead of Table: without the container's border, shadow and padding inside the modal
		<RawTable colCount={5} rowCount={displayedRows.length + 1} style={{ width: '100%' }}>
			<Thead>
				<Tr>
					<Th>
						<Typography variant="sigma">
							{formatMessage({
								id: getTranslation('modal.item.titleField.label'),
								defaultMessage: 'Title',
							})}
						</Typography>
					</Th>
					<Th>
						<Typography variant="sigma">
							{formatMessage({
								id: getTranslation('modal.item.slugField.label'),
								defaultMessage: 'Slug',
							})}
						</Typography>
					</Th>
					<Th>
						<Typography variant="sigma">
							{formatMessage({
								id: getTranslation('modal.item.pathField.label'),
								defaultMessage: 'Path',
							})}
						</Typography>
					</Th>
					<Th>
						<Typography variant="sigma">
							{formatMessage({
								id: getTranslation('modal.multiItem.status'),
								defaultMessage: 'Status',
							})}
						</Typography>
					</Th>
					<Th>
						<span />
					</Th>
				</Tr>
			</Thead>
			<Tbody>
				{displayedRows.map((row) => (
					<Tr key={row.key}>
						<Td>
							<Field.Root>
								<Field.Input
									aria-label={formatMessage({
										id: getTranslation('modal.item.titleField.label'),
										defaultMessage: 'Title',
									})}
									value={row.title}
									disabled={!row.route}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateRow(row.key, { title: e.target.value })
									}
								/>
							</Field.Root>
						</Td>
						<Td>
							<Field.Root>
								<Field.Input
									aria-label={formatMessage({
										id: getTranslation('modal.item.slugField.label'),
										defaultMessage: 'Slug',
									})}
									value={row.slug}
									disabled={!row.route}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										handleSlugChange(row, e.target.value)
									}
									// Normalized on blur only, while typing e.g. a space would be removed immediately
									onBlur={(e: React.ChangeEvent<HTMLInputElement>) =>
										updateRow(row.key, { slug: transformToUrl(e.target.value) })
									}
								/>
							</Field.Root>
						</Td>
						<Td>
							<Typography textColor="neutral600" ellipsis>
								{row.path ? `/${row.path}` : ''}
							</Typography>
						</Td>
						<Td>
							{row.status === 'loading' || row.status === 'checking' ? (
								<Loader small />
							) : (
								<Typography textColor={statusText[row.status].color}>
									{statusText[row.status].text}
								</Typography>
							)}
						</Td>
						<Td>
							<IconButton
								variant="ghost"
								type="button"
								label={formatMessage({
									id: getTranslation('modal.multiItem.remove'),
									defaultMessage: 'Remove from selection',
								})}
								onClick={() => setRows((current) => current.filter(({ key }) => key !== row.key))}
							>
								<Cross />
							</IconButton>
						</Td>
					</Tr>
				))}
			</Tbody>
		</RawTable>
	)
}
