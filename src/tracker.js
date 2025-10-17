/**
 * Category Tracker
 * Periodically checks category product counts and sends notifications
 */

import cron from 'node-cron';
import { getAllSubscriptions, updateSubscription } from './database.js';
import { getCategoryInfo } from './goldappleApi.js';

export class CategoryTracker {
  constructor(bot) {
    this.bot = bot;
    this.cronJob = null;
  }

  /**
   * Start tracking categories
   * @param {number} intervalMinutes - Check interval in minutes (default: 5)
   */
  start(intervalMinutes = 5) {
    console.log(`🚀 Starting category tracker (checking every ${intervalMinutes} minutes)...`);

    // Cron schedule: */X * * * * means every X minutes
    const schedule = `*/${intervalMinutes} * * * *`;

    this.cronJob = cron.schedule(schedule, async () => {
      await this.checkAllCategories();
    });

    console.log('✅ Category tracker started successfully!');
  }

  /**
   * Stop tracking
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('⏹️ Category tracker stopped.');
    }
  }

  /**
   * Check all subscribed categories
   */
  async checkAllCategories() {
    try {
      const allSubscriptions = await getAllSubscriptions();
      const chatIds = Object.keys(allSubscriptions);

      if (chatIds.length === 0) {
        console.log('📭 No active subscriptions to check.');
        return;
      }

      console.log(`🔍 Checking ${chatIds.length} user(s) subscriptions...`);

      for (const chatId of chatIds) {
        const userSubscriptions = allSubscriptions[chatId];
        const categoryIds = Object.keys(userSubscriptions);

        for (const categoryId of categoryIds) {
          const subscription = userSubscriptions[categoryId];
          if (subscription.type === 'category') {
            await this.checkCategory(parseInt(chatId), parseInt(categoryId), subscription);
          }
        }
      }

      console.log('✅ Check completed!');
    } catch (error) {
      console.error('Error checking categories:', error);
    }
  }

  /**
   * Check single category
   * @param {number} chatId - Chat ID
   * @param {number} categoryId - Category ID
   * @param {Object} subscription - Subscription data
   */
  async checkCategory(chatId, categoryId, subscription) {
    try {
      const categoryInfo = await getCategoryInfo(categoryId);
      const currentCount = categoryInfo.productCount;
      const previousCount = subscription.lastProductCount;

      if (currentCount !== previousCount) {
        const diff = currentCount - previousCount;
        console.log(`📊 Category ${categoryId} changed: ${previousCount} → ${currentCount} (${diff > 0 ? '+' : ''}${diff})`);

        // Send notification about the change
        await this.bot.sendCategoryChangeNotification(chatId, {
          categoryId,
          categoryUrl: categoryInfo.url,
          previousCount,
          currentCount,
          diff
        });

        // Update subscription with new count
        await updateSubscription(chatId, categoryId, {
          lastProductCount: currentCount,
          productCount: currentCount
        });
      } else {
        // Just update last checked time
        await updateSubscription(chatId, categoryId, {
          lastProductCount: currentCount
        });
      }
    } catch (error) {
      console.error(`Error checking category ${categoryId} for user ${chatId}:`, error);
    }
  }

  /**
   * Manually trigger check for all categories
   */
  async checkNow() {
    console.log('🔍 Manual check triggered...');
    await this.checkAllCategories();
  }
}
