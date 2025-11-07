const fetchWithParams = (baseUrl: string, params: Record<string, string | number | boolean | null>, init?: RequestInit): Promise<Response> => {
    const url = new URL(baseUrl);

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
        }
    }

    return fetch(url, init);
};

export { fetchWithParams };
