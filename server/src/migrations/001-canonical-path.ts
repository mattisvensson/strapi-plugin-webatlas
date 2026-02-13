import type { Core } from '@strapi/strapi';
import { transformToUrl, waRoute } from '../../../utils';
import { buildCanonicalPath } from '../utils';

export default {
  version: '001',
  description: 'Migrate title field to canonicalPath using transformToUrl',
  async up(strapi: Core.Strapi) {
    strapi.log.info('[webatlas] Starting canonical path migration...');
    
    try {
      // Find all routes that have a title but no canonicalPath
      const routes = await strapi.db?.query(waRoute).findMany({
        where: {
          title: {
            $notNull: true,
            $ne: ''
          },
          $or: [
            { canonicalPath: { $null: true } },
            { canonicalPath: '' }
          ]
        },
        populate: ['parent']
      });
      
      if (!routes || routes.length === 0) {
        strapi.log.info('[webatlas] No routes found that need canonical path migration');
        return;
      }
      
      strapi.log.info(`[webatlas] Found ${routes.length} routes to migrate`);
      
      let migratedCount = 0;
      let errorCount = 0;
      
      // Process routes in chunks to avoid overwhelming the DB
      const chunkSize = 50;
      for (let i = 0; i < routes.length; i += chunkSize) {
        const chunk = routes.slice(i, i + chunkSize);
        
        await Promise.all(chunk.map(async (route) => {
          try {
            // Transform the title to URL format
            const transformedTitle = transformToUrl(route.title);
            
            // Build the canonical path considering parent relationships
            const parentId = route.parent?.id || null;
            const canonicalPath = await buildCanonicalPath(transformedTitle, parentId);
            
            // Update the route with the new canonical path
            await strapi.db?.query(waRoute).update({
              where: { id: route.id },
              data: { canonicalPath }
            });
            
            migratedCount++;
            
            if (migratedCount % 25 === 0) {
              strapi.log.info(`[webatlas] Migrated ${migratedCount}/${routes.length} routes`);
            }
          } catch (error) {
            strapi.log.error(`[webatlas] Failed to migrate route ${route.id}:`, error);
            errorCount++;
          }
        }));
      }
      
      strapi.log.info(`[webatlas] Canonical path migration completed. Migrated: ${migratedCount}, Errors: ${errorCount}`);
      
      if (errorCount > 0) {
        strapi.log.warn(`[webatlas] ${errorCount} routes failed to migrate. Check logs for details.`);
      }
    } catch (error) {
      strapi.log.error('[webatlas] Canonical path migration failed:', error);
      throw error;
    }
  }
};