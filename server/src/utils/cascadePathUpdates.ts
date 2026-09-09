import type { UID } from '@strapi/strapi'
import { waRoute } from '../../../utils'
import { Route } from '../../../types'
import { duplicateCheck } from '../utils'

export default async function cascadePathUpdates({
	validatedParentPath,
	parentRouteDocumentId,
	canonicalPath,
	isOverride,
}: {
	validatedParentPath: string
	parentRouteDocumentId: string
	canonicalPath: string
	isOverride: boolean
}) {
	const children = (await strapi.db.query(waRoute).findMany({
		where: {
			parent: {
				documentId: parentRouteDocumentId,
			},
		},
	})) as Route[]

	for (const child of children) {
		const newCanonicalPath = `${canonicalPath}/${child.slug}`
		const validatedCanonicalPath = await duplicateCheck(newCanonicalPath, child.documentId)

		// A manually overridden path was set by the editor and must survive changes to its
		// ancestors — only the canonical path keeps cascading
		let validatedPath = child.path
		if (!child.isOverride) {
			validatedPath = isOverride
				? await duplicateCheck(`${validatedParentPath}/${child.slug}`, child.documentId)
				: validatedCanonicalPath
		}

		await strapi.db.query(waRoute).updateMany({
			where: { documentId: child.documentId },
			data: {
				canonicalPath: validatedCanonicalPath,
				path: validatedPath,
			},
		})

		// The entry-level webatlas field is optional: only schemas that declare it have the column.
		// Without it updateMany() gets no known attribute and fails with "Update requires data".
		// Skipping is safe because API responses read the path from the route table (enrichWebatlasData)
		if (strapi.contentTypes[child.relatedContentType]?.attributes?.webatlas) {
			const existingEntry = await strapi.db.query(child.relatedContentType).findOne({
				where: { documentId: child.relatedDocumentId },
			})

			if (existingEntry) {
				await strapi.db.query(child.relatedContentType).updateMany({
					where: { documentId: child.relatedDocumentId },
					data: {
						webatlas: {
							...existingEntry.webatlas,
							path: validatedPath,
						},
					},
				})
			}
		}

		await cascadePathUpdates({
			validatedParentPath: validatedPath,
			parentRouteDocumentId: child.documentId,
			canonicalPath: validatedCanonicalPath,
			// Once a route diverges from its canonical path, its descendants follow the path chain
			isOverride: isOverride || Boolean(child.isOverride),
		})
	}
}
