/**
 * Simple storage for tracking category product counts
 */

import fs from 'fs/promises';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'data', 'category-counts.json');

/**
 * Ensure storage directory exists
 */
async function ensureStorageDir() {
  const dir = path.dirname(STORAGE_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

/**
 * Load stored category counts
 * @returns {Promise<Object>} Stored counts
 */
export async function loadCategoryCounts() {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet or is corrupted
    return {};
  }
}

/**
 * Save category counts
 * @param {Object} counts - Category counts to save
 * @returns {Promise<void>}
 */
export async function saveCategoryCounts(counts) {
  try {
    await ensureStorageDir();
    await fs.writeFile(STORAGE_FILE, JSON.stringify(counts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving category counts:', error);
    throw error;
  }
}

/**
 * Get count for specific category
 * @param {string} categoryKey - Category key
 * @returns {Promise<Object|null>} Category count data
 */
export async function getCategoryCount(categoryKey) {
  const counts = await loadCategoryCounts();
  return counts[categoryKey] || null;
}

/**
 * Update count for specific category
 * @param {string} categoryKey - Category key
 * @param {number} count - Product count
 * @param {string} timestamp - Timestamp
 * @returns {Promise<void>}
 */
export async function updateCategoryCount(categoryKey, count, timestamp = new Date().toISOString()) {
  const counts = await loadCategoryCounts();

  counts[categoryKey] = {
    count,
    timestamp,
    lastUpdated: timestamp
  };

  await saveCategoryCounts(counts);
}

/**
 * Get history for specific category
 * @param {string} categoryKey - Category key
 * @returns {Promise<Array>} History entries
 */
export async function getCategoryHistory(categoryKey) {
  try {
    const historyFile = path.join(process.cwd(), 'data', `${categoryKey}-history.json`);
    const data = await fs.readFile(historyFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

/**
 * Add history entry for category
 * @param {string} categoryKey - Category key
 * @param {number} count - Product count
 * @param {string} timestamp - Timestamp
 * @returns {Promise<void>}
 */
export async function addHistoryEntry(categoryKey, count, timestamp = new Date().toISOString()) {
  const history = await getCategoryHistory(categoryKey);

  history.push({
    count,
    timestamp
  });

  // Keep only last 100 entries
  if (history.length > 100) {
    history.shift();
  }

  const historyFile = path.join(process.cwd(), 'data', `${categoryKey}-history.json`);
  await ensureStorageDir();
  await fs.writeFile(historyFile, JSON.stringify(history, null, 2), 'utf-8');
}
