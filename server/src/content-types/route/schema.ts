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
      visible: false
    },
    "content-type-builder": {
      visible: false
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
    relatedDocumentId: {
      type: "string",
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
    path: {
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
    documentIdPath: {
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
      configurable: true,
      relation: "oneToMany",
      target: "plugin::webatlas.navitem",
      mappedBy: "route",
    },
    wrapper: {
      type: "boolean",
      default: false,
      configurable: false,
    },
  }
}
