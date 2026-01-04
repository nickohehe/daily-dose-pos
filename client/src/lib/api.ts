
interface FetchOptions extends RequestInit {
    retries?: number;
    backoff?: number;
}

export async function fetchWithRetry(url: string, options: FetchOptions = {}) {
    const { retries = 3, backoff = 500, ...fetchOptions } = options; // Default 500ms initial backoff

    let attempt = 0;

    while (attempt <= retries) {
        try {
            const response = await fetch(url, fetchOptions);

            // If server error (5xx) or network error, retry. 
            // Client errors (4xx) like 400 Bad Request or 404 Not Found should NOT retry usually, 
            // but "Failed to get menu" might be a 500.
            if (!response.ok && response.status >= 500) {
                throw new Error(`Server error: ${response.status}`);
            }

            return response;
        } catch (error) {
            attempt++;
            if (attempt > retries) {
                throw error;
            }

            // Exponential backoff with jitter
            const delay = backoff * Math.pow(1.5, attempt - 1) + Math.random() * 100;
            console.warn(`[Network] Request failed, retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error('Max retries reached');
}
