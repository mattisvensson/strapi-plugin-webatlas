export default {
  collectionName: "route",
  info: {
    singularName: "route",
    pluralName: "routes",
    displayName: "Route",
    name: "route"
  },
  options: {
    increments: true,
    timestamps: true,
    comment: "Route"
  },
  pluginOptions: {
    "content-manager": {
      visible: true
    },
    "content-type-builder": {
      visible: true
    },
  },
  attributes: {
    relatedContentType: {
      type: "string",
      required: true,
      configurable: false,
    },
    relatedId: {
      type: "integer",
      required: true,
      configurable: false,
    },
    title: {
      type: "string",
      required: true,
      configurable: false,
    },
    path: {
      type: "string",
      required: true,
      configurable: false,
      targetField: "title",
    },
    menuAttached: {
      type: 'boolean',
      default: false,
      configurable: false,
    },
    isInternal: {
      type: 'boolean',
      default: true,
      configurable: false,
    },
    navitem: {
      type: "relation",
      relation: "oneToMany",
      target: "plugin::url-routes.navitem",
      configurable: false,
      mappedBy: "route"
    },
  }
}
