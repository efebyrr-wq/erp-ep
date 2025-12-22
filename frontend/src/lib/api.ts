// TODO: Replace with CloudFront HTTPS URL once AWS account is verified
// Current issue: Frontend (HTTPS) cannot call Backend (HTTP) due to mixed content policy
// Solution: Set up CloudFront distribution for HTTPS (see CLOUDFRONT_SETUP.md)
// Pin production to CloudFront to avoid mixed content, regardless of env gaps.
// Dev/local can still use explicit env or default localhost.
// For local development, always use localhost unless explicitly overridden
// For production builds, use CloudFront
const API_BASE_URL = (() => {
  // If VITE_API_BASE_URL is explicitly set, use it (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  
  // For production builds (when deployed), use CloudFront
  if (import.meta.env.MODE === 'production' && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://d31tialuhzl449.cloudfront.net';
  }
  
  // Default to localhost for local development
  return 'http://localhost:3000';
})();

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
  useLargePayloadUrl?: boolean,
): Promise<TOutput | null> {
  // Calculate payload size if needed
  let apiUrl = API_BASE_URL;
  if (useLargePayloadUrl) {
    const payloadSize = JSON.stringify(payload).length;
    const payloadSizeMB = payloadSize / (1024 * 1024);
    apiUrl = getApiUrlForLargePayload(payloadSizeMB);
  }
  
  console.log(`[apiPost] Making POST request to: ${apiUrl}${path}`);
  console.log(`[apiPost] Payload:`, JSON.stringify(payload, null, 2));
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log(`[apiPost] Response status:`, response.status);
    console.log(`[apiPost] Response headers:`, Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API POST ${path} failed:`, response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log(`[apiPost] Response data:`, data);
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
  useLargePayloadUrl?: boolean,
): Promise<TOutput | null> {
  try {
    // Calculate payload size if provided
    let apiUrl = API_BASE_URL;
    if (useLargePayloadUrl && payload) {
      const payloadSize = JSON.stringify(payload).length;
      const payloadSizeMB = payloadSize / (1024 * 1024);
      apiUrl = getApiUrlForLargePayload(payloadSizeMB);
    }
    
    const response = await fetch(`${apiUrl}${path}`, {
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

// Elastic Beanstalk URL for large uploads (bypasses CloudFront 20MB limit)
// Try HTTPS first (if EB has SSL certificate), fallback to HTTP
const EB_BASE_URL_HTTPS = 'https://Deployment-erp-env-v4.eba-xspmy4pt.eu-north-1.elasticbeanstalk.com';
const EB_BASE_URL_HTTP = 'http://Deployment-erp-env-v4.eba-xspmy4pt.eu-north-1.elasticbeanstalk.com';

// Get API URL for large payloads (bypasses CloudFront)
export function getApiUrlForLargePayload(payloadSizeMB: number): string {
  const LARGE_PAYLOAD_THRESHOLD = 10; // Use EB for payloads > 10MB
  
  if (payloadSizeMB > LARGE_PAYLOAD_THRESHOLD && import.meta.env.MODE === 'production') {
    console.warn(`Payload size ${payloadSizeMB.toFixed(2)}MB exceeds threshold. Using Elastic Beanstalk URL directly to bypass CloudFront limit.`);
    // Try HTTPS first (if available), otherwise use HTTP
    // Note: If HTTPS is not available, browser will block due to mixed content policy
    // In that case, EB environment needs to be configured with HTTPS listener
    return EB_BASE_URL_HTTPS;
  }
  
  return API_BASE_URL;
}

export { API_BASE_URL };





