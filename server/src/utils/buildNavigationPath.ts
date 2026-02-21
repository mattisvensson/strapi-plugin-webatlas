import type { Route } from "../../../types";
import { duplicateCheck } from "./";

export default async function buildNavigationPath({
  parent,
  slug,
  routeDocumentId,
}: {
  parent: Route | undefined,
  slug: string,
  routeDocumentId?: string,
}): Promise<string> {

  if (slug.startsWith('/')) slug = slug.substring(1);

  const newPath = parent ? `${parent.path}/${slug}` : `${slug}`;
  const validatedPath = await duplicateCheck(newPath, routeDocumentId);

  return validatedPath;
}
