export default {
  collectionName: "navigation",
  info: {
    singularName: "navigation",
    pluralName: "navigations",
    displayName: "Navigation",
    name: "navigation"
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
    name: {
      type: "text",
      configurable: false,
      required: true
    },
    slug: {
      type: "uid",
      target: "name",
      configurable: false,
      required: true
    },
    visible: {
      type: "boolean",
      default: false,
      configurable: false
    },
    items: {
      type: "relation",
      relation: "manyToMany",
      target: "plugin::url-routes.route",
      configurable: false,
      mappedBy: "navigation"
    },
  }
}
