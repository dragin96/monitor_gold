/**
 * Test implementation for bot integration
 * Demonstrates how to use the category tracker in a bot
 */

import {
  fetchCategoryProductCount,
  compareProductCounts,
  formatProductCountMessage
} from './categoryTracker.js';

import {
  getCategoryCount,
  updateCategoryCount,
  addHistoryEntry
} from './storage.js';

import { closeBrowserApi } from './goldappleApiBrowser.js';

/**
 * Check category for changes
 * @param {string} categoryKey - Category key
 * @returns {Promise<Object>} Check result
 */
export async function checkCategoryChanges(categoryKey) {
  try {
    console.log(`\n🔍 Checking category: ${categoryKey}`);

    // Get current stored count
    const storedData = await getCategoryCount(categoryKey);
    const oldCount = storedData ? storedData.count : 0;

    console.log(`Previous count: ${oldCount}`);

    // Fetch new count
    const freshData = await fetchCategoryProductCount(categoryKey);
    const newCount = freshData.productCount;

    console.log(`Current count: ${newCount}`);

    // Compare counts
    const comparison = compareProductCounts(oldCount, newCount);

    // Format message
    const message = formatProductCountMessage(freshData.categoryName, comparison);

    // Update storage
    await updateCategoryCount(categoryKey, newCount, freshData.timestamp);
    await addHistoryEntry(categoryKey, newCount, freshData.timestamp);

    return {
      categoryKey,
      categoryName: freshData.categoryName,
      categoryUrl: freshData.categoryUrl,
      comparison,
      message,
      timestamp: freshData.timestamp
    };
  } catch (error) {
    console.error(`Error checking category ${categoryKey}:`, error);
    throw error;
  }
}

/**
 * Simulate bot command: /check <category>
 * @param {string} categoryKey - Category key
 * @returns {Promise<string>} Response message
 */
export async function handleCheckCommand(categoryKey) {
  try {
    const result = await checkCategoryChanges(categoryKey);
    return result.message;
  } catch (error) {
    return `❌ Ошибка при проверке категории: ${error.message}`;
  }
}
