// declare module '@strapi/strapi' {
//   namespace Schema {
//     interface ContentTypePluginOptions {
//       webatlas?: {
//         active?: boolean;
//         // Add other webatlas options here if needed
//       };
//     }
//   }
// }

export type ContentType = {
  uid: string;
  isDisplayed: boolean;
  apiID: string;
  kind: string;
  info: {
    name: string;
    description: string;
    singularName: string;
    pluralName: string;
    displayName: string;
  };
  attributes: {
    [key: string]: any;
  }
  pluginOptions: {
    webatlas?: {
      enabled: boolean;
    };
  };
};

export type ConfigContentType = {
  uid: string;
  label: string;
  default: string;
  pattern?: string;
}

export type PluginConfig = {
  selectedContentTypes: ConfigContentType[];
  navigation: {
    maxDepth: number;
  }
  migrationVersion?: string;
};


export type Entity = {
  id: number;
  createdAt: string;
  createdBy: User;
  updatedAt: string | null;
  updatedBy: User | null;
  publishedAt: string | null;
  [key: string]: any;
}

export type GroupedEntities = {
  entities: Entity[],
  contentType: ConfigContentType,
}

export type User = {
  id: number;
  firstname: string;
  lastname: string;
  username: string | null;
}