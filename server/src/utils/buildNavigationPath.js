import { waNavItem } from '../../../utils'
import { duplicateCheck } from './'
export default async function buildNavigationPath({ slug, routeDocumentId, calculatedParent }) {
	var _a, _b, _c
	let parentDocumentId = calculatedParent
	let parent = null
	if (parentDocumentId) {
		do {
			const navItem = await strapi.documents(waNavItem).findOne({
				documentId: parentDocumentId,
				populate: ['route', 'parent'],
			})
			parent = navItem
			parentDocumentId =
				((_a = navItem === null || navItem === void 0 ? void 0 : navItem.parent) === null ||
				_a === void 0
					? void 0
					: _a.documentId) || null
			if (
				((_b = parent === null || parent === void 0 ? void 0 : parent.route) === null ||
				_b === void 0
					? void 0
					: _b.type) === 'internal'
			)
				break
		} while (parentDocumentId)
	}
	if (
		((_c = parent === null || parent === void 0 ? void 0 : parent.route) === null || _c === void 0
			? void 0
			: _c.type) !== 'internal'
	)
		parent = null
	if (slug.startsWith('/')) slug = slug.substring(1)
	const newPath = (parent === null || parent === void 0 ? void 0 : parent.route)
		? `${parent.route.path}/${slug}`
		: `${slug}`
	const validatedPath = await duplicateCheck(newPath, routeDocumentId)
	return validatedPath
}
