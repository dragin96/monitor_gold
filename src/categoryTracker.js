/**
 * Category Tracker
 * Tracks product count changes for GoldApple categories using browser automation
 */

import { fetchProductCountFromPage } from './goldappleApiBrowser.js';

/**
 * Category configuration
 */
const CATEGORIES = {
  'flacon-magazine': {
    name: 'Flacon Magazine',
    url: 'https://goldapple.ru/brands/flacon-magazine'
  },
  'goldapplebox': {
    name: 'goldapplebox',
    url: 'https://goldapple.ru/brands/goldapplebox'
  },
  'darling': {
    name: 'darling',
    url: 'https://goldapple.ru/brands/darling/darling'
  }
};

/**
 * Get category info by key
 * @param {string} categoryKey - Category key
 * @returns {Object|null} Category info
 */
export function getCategoryInfo(categoryKey) {
  return CATEGORIES[categoryKey] || null;
}

/**
 * Get all category keys
 * @returns {Array<string>} Array of category keys
 */
export function getAllCategoryKeys() {
  return Object.keys(CATEGORIES);
}

/**
 * Add custom category
 * @param {string} key - Category key
 * @param {string} name - Category name
 * @param {string} url - Category URL
 */
export function addCategory(key, name, url) {
  CATEGORIES[key] = { name, url };
}

/**
 * Fetch current product count for a category
 * @param {string} categoryKey - Category key
 * @returns {Promise<Object>} Product count data
 */
export async function fetchCategoryProductCount(categoryKey) {
  const category = getCategoryInfo(categoryKey);

  if (!category) {
    throw new Error(`Category not found: ${categoryKey}`);
  }

  try {
    const result = await fetchProductCountFromPage(category.url);

    return {
      categoryKey,
      categoryName: category.name,
      categoryUrl: category.url,
      productCount: result.data.productCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching category ${categoryKey}:`, error);
    throw error;
  }
}

/**
 * Compare product counts
 * @param {number} oldCount - Old product count
 * @param {number} newCount - New product count
 * @returns {Object} Comparison result
 */
export function compareProductCounts(oldCount, newCount) {
  const difference = newCount - oldCount;
  const percentChange = oldCount > 0 ? ((difference / oldCount) * 100).toFixed(2) : 0;

  return {
    oldCount,
    newCount,
    difference,
    percentChange: parseFloat(percentChange),
    changed: difference !== 0,
    increased: difference > 0,
    decreased: difference < 0
  };
}

/**
 * Format product count change message
 * @param {string} categoryName - Category name
 * @param {Object} comparison - Comparison result
 * @returns {string} Formatted message
 */
export function formatProductCountMessage(categoryName, comparison) {
  if (!comparison.changed) {
    return `📊 ${categoryName}: Без изменений (${comparison.newCount} товаров)`;
  }

  const emoji = comparison.increased ? '📈' : '📉';
  const sign = comparison.increased ? '+' : '';

  return `${emoji} ${categoryName}:\n` +
    `Было: ${comparison.oldCount} товаров\n` +
    `Стало: ${comparison.newCount} товаров\n` +
    `Изменение: ${sign}${comparison.difference} (${sign}${comparison.percentChange}%)`;
}
