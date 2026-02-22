import { StrapiApp } from '@strapi/admin/strapi-admin';
import { PLUGIN_ID, PLUGIN_NAME } from '../../utils';
import { Initializer } from './components/Initializer';
import { PathIcon, NavigationIcon } from './components/PluginIcon';
import CMEditViewAside from './components/CMEditViewAside';
import pluginPermissions from './permissions';

export default {
  register(app: StrapiApp) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}/paths`,
      icon: PathIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.paths`,
        defaultMessage: 'Paths',
      },
      Component: () => import('./pages/Paths'),
      permissions: [
          pluginPermissions['page.routes'][0],
      ],
    });
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}/navigation`,
      icon: NavigationIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.navigation`,
        defaultMessage: 'Navigation',
      },
      Component: () => import('./pages/Navigation'),
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
        to: `${PLUGIN_ID}/general`,
        Component: () => import('./pages/Settings/General'),
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
        to: `${PLUGIN_ID}/navigation`,
        Component: () => import('./pages/Settings/Navigation'),
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
    app.getPlugin('content-manager').apis.addEditViewSidePanel([CMEditViewAside]);
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
