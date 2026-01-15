import { transformToUrl, PLUGIN_ID} from "../../../utils";

/**
 * Checks if a URL is unique by making a GET request to the checkUniquePath endpoint.
 * @param get The authenticated GET function from useFetchClient
 * @param url The URL to check.
 * @param routeDocumentId The ID of the route to exclude from the check.
 * @returns A promise that resolves to the response text if the request is successful.
 * @throws {Error} Throws an error if the request fails or the network response is not ok.
 */

export default async function duplicateCheck(
  get: (url: string) => Promise<any>, 
  url: string, 
  routeDocumentId?: string | null
): Promise<string> {
  if (!url) throw new Error("URL is required");
  
  try {
    const { data } = await get(`/${PLUGIN_ID}/checkUniquePath?path=${transformToUrl(url)}${routeDocumentId ? `&targetRouteDocumentId=${routeDocumentId}` : ''}`);

    if (!data.uniquePath) {
      throw new Error("Network response was not ok");
    }

    return data.uniquePath;
  } catch (err) {
    console.error("Error in duplicateCheck:", err);
    throw new Error("Failed to check URL uniqueness");
  }
}