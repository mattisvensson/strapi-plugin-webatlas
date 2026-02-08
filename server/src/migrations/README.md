# Webatlas Plugin Migrations

This directory contains the migration system for the Webatlas Strapi plugin.

## Overview

The migration system automatically runs database migrations when the plugin bootstraps, ensuring that data transformations and schema changes are applied consistently across environments.

## How It Works

1. **Migration Files**: Each migration is a TypeScript file in this directory following the naming pattern `XXX-description.ts` where `XXX` is a 3-digit version number.

2. **Migration Structure**: Each migration exports a default object with:
   - `version`: A string version identifier (e.g., '001')
   - `description`: A human-readable description of what the migration does
   - `up`: An async function that performs the migration

3. **Version Tracking**: The system tracks the current migration version in the plugin store and only runs migrations that haven't been executed yet.

4. **Automatic Execution**: Migrations run automatically during plugin bootstrap, before other initialization logic.

## Existing Migrations

### 001-canonical-path.ts
Migrates existing route titles to canonical paths using the `transformToUrl` utility. This migration:
- Finds all routes with titles but missing canonical paths
- Transforms the title using `transformToUrl()`
- Builds proper canonical paths considering parent-child relationships
- Updates routes in batches for performance

## Troubleshooting

- **Migration Failed**: Check Strapi logs for detailed error messages
- **Stuck Migration**: If a migration fails partway through, you may need to manually fix data and update the migration version
- **Version Conflicts**: Ensure version numbers are unique and properly ordered

## Version History

- `001`: Initial canonical path migration from title field (February 2026)