import type { Core } from '@strapi/strapi';
import { waRoute, PLUGIN_ID } from "../../../utils";

/**
 * Migration: Copy fullPath to path for existing routes
 * Version: 1.0.0
 */
export async function migrateFullPathToPath(strapi: Core.Strapi): Promise<void> {
  try {
    const routes = await strapi.db.query(waRoute).findMany({
      select: ['documentId', 'fullPath', 'path'],
    });

    let migratedCount = 0;
    for (const route of routes) {
      if (route.fullPath && !route.path) {
        await strapi.db.query(waRoute).update({
          where: { documentId: route.documentId },
          data: { 
            path: route.fullPath,
          }
        });
        migratedCount++;
      }
    }

    console.log(`\nWebatlas Migration 001: Successfully migrated ${migratedCount} routes from fullPath to path`);
  } catch (error) {
    console.warn('\nWebatlas Migration 001 warning:', error.message);
    throw error;
  }
}