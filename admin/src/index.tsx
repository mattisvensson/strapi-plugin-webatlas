import { prefixPluginTranslations } from '@strapi/helper-plugin';

import pluginPkg from '../../package.json';
import pluginId from '../../utils/pluginId';
import Initializer from './components/Initializer';
import { RouteIcon, NavigationIcon} from './components/PluginIcon';
import CMEditViewAside from './components/CMEditViewAside';

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${pluginId}/routes`,
      icon: RouteIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Routes',
      },
      Component: async () => {
        return await import('./pages/App');
      },
      permissions: [
        // Uncomment to set the permissions of the plugin here
        // {
        //   action: '', // the action name should be plugin::plugin-name.actionType
        //   subject: null,
        // },
      ],
    });
    app.addMenuLink({
      to: `/plugins/${pluginId}/navigation`,
      icon: NavigationIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'Navigation',
      },
      Component: async () => {
        return await import('./pages/App');
      },
      permissions: [
        // Uncomment to set the permissions of the plugin here
        // {
        //   action: '', // the action name should be plugin::plugin-name.actionType
        //   subject: null,
        // },
      ],
    });
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: {
          id: 'url-routes-plugin-title',
          defaultMessage: 'URL Routes Plugin',
        },
      },
      [
        {
          intlLabel: {
            id: 'url-routes-plugin-item',
            defaultMessage: 'Configuration',
          },
          id: name,
          to: `/settings/${pluginId}`,
          async Component() {
            return await import('./pages/Settings');
          },
        },
      ]
    );
    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) {
    app.injectContentManagerComponent('editView', 'right-links', {
      name: 'CMEditViewAside',
      Component: CMEditViewAside,
    });
  },

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map((locale) => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
