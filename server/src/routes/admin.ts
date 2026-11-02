import { PLUGIN_ID } from '../../../utils'

export default {
	type: 'admin',
	routes: [
		// Config
		{
			method: 'GET',
			path: '/config',
			handler: 'admin.getConfig',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [
								`plugin::${PLUGIN_ID}.settings.general.read`,
								`plugin::${PLUGIN_ID}.settings.navigation.read`,
								`plugin::${PLUGIN_ID}.navigation.read`,
								`plugin::${PLUGIN_ID}.cm.aside`,
							],
						},
					},
				],
			},
		},
		{
			method: 'PUT',
			path: '/config',
			handler: 'admin.updateConfig',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.settings.general.update`],
						},
					},
				],
			},
		},

		// Route
		{
			method: 'GET',
			path: '/route',
			handler: 'admin.getAllRoutes',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.page.routes`, `plugin::${PLUGIN_ID}.cm.aside`],
						},
					},
				],
			},
		},
		{
			method: 'GET',
			path: '/route/related',
			handler: 'admin.getRelatedRoute',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.cm.aside`, `plugin::${PLUGIN_ID}.navigation.read`],
						},
					},
				],
			},
		},
		// The max depth is a structural setting, so it is only changed in the plugin settings
		{
			method: 'GET',
			path: '/settings/navigation-depths',
			handler: 'admin.getNavigationDepths',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.settings.navigation.read`],
						},
					},
				],
			},
		},
		{
			method: 'PUT',
			path: '/settings/navigation-depths',
			handler: 'admin.updateNavigationDepths',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.settings.navigation.update`],
						},
					},
				],
			},
		},
		{
			method: 'GET',
			path: '/route/related/batch',
			handler: 'admin.getRelatedRoutes',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.read`],
						},
					},
				],
			},
		},
		{
			method: 'GET',
			path: '/route/prohibitedIds/:documentId?',
			handler: 'admin.getProhibitedRouteIds',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.cm.aside`],
						},
					},
				],
			},
		},
		{
			method: 'GET',
			path: '/route/:documentId',
			handler: 'admin.getRoute',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.read`],
						},
					},
				],
			},
		},

		// Navigation
		{
			method: 'GET',
			path: '/navigation',
			handler: 'admin.getNavigation',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.read`],
						},
					},
				],
			},
		},
		{
			method: 'POST',
			path: '/navigation',
			handler: 'admin.createNavigation',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.create`],
						},
					},
				],
			},
		},
		{
			method: 'PUT',
			path: '/navigation',
			handler: 'admin.updateNavigation',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.update`],
						},
					},
				],
			},
		},
		{
			method: 'PUT',
			path: '/navigation/items',
			handler: 'admin.updateNavigationItemStructure',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.edit-items`],
						},
					},
				],
			},
		},
		{
			method: 'DELETE',
			path: '/navigation',
			handler: 'admin.deleteNavigation',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.navigation.delete`],
						},
					},
				],
			},
		},

		// Utility Routes
		{
			method: 'GET',
			path: '/checkUniquePath',
			handler: 'admin.checkUniquePath',
			config: {
				policies: [
					'admin::isAuthenticatedAdmin',
					{
						name: `plugin::${PLUGIN_ID}.has-permissions`,
						config: {
							actions: [`plugin::${PLUGIN_ID}.cm.aside`, `plugin::${PLUGIN_ID}.navigation.read`],
						},
					},
				],
			},
		},
	],
}
