import type { Core } from '@strapi/strapi';
import { waRoute, PLUGIN_ID } from "../../../utils";

/**
 * Migration: Convert boolean internal/wrapper fields to type enum
 * Version: 2.0.0
 * 
 * Converts:
 * - internal: true, wrapper: false → type: 'internal'
 * - internal: false, wrapper: false → type: 'external'  
 * - internal: false, wrapper: true → type: 'wrapper'
 */
export async function migrateInternalWrapperToType(strapi: Core.Strapi): Promise<void> {
  try {
    // Get all routes with the old boolean fields
    const routes = await strapi.db.query(waRoute).findMany({
      select: ['documentId', 'internal', 'wrapper', 'type'],
    });

    let migratedCount = 0;
    for (const route of routes) {
      let newType: 'internal' | 'external' | 'wrapper';
      
      // Determine the new type based on old boolean values
      if (route.wrapper === true) {
        newType = 'wrapper';
      } else if (route.internal === false) {
        newType = 'external';
      } else {
        newType = 'internal'; // Default for internal: true or undefined
      }

      console.log(`Route ${route.documentId}: internal=${route.internal}, wrapper=${route.wrapper} → type=${newType}`);
      // Only update if the type field is different or missing
      if (route.type !== newType) {
        await strapi.db.query(waRoute).update({
          where: { documentId: route.documentId },
          data: { 
            type: newType,
          }
        });
        migratedCount++;
      }
    }

    console.log(`Webatlas Migration 002: Successfully migrated ${migratedCount} routes from internal/wrapper to type enum`);
  } catch (error) {
    console.warn('Webatlas Migration 002 warning:', error.message);
    throw error;
  }
}