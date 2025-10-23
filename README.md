<div align="center">
  <h1>Strapi Webatlas</h1>
  <p>Navigation and slugs, finally in sync</p>
</div>

---

This plugin bridges the gap between slugs and navigations in Strapi, making URL management and menu building seamless. With automatic slug generation, a clear route overview, and support for multiple navigations, it keeps your content organized and your routes consistent—effortlessly.

---

This plugin is still in the early stages of development. Many features are planned but not yet implemented. The plugin is not fully documented. If you find any bugs, please contact me or create an issue.

---

### Table of Contents

1. [💎 Versions](#versions)
2. [✨ Features](#features)
3. [⏳ Installation](#installation)
4. [🖐 Requirements](#requirements)
5. [🔧 Configuration](#configuration)
6. [🧩 Roadmap](#roadmap)

## 💎 Versions

- **Strapi v5** - [v0.x.x (work in progress - beta)](https://github.com/mattisvensson/strapi-plugin-webatlas/tree/main)
- **Strapi v4** - not supported
## ✨ Features

- **🚀 Automatic Slug Generation:** Automatically generate clean, SEO-friendly slugs based on your content fields. No more manual slug writing — just choose the field, and the plugin takes care of the rest. Slugs are unique and easily customizable.
- **🗺️ Route Overview Page:** Gain a full, centralized overview of all registered routes and their corresponding content entries.
- **🧭 Multiple Navigations** Support for creating and managing multiple navigation structures. Whether it's a main menu, footer links, or a custom mobile drawer — organize your content into any number of navigations with drag-and-drop sorting, nested items, and visibility toggles.
- **🧩 Composable Component Integration** Use plugin-generated slugs and navigations directly in your frontend. Fetch routes and navigation data by slug and with a consistent API response, optimized for dynamic rendering.
- **🧠 Conflict Detection & Validation** Webatlas prevents slug collisions and helps avoid route conflicts by validating changes in real time. Get clear error messages and automatic suggestions when something doesn’t align.

## ⏳ Installation

### Via command line
Install Webatlas via command line with a package manager of your choice.
Using NPM:
```bash
npm install strapi-plugin-webatlas@beta
```

Using Yarn:
```bash
yarn add strapi-plugin-webatlas@beta
```

As a next step you must configure your the plugin by the way you want to. See [**Configuration**](#🔧-configuration) section.

All done. Enjoy 🎉

## 🖐 Requirements

**Minimum environment requirements**

- Node.js `>=20.0.0`
- NPM `>=10.x.x`

## 🔧 Configuration

To use a content type with Webatlas, you need to set the plugin options in the content type schema. You can do this by editing the content type's schema file located in `src/api/[content-type]/content-types/[content-type]/schema.json`.

Your schema should contain the following:

```json
{
  // ... other schema properties ...
  "pluginOptions": {
    "webatlas": {
      "active": true
    },
    // ... other plugin options ...
  }
}
```

You can then still enable or disable the plugin for each content type in the settings page of the plugin without the need to edit the schema file again or redeploy your Strapi instance.

### Settings page

Use the settings page to configure the plugin.

- **Enable content types:** Select for which content types the plugin should be available.

For each selected content type, you have the following settings:

- **Default URL Alias field:** Select a field from which the slug will automatically be generated. For example, use the 'title' field or a dedicated slug field.
- **URL Alias pattern:** Create a default pattern for the slug. For example, when creating a 'news' content type and you want your url structure to be like '/news/some-title' for all entities, enter 'news' in this setting field. The slug will automatically be appended to this string.
- **URL Alias API field:** Allows you to append the current URL (slug) of an entity to a specific field. This is especially useful when working with components like a "teaser"—for example, you can store the slug in a hidden field within the teaser component. This way, you can fetch just the teaser via the API while still having access to its full URL.

## 🧩 Roadmap

- RBAC
- User action feedback
- Internationalization
- Plugin translations
- Draft and published
- Route page
  - Filters
  - Nested url structure
- Entity page
 - Add to navigation from entity
- Settings
  - Navigation settings
    - Max nested items
    - Prevent navigation deletion
- Navigation page
  - Custom fields for nav items
  - Nested paths through wrapper/external item
  - Move navigation item with children
  - Item search
  - Collapse items
  - Multi action for items
- Redirects management

---

This plugin is still in the early stages of development. Many features are planned but not yet implemented. The plugin is not fully documented. If you find any bugs, please contact me or create an issue.

---

## 📝 License

[MIT License](LICENSE.md) Copyright (c) [Matti Svensson](https://mattisvensson.dev/)

Webatlas v5 is based on the [plugin boilerplate](https://github.com/pluginpal/strapi-plugin-boilerplate#readme) by [PluginPal](https://www.pluginpal.io/).

> Copyright (c) 2025 PluginPal.
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: