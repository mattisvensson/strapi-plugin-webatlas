import type { UID } from '@strapi/strapi';
import { waRoute } from "../../../utils";
import { Route } from '../../../types/route';

export default async function buildCanonicalPath(slug: string, parentDocumentId: string): Promise<string> {
  try {
    const parentRoute: Route | null = await strapi.documents(waRoute as UID.ContentType).findOne({
      documentId: parentDocumentId
    }) as Route | null;

    const parentCanonicalPath = parentRoute?.canonicalPath || '';
    const canonicalPath = `${parentCanonicalPath ? parentCanonicalPath + '/' : ''}${slug}`;

    return canonicalPath;
  } catch (err) {
    console.error('Error building canonical path:', err);
    return slug; // Fallback to just the slug
  }
}
