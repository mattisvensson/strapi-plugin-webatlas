import { StrapiApp } from '@strapi/admin/strapi-admin';
import { PLUGIN_ID, PLUGIN_NAME } from '../../utils';
import { Initializer } from './components/Initializer';
import { RouteIcon, NavigationIcon } from './components/PluginIcon';
import CMEditViewAside from './components/CMEditViewAside';
import pluginPermissions from './permissions';

export default {
  register(app: StrapiApp) {
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}/routes`,
      icon: RouteIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.routes`,
        defaultMessage: 'Routes',
      },
      Component: async () => {
        const component = await import('./pages/Routes');
        return { default: component.default };
      },
      permissions: [
          pluginPermissions['page.routes'][0],
      ],
    });
    app.addMenuLink({
      to: `/plugins/${PLUGIN_ID}/navigation`,
      icon: NavigationIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.navigation`,
        defaultMessage: 'Navigation',
      },
      Component: async () => {
        const component = await import('./pages/Navigation');
        return { default: component.default };
      },
      permissions: [
        pluginPermissions['page.navigation'][0],
      ],
    });
    app.addSettingsLink(
      {
        id: PLUGIN_ID,
        intlLabel: {
          id: `${PLUGIN_ID}.settings.section`,
          defaultMessage: PLUGIN_NAME,
        },
      },
      {
        intlLabel: {
          id: `${PLUGIN_ID}.settings.section.general`,
          defaultMessage: 'General',
        },
        id: `${PLUGIN_ID}-general`,
        to: `/settings/${PLUGIN_ID}/general`,
        Component: async () => {
          return await import(
            /* webpackChunkName: "webatlas-settings-general-page" */ './pages/Settings/General'
          );
        },
        permissions: [
          pluginPermissions['settings.general'][0],
        ],
      }
    )
    app.addSettingsLink(
      PLUGIN_ID,      
      {
        intlLabel: {
          id: `${PLUGIN_ID}.settings.navigation`,
          defaultMessage: 'Navigation',
        },
        id: `${PLUGIN_ID}-navigation`,
        to: `/settings/${PLUGIN_ID}/navigation`,
        Component: async () => {
          return await import(
            /* webpackChunkName: "webatlas-settings-navigation-page" */ './pages/Settings/Navigation'
          );
        },
        permissions: [
          pluginPermissions['settings.navigation'][0],
        ],
      }
    )

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID,
    });
  },

  bootstrap(app: StrapiApp) {
    // @ts-expect-error
    app.getPlugin('content-manager').apis.addEditViewSidePanel([() => ({
      title: 'URL Alias',
      content: <CMEditViewAside />,
    })]);
  },

  async registerTrads({ locales }: { locales: string[] }) {
    return Promise.all(
      locales.map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return { data, locale };
        } catch {
          return { data: {}, locale };
        }
      })
    );
  },
};