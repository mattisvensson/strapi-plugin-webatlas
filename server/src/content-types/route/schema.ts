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
    isOverride: {
      type: 'boolean',
      default: false,
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
     type: {
      type: 'enumeration',
      enum: ['internal', 'external', 'wrapper'],
      default: 'internal',
      configurable: false,
      required: true,
    },
    parent: {
      type: "relation",
      relation: "manyToOne",
      target: "plugin::webatlas.route",
      inversedBy: "children",
      configurable: false,
    },
    children: {
      type: "relation",
      relation: "oneToMany", 
      target: "plugin::webatlas.route",
      mappedBy: "parent",
      configurable: false,
    },
  }
}
