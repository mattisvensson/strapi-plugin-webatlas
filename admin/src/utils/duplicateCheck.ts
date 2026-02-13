import { transformToUrl, PLUGIN_ID} from "../../../utils";

/**
 * Checks if a URL is unique by making a GET request to the checkUniquePath endpoint.
 * @param fetchFunction The authenticated fetch function to make the request
 * @param path The path to check for uniqueness.
 * @param routeDocumentId The ID of the route to exclude from the check.
 * @param withoutTransform If true, the path will not be transformed/normalized before checking.
 * @returns A promise that resolves to the unique path if the request is successful.
 * @throws {Error} Throws an error if the request fails or the network response is not ok.
 */

export default async function duplicateCheck({
  fetchFunction,
  path,
  routeDocumentId,
  withoutTransform = false,
}: {
  fetchFunction: (path: string) => Promise<any>;
  path: string;
  routeDocumentId?: string | null;
  withoutTransform?: boolean;
}): Promise<string> {
  if (!path) throw new Error("URL is required");
  
  try {
    const pathToCheck = withoutTransform ? path : transformToUrl(path);
    const { data } = await fetchFunction(`/${PLUGIN_ID}/checkUniquePath?path=${pathToCheck}${routeDocumentId ? `&targetRouteDocumentId=${routeDocumentId}` : ''}`);

    if (!data.uniquePath) {
      throw new Error("Network response was not ok");
    }

    return data.uniquePath;
  } catch (err: any) {
    throw new Error("Failed to check URL uniqueness: " + err.message);
  }
}