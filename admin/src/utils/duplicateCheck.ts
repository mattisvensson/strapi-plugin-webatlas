import transformToUrl from "../../../utils/transformToUrl";

/**
 * Checks if a URL is unique by making a POST request.
 * @param url The URL to check.
 * @returns A promise that resolves to the response text if the request is successful.
 * @throws {Error} Throws an error if the request fails or the network response is not ok.
 */

export default async function duplicateCheck(url: string): Promise<string> {
  if (!url) throw new Error("URL is required");

  try {
    const res = await fetch('/url-routes/checkUniquePath', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: transformToUrl(url)
      }),
    });

    if (!res.ok) throw new Error(`Network response was not ok: ${res.status} ${res.statusText}`);
    
    return await res.text();
  } catch (err) {
    console.error("Error in duplicateCheck:", err);
    throw new Error("Failed to check URL uniqueness");
  }
}