import { useCallback, useRef } from 'react';

const cache = new Map();

export function useProductFetcher() {
  const abortControllerRef = useRef();
  const activeRequestRef = useRef(null);

  const fetchProducts = useCallback(async (queryString) => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    const cachedData = cache.get(queryString);
    if (cachedData) {
      return cachedData;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // If there's an active request for this query, wait for it
      if (activeRequestRef.current?.[queryString]) {
        return await activeRequestRef.current[queryString];
      }

      // Create new request promise
      const requestPromise = fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/api/products?${queryString}`,
        { signal: controller.signal }
      ).then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        // Cache the result
        cache.set(queryString, data);
        return data;
      });

      // Store active request
      activeRequestRef.current = {
        ...activeRequestRef.current,
        [queryString]: requestPromise
      };

      const data = await requestPromise;

      // Clean up active request
      delete activeRequestRef.current?.[queryString];

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      // Clear cache on error
      cache.delete(queryString);
      throw error;
    }
  }, []);

  const clearCache = useCallback(() => {
    cache.clear();
  }, []);

  return { fetchProducts, clearCache };
}