import set from 'lodash/set'
export default ({ strapi }) => {
	Object.values(strapi.contentTypes).forEach((contentType) => {
		var _a, _b
		// Only add fields to content types that have webatlas enabled in plugin options
		if (
			!((_b = (_a = contentType.pluginOptions) === null || _a === void 0 ? void 0 : _a.webatlas) ===
				null || _b === void 0
				? void 0
				: _b.enabled)
		)
			return
		const { attributes } = contentType
		const fieldSettings = {
			writable: true,
			configurable: false,
			editable: false,
			visible: true,
			default: null,
		}
		set(attributes, 'webatlas', {
			...fieldSettings,
			type: 'json',
			private: false,
		})
	})
}
