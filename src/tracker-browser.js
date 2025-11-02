/**
 * Category Tracker with Browser Support
 * Tracks product count changes using browser automation
 */

import cron from 'node-cron';
import {
  checkCategoryChanges,
  checkAllCategories
} from './bot-test.js';
import { closeBrowserApi } from './goldappleApiBrowser.js';

export class BrowserCategoryTracker {
  constructor(bot) {
    this.bot = bot;
    this.cronJob = null;
    this.isRunning = false;
    this.subscribers = new Set();
  }

  /**
   * Add subscriber to receive notifications
   * @param {number} chatId - Telegram chat ID
   */
  addSubscriber(chatId) {
    this.subscribers.add(chatId);
    console.log(`➕ Added subscriber: ${chatId}`);
  }

  /**
   * Remove subscriber
   * @param {number} chatId - Telegram chat ID
   */
  removeSubscriber(chatId) {
    this.subscribers.delete(chatId);
    console.log(`➖ Removed subscriber: ${chatId}`);
  }

  /**
   * Get all subscribers
   * @returns {Set} Set of chat IDs
   */
  getSubscribers() {
    return this.subscribers;
  }

  /**
   * Notify all subscribers
   * @param {string} message - Message to send
   */
  async notifySubscribers(message) {
    for (const chatId of this.subscribers) {
      try {
        await this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error(`Failed to notify ${chatId}:`, error.message);
      }
    }
  }

  /**
   * Check categories and notify subscribers
   */
  async performCheck() {
    console.log(`\n🔄 [${new Date().toLocaleString()}] Starting scheduled check...`);

    try {
      const results = await checkAllCategories();

      // Notify only about changes
      for (const result of results) {
        if (!result.error && result.comparison && result.comparison.changed) {
          console.log(`📢 Change detected: ${result.message}`);
          await this.notifySubscribers(result.message);
        }
      }

      console.log(`✅ Check completed`);
    } catch (error) {
      console.error('❌ Error during check:', error);
    }
  }

  /**
   * Start tracking
   * @param {number} intervalMinutes - Check interval in minutes
   */
  start(intervalMinutes = 5) {
    if (this.isRunning) {
      console.log('⚠️  Tracker is already running');
      return;
    }

    console.log(`\n🚀 Starting category tracker (interval: every ${intervalMinutes} minutes)`);

    // Create cron schedule
    const cronSchedule = `*/${intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(cronSchedule, async () => {
      await this.performCheck();
    });

    this.isRunning = true;
    console.log('✅ Tracker started successfully');

    // Run first check immediately
    setTimeout(() => {
      console.log('🔄 Running initial check...');
      this.performCheck();
    }, 2000);
  }

  /**
   * Stop tracking
   */
  async stop() {
    if (!this.isRunning) {
      console.log('⚠️  Tracker is not running');
      return;
    }

    console.log('\n⏹️  Stopping category tracker...');

    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }

    // Close browser
    await closeBrowserApi();

    this.isRunning = false;
    console.log('✅ Tracker stopped');
  }

  /**
   * Get tracker status
   * @returns {Object} Status info
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      subscriberCount: this.subscribers.size,
      subscribers: Array.from(this.subscribers)
    };
  }
}
