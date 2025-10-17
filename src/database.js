/**
 * Simple JSON-based database for storing subscriptions
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'subscriptions.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Load subscriptions from file
async function loadSubscriptions() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SUBSCRIPTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Save subscriptions to file
async function saveSubscriptions(subscriptions) {
  await ensureDataDir();
  await fs.writeFile(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2), 'utf-8');
}

/**
 * Add a category subscription for a user
 * @param {number} chatId - Telegram chat ID
 * @param {number} categoryId - Category ID
 * @param {Object} categoryInfo - Category information
 */
export async function addCategorySubscription(chatId, categoryId, categoryInfo) {
  const subscriptions = await loadSubscriptions();

  if (!subscriptions[chatId]) {
    subscriptions[chatId] = {};
  }

  subscriptions[chatId][categoryId] = {
    type: 'category',
    ...categoryInfo,
    subscribedAt: new Date().toISOString(),
    lastChecked: null,
    lastProductCount: categoryInfo.productCount
  };

  await saveSubscriptions(subscriptions);
}

/**
 * Remove a subscription for a user
 * @param {number} chatId - Telegram chat ID
 * @param {string|number} id - Category ID or Product item ID
 */
export async function removeSubscription(chatId, id) {
  const subscriptions = await loadSubscriptions();

  if (subscriptions[chatId]) {
    delete subscriptions[chatId][id];

    // Remove user entry if no subscriptions left
    if (Object.keys(subscriptions[chatId]).length === 0) {
      delete subscriptions[chatId];
    }

    await saveSubscriptions(subscriptions);
  }
}

/**
 * Get all subscriptions for a user
 * @param {number} chatId - Telegram chat ID
 * @returns {Object} User subscriptions
 */
export async function getUserSubscriptions(chatId) {
  const subscriptions = await loadSubscriptions();
  return subscriptions[chatId] || {};
}

/**
 * Get all subscriptions (all users)
 * @returns {Object} All subscriptions
 */
export async function getAllSubscriptions() {
  return await loadSubscriptions();
}

/**
 * Update subscription status
 * @param {number} chatId - Telegram chat ID
 * @param {string|number} id - Category ID or Product item ID
 * @param {Object} updates - Updates to apply
 */
export async function updateSubscription(chatId, id, updates) {
  const subscriptions = await loadSubscriptions();

  if (subscriptions[chatId] && subscriptions[chatId][id]) {
    subscriptions[chatId][id] = {
      ...subscriptions[chatId][id],
      ...updates,
      lastChecked: new Date().toISOString()
    };

    await saveSubscriptions(subscriptions);
  }
}

/**
 * Check if user is subscribed to a category
 * @param {number} chatId - Telegram chat ID
 * @param {number} categoryId - Category ID
 * @returns {boolean} True if subscribed
 */
export async function isSubscribed(chatId, categoryId) {
  const subscriptions = await loadSubscriptions();
  return !!(subscriptions[chatId] && subscriptions[chatId][categoryId]);
}
