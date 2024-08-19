export default {
  collectionName: "navitem",
  info: {
    singularName: "navitem",
    pluralName: "navitems",
    displayName: "Navigation Items",
    name: "navitems"
  },
  options: {
    increments: true,
    comment: ""
  },
  pluginOptions: {
    "content-manager": {
      visible: true
    },
    "content-type-builder": {
      visible: true
    }
  },
  attributes: {
    navigation: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::url-routes.navigation",
      configurable: false,
      inversedBy: "items",
    },
    route: {
      type: "relation",
      relation: "oneToOne",
      target: "plugin::url-routes.route",
      configurable: false,
    },
    parent: {
      type: "relation",
      relation: "oneToOne",
      target: "plugin::url-routes.navitem",
      configurable: false,
    },
    order: {
      type: "integer",
      default: 0,
    },
  }
}
