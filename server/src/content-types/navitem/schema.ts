export default {
  collectionName: "navitem",
  info: {
    singularName: "navitem",
    pluralName: "navitems",
    displayName: "Navigation Item",
    name: "navitem"
  },
  options: {
    increments: true,
    timestamps: true,
    comment: ""
  },
  pluginOptions: {
    "content-manager": {
      visible: false
    },
    "content-type-builder": {
      visible: false
    }
  },
  attributes: {
    navigation: {
      type: "relation",
      configurable: false,
      relation: "manyToOne",
      target: "plugin::webatlas.navigation",
      inversedBy: "items",
    },
    route: {
      type: "relation",
      configurable: false,
      relation: "manyToOne",
      target: "plugin::webatlas.route",
      inversedBy: "navitem",
    },
    parent: {
      type: "relation",
      configurable: false,
      relation: "oneToOne",
      target: "plugin::webatlas.navitem",
    },
    order: {
      type: "integer",
      default: 0,
    },
  }
}
