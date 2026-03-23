/**
 * Duden.de API client for scraping word information
 * Based on endpoints from the Python duden project
 */

import { DudenWord, SearchResult, CacheEntry } from "../types/duden";
import { parseWordDetails, parseSearchResults } from "../utils/parser";

const BASE_URL = "https://www.duden.de";
const WORD_URL = `${BASE_URL}/rechtschreibung`;
const SEARCH_URL = `${BASE_URL}/suchen/dudenonline`;
const REQUEST_TIMEOUT = 10000; // 10 seconds
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Simple in-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Check if cache entry is still valid
 */
function isCacheValid<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < entry.ttl;
}

/**
 * Get data from cache if valid
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && isCacheValid(entry)) {
    return entry.data;
  }
  // Remove expired entries
  if (entry) {
    cache.delete(key);
  }
  return null;
}

/**
 * Store data in cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: CACHE_TTL,
  });
}

/**
 * Make HTTP request with timeout and error handling
 */
async function makeRequest(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      throw new Error("Word not found");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
    throw new Error("Unknown error occurred");
  }
}

/**
 * Search for words on Duden.de
 */
export async function searchWords(query: string): Promise<SearchResult[]> {
  if (query.length < 3) {
    return [];
  }

  const cacheKey = `search:${query}`;
  const cached = getFromCache<SearchResult[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${SEARCH_URL}/${encodeURIComponent(query)}`;
    const html = await makeRequest(url);
    const results = parseSearchResults(html);

    // Limit to 12 results as discussed
    const limitedResults = results.slice(0, 12);

    setCache(cacheKey, limitedResults);
    return limitedResults;
  } catch (error) {
    if (error instanceof Error && error.message === "Word not found") {
      // Return empty array for 404s as discussed
      return [];
    }
    console.error("Search error:", error);
    throw error;
  }
}

/**
 * Get detailed word information
 */
export async function getWordDetails(urlname: string): Promise<DudenWord> {
  const cacheKey = `word:${urlname}`;
  const cached = getFromCache<DudenWord>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = `${WORD_URL}/${encodeURIComponent(urlname)}`;
    const html = await makeRequest(url);
    const word = parseWordDetails(html);

    if (!word) {
      throw new Error("Failed to parse word details");
    }

    setCache(cacheKey, word);
    return word;
  } catch (error) {
    console.error("Word details error:", error);
    throw error;
  }
}

/**
 * Combined search and get details function
 * If only one result, automatically fetch details
 */
export async function searchAndGetDetails(query: string): Promise<{ results: SearchResult[]; singleWord?: DudenWord }> {
  const results = await searchWords(query);

  // If exactly one result, fetch details immediately as discussed
  if (results.length === 1) {
    try {
      const singleWord = await getWordDetails(results[0].urlname);
      return { results, singleWord };
    } catch (error) {
      // If details fetch fails, just return the search result
      console.error("Failed to fetch details for single result:", error);
      return { results };
    }
  }

  return { results };
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear();
}
