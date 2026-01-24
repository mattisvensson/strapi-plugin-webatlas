import type { Core } from '@strapi/strapi';
import { PluginConfig } from "../../../types";
import { PLUGIN_ID } from "../../../utils";
import { migrateFullPathToPath } from './001-fullPath-to-path';
import { migrateInternalWrapperToType } from './002-internal-wrapper-to-type';

interface MigrationInfo {
  version: string;
  name: string;
  migration: (strapi: Core.Strapi) => Promise<void>;
}

/**
 * List of all migrations in order
 */
const migrations: MigrationInfo[] = [
  {
    version: '1.0.0',
    name: 'fullPath to path migration',
    migration: migrateFullPathToPath
  },
  {
    version: '2.0.0', 
    name: 'internal/wrapper to type enum migration',
    migration: migrateInternalWrapperToType
  }
];

/**
 * Run all pending migrations
 */
export async function runMigrations(strapi: Core.Strapi): Promise<void> {
  try {
    const pluginStore = strapi.store({ type: 'plugin', name: PLUGIN_ID });
    const config = await pluginStore.get({ type: 'plugin', name: PLUGIN_ID }) as PluginConfig;
    const currentMigrationVersion = config?.migrationVersion || '0.0.0';

    console.log(`\n\nWebatlas: Current migration version: ${currentMigrationVersion}`);

    // Find migrations that need to be run
    const pendingMigrations = migrations.filter(migration => 
      compareVersions(migration.version, currentMigrationVersion) > 0
    );

    if (pendingMigrations.length === 0) {
      console.log('Webatlas: All migrations up to date, skipping...');
      return;
    }

    console.log(`Webatlas: Running ${pendingMigrations.length} pending migration(s)...`);

    // Run each pending migration
    for (const migration of pendingMigrations) {
      console.log(`Webatlas: Running migration ${migration.version}: ${migration.name}`);
      await migration.migration(strapi);
      
      // Update migration version after successful migration
      await pluginStore.set({ 
        type: 'plugin', 
        name: PLUGIN_ID, 
        value: { 
          ...config,
          migrationVersion: migration.version 
        }
      });
      
      console.log(`Webatlas: Migration ${migration.version} completed successfully`);
    }

    console.log('Webatlas: All migrations completed successfully\n\n');
  } catch (error) {
    console.error('Webatlas migration error:', error.message);
    throw error;
  }
}

/**
 * Simple semantic version comparison
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;
    
    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }
  
  return 0;
}