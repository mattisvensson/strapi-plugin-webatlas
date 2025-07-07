import { StrapiApp } from '@strapi/admin/strapi-admin';
import pluginPkg from '../../package.json';
import { PLUGIN_ID, PLUGIN_NAME } from './pluginId';
import { Initializer } from './components/Initializer';
import { RouteIcon, NavigationIcon } from './components/PluginIcon';
import CMEditViewAside from './components/CMEditViewAside';
// import Navigation from './pages/Navigation';
// import Routes from './pages/Routes';
import Settings from './pages/Settings';
import { App } from './pages/App';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `./plugins/${PLUGIN_ID}/routes`,
      icon: RouteIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.routes`,
        defaultMessage: 'Routes',
      },
      Component() {
        // return Routes;
        return App;
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
      to: `./plugins/${PLUGIN_ID}/navigation`,
      icon: NavigationIcon,
      intlLabel: {
        id: `${PLUGIN_ID}.link.navigation`,
        defaultMessage: 'Navigation',
      },
      Component() {
        // return Navigation;
        return App;
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
        id: PLUGIN_ID,
        intlLabel: {
          id: `${PLUGIN_ID}.settings.section`,
          defaultMessage: 'Webatlas',
        },
      },
      [
        {
          intlLabel: {
            id: `${PLUGIN_ID}.settings.configuration`,
            defaultMessage: 'Configuration',
          },
          id: PLUGIN_NAME,
          to: `${PLUGIN_ID}/configuration`,
          Component() {
            return Settings;
          },
        },
      ]
    );

    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_NAME,
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