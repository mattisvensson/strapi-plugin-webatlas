import transformToUrl from "../../../utils/transformToUrl";

/**
 * Checks if a URL is unique by making a POST request.
 * @param url The URL to check.
 * @param routeId The ID of the route to exclude from the check.
 * @returns A promise that resolves to the response text if the request is successful.
 * @throws {Error} Throws an error if the request fails or the network response is not ok.
 */

export default async function duplicateCheck(url: string, routeDocumentId?: string | null): Promise<string> {
  if (!url) throw new Error("URL is required");
  
  try {
    const res = await fetch(`/webatlas/checkUniquePath?path=${transformToUrl(url)}${routeDocumentId ? `&targetRouteDocumentId=${routeDocumentId}` : ''}`);

    if (!res.ok) throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
    
    return await res.text();
  } catch (err) {
    console.error("Error in duplicateCheck:", err);
    throw new Error("Failed to check URL uniqueness");
  }
}