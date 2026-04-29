<div align="center">
  <h1>Strapi Webatlas</h1>
  <p>Navigation and slugs, finally in sync</p>
</div>

---

This plugin bridges the gap between slugs and navigations in Strapi, making URL management and menu building seamless. With automatic slug generation, a clear route overview, and support for multiple navigations, it keeps your content organized and your routes consistent — effortlessly.

---

This plugin is still in the early stages of development. Many features are planned but not yet implemented. The plugin is not fully documented. If you find any bugs, please contact me or create an issue.

---

### Table of Contents

1. [💎 Versions](#-versions)
2. [✨ Features](#-features)
3. [⏳ Installation](#-installation)
4. [🖐 Requirements](#-requirements)
5. [🔧 Configuration](#-configuration)
6. [📖 Usage](#-usage)
7. [🧩 Roadmap](#-roadmap)

## 💎 Versions

- **Strapi v5** - [v0.x.x (work in progress - beta)](https://github.com/mattisvensson/strapi-plugin-webatlas/releases)
- **Strapi v4** - not supported

## ✨ Features

- **🚀 Automatic Slug Generation:** Automatically generate clean, SEO-friendly slugs based on your content fields and the route hierarchy. No more manual slug writing — just choose the field, place it under a different route and the plugin takes care of the rest. Slugs are unique and easily customizable.
- **🗺️ Route Hierarchy and Overview:** Create a hierarchical structure for your routes and gain a full, centralized overview of all registered routes and their corresponding content entries.
- **🧭 Multiple Navigations** Support for creating and managing multiple navigation structures. Whether it's a main menu, footer links, or a custom mobile drawer — organize your content into any number of navigations with drag-and-drop sorting, nested items, and visibility toggles.
- **🧩 Composable Component Integration** Use plugin-generated slugs and navigations directly in your frontend. Fetch routes and navigation data by slug and with a consistent API response, optimized for dynamic rendering.
- **🧠 Conflict Detection & Validation** Webatlas prevents slug collisions and helps avoid route conflicts by validating changes in real time. Get clear error messages and automatic suggestions when something doesn’t align.

## ⏳ Installation

### Via command line

Install Webatlas via command line with a package manager of your choice.
Using NPM:

```bash
npm install @mattisvensson/strapi-plugin-webatlas@beta
```

Using Yarn:

```bash
yarn add @mattisvensson/strapi-plugin-webatlas@beta
```

As a next step you must configure your the plugin by the way you want to. See [🔧 Configuration](#-configuration) section.

## 🖐 Requirements

**Minimum environment requirements**

- Strapi `>=5.0.0`
- Node.js `>=22.0.0`

## 🔧 Configuration

To use a content type with Webatlas, you need to set the plugin options in the content type schema. You can do this by editing the content type's schema file located in `src/api/[content-type]/content-types/[content-type]/schema.json`.

Your schema should contain the following:

```json
{
	// ... other schema properties ...
	"pluginOptions": {
		"webatlas": {
			"enabled": true
		}
		// ... other plugin options ...
	}
}
```

### Settings page

Use the settings page to configure the plugin.

- **Generate path from:** Select a field from which the slug will automatically be generated. For example, use the 'title' field or a dedicated slug field.

## 📖 Usage

### Path Generation & Hierarchy

After selecting the source field for path generation in settings, you'll see the webatlas panel in the content editor sidebar:

**Parent Hierarchy (Place under)**: Select a parent page to create nested URLs (e.g., placing "Services" under "About" creates `/about/services`)

**Generated Path (Path)**: Automatically created from your selected field (e.g., "About Us" → `/about-us`)

**Override Option**: Check "Override automatic path generation" to set a custom URL that ignores the automatic generation and parent hierarchy. (Be careful: This breaks the automatic slug generation for this entry)

**Canonical Path (Canonical Path)**: Shows the complete URL based on content structure - automatically updates when you change the slug or parent relationship. Changes cascade to all child pages.

**UID Path (UID Path)**: A permanent identifier path that never changes, used as a backup URL.

### API endpoints

Webatlas provides two API endpoints. One to fetch routes and one to fetch navigations.

#### Fetch route

`GET /api/webatlas/path`

Query parameters:

- `slug` (string, required): The slug/path to fetch the route for. This can either be the generated path from webatlas, the uId path or the canonical path.
- `populate` (string, optional): Comma-separated list of relations to populate. Use `deep` to populate all relations in any depth.
- `populateDeepDepth` (string, optional): Depth for deep population.
- `fields` (string, optional): Comma-separated list of fields to include in the response.
- `status` (string, optional): `draft` or `published`. Default is `published`. Returns the draft or published version of the entity.

The response contains the entity's content type and a `webatlas` object with additional information about the path, including the canonical path, uidPath and slug.

#### Fetch navigation

`GET /api/webatlas/navigation`

One of these query parameters (`documentId`, `slug`, `name`, or `id`) are mandatory to fetch a navigation. If you provide multiple, `documentId` has the highest priority, followed by `slug`, `name` and `id`.

- `documentId` (string, optional): The document ID of the navigation to fetch.
- `slug` (string, optional): The slug of the navigation to fetch.
- `name` (string, optional): The name of the navigation to fetch.
- `id` (string, optional): The ID of the navigation to fetch.
- `variant` (string, optional): `nested` or `flat`. The variant of the navigation to fetch. Default is `nested`.

## 🧩 Roadmap

- More fine-grained RBAC
- Internationalization
- Redirects management

---

This plugin is still in development. Many features are planned but not yet implemented. The plugin is not fully documented. If you find any bugs, please contact me or create an issue.

---

## 📝 License

[MIT License](LICENSE.md) Copyright (c) [Matti Svensson](https://mattisvensson.dev/)

Webatlas v5 is based on the [plugin boilerplate](https://github.com/pluginpal/strapi-plugin-boilerplate#readme) by [PluginPal](https://www.pluginpal.io/).
