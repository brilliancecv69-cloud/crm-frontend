import { useState, useEffect, useCallback } from 'react';
import axios from '../axios';

/**
 * A custom hook to fetch data from the API.
 * It handles loading, error, and data states automatically.
 *
 * @param {string | null} url - The API endpoint to fetch from. Can be null to prevent fetching initially.
 * @returns {{
 * data: any,
 * loading: boolean,
 * error: string | null,
 * refetch: () => void
 * }}
 */
export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    // If URL is not provided, don't fetch.
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axios.get(url);
      if (res.data.ok) {
        setData(res.data.data);
      } else {
        setError(res.data.error || 'An unexpected error occurred.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch data.';
      setError(errorMessage);
      console.error(`[useFetch Error] URL: ${url}`, err);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}