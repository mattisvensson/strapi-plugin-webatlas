import { DEFAULT_NAVIGATION_MAX_DEPTH } from '../../../../utils'

export default {
	collectionName: 'navigation',
	info: {
		singularName: 'navigation',
		pluralName: 'navigations',
		displayName: 'Navigation',
		name: 'navigation',
	},
	options: {
		increments: true,
		timestamps: true,
		comment: '',
	},
	pluginOptions: {
		'content-manager': {
			visible: false,
		},
		'content-type-builder': {
			visible: false,
		},
	},
	attributes: {
		name: {
			type: 'text',
			configurable: false,
			required: true,
		},
		slug: {
			type: 'uid',
			target: 'name',
			configurable: false,
			required: true,
		},
		visible: {
			type: 'boolean',
			default: false,
			configurable: false,
		},
		// Depth index of the deepest allowed level, 0 = root only. Only changed in the plugin settings
		maxDepth: {
			type: 'integer',
			default: DEFAULT_NAVIGATION_MAX_DEPTH,
			min: 0,
			configurable: false,
		},
		items: {
			type: 'relation',
			configurable: false,
			relation: 'oneToMany',
			target: 'plugin::webatlas.navitem',
			mappedBy: 'navigation',
		},
	},
}
