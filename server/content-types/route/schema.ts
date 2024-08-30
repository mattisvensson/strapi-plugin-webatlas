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
    fullPath: {
      type: "string",
      configurable: false,
    },
    slug: {
      type: "string",
      configurable: false,
    },
    uidPath: {
      type: "string",
      configurable: false,
    },
    isOverride: {
      type: 'boolean',
      default: false,
      configurable: false,
    },
    internal: {
      type: 'boolean',
      default: true,
      configurable: false,
    },
    active: {
      type: 'boolean',
      default: true,
      configurable: false,
    },
    navitem: {
      type: "relation",
      relation: "oneToOne",
      target: "plugin::webatlas.navitem",
      configurable: false,
    },
    wrapper: {
      type: "boolean",
      default: false,
      configurable: false,
    },
  }
}
