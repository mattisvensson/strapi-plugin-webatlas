import { waRoute } from '../../../utils'
import { duplicateCheck } from '../utils'
export default async function cascadePathUpdates({
	validatedParentPath,
	parentRouteDocumentId,
	canonicalPath,
	isOverride,
}) {
	try {
		const children = await strapi.db.query(waRoute).findMany({
			where: {
				parent: {
					documentId: parentRouteDocumentId,
				},
			},
		})
		for (const child of children) {
			const newCanonicalPath = `${canonicalPath}/${child.slug}`
			const newPath = isOverride ? `${validatedParentPath}/${child.slug}` : newCanonicalPath
			const validatedCanonicalPath = await duplicateCheck(newCanonicalPath, child.documentId)
			const validatedPath = isOverride
				? await duplicateCheck(newPath, child.documentId)
				: validatedCanonicalPath
			await strapi.db.query(waRoute).updateMany({
				where: { documentId: child.documentId },
				data: {
					canonicalPath: validatedCanonicalPath,
					path: validatedPath,
				},
			})
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
			await cascadePathUpdates({
				validatedParentPath: validatedPath,
				parentRouteDocumentId: child.documentId,
				canonicalPath: validatedCanonicalPath,
				isOverride,
			})
		}
	} catch (err) {
		strapi.log.error(err)
	}
}
