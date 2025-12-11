// TODO: Replace with CloudFront HTTPS URL once AWS account is verified
// Current issue: Frontend (HTTPS) cannot call Backend (HTTP) due to mixed content policy
// Solution: Set up CloudFront distribution for HTTPS (see CLOUDFRONT_SETUP.md)
// Pin production to CloudFront to avoid mixed content, regardless of env gaps.
// Dev/local can still use explicit env or default localhost.
const API_BASE_URL =
  import.meta.env.MODE === 'production'
    ? 'https://d31tialuhzl449.cloudfront.net'
    : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000');

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`API GET ${path} failed – using fallback data`, error);
    return fallback;
  }
}

export async function apiPost<TInput extends Record<string, unknown>, TOutput>(
  path: string,
  payload: TInput,
): Promise<TOutput | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API POST ${path} failed:`, response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return data as TOutput;
    }
    console.warn(`API POST ${path} returned non-JSON response`);
    return null;
  } catch (error) {
    console.error(`API POST ${path} failed:`, error);
    throw error; // Re-throw to let caller handle it
  }
}

export async function apiPatch<TInput extends Record<string, unknown>, TOutput>(
  path: string,
  payload?: TInput,
): Promise<TOutput | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API PATCH ${path} failed:`, response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      return data as TOutput;
    }
    console.warn(`API PATCH ${path} returned non-JSON response`);
    return null;
  } catch (error) {
    console.error(`API PATCH ${path} failed:`, error);
    throw error; // Re-throw to let caller handle it
  }
}

export async function apiDelete<TOutput = undefined>(
  path: string,
): Promise<TOutput | true | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      return (await response.json()) as TOutput;
    }
    return true;
  } catch (error) {
    console.warn(`API DELETE ${path} failed`, error);
    return null;
  }
}

export { API_BASE_URL };





