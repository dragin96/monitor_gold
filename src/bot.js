/**
 * Telegram Bot Handler
 * Supports both numeric categoryId and text category keys
 */

import TelegramBot from 'node-telegram-bot-api';
import {
  addCategorySubscription,
  removeSubscription,
  getUserSubscriptions,
  isSubscribed
} from './database.js';
import { getCategoryInfo } from './goldappleApi.js';
import { handleCheckCommand } from './bot-test.js';
import { getCategoryInfo as getCategoryInfoByKey, getAllCategoryKeys } from './categoryTracker.js';

export class GoldAppleBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupCommands();
  }

  setupCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🛍️ Добро пожаловать в GoldApple Category Tracker!

Этот бот поможет вам отслеживать изменения количества товаров в категориях на goldapple.ru

📌 Доступные команды:
/check <category> - Проверить категорию (по ключу или ID)
/categories - Показать доступные категории
/track <categoryId> - Отслеживать категорию по ID
/trackall - Подписаться на ВСЕ категории сразу
/list - Показать все отслеживаемые категории
/remove <categoryId> - Удалить категорию из отслеживания
/help - Показать справку

💡 Примеры:
/check flacon-magazine
/check 1000001798
/categories
      `;
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📖 Как использовать бота:

🔹 Два способа проверки категорий:

1️⃣ По текстовому ключу (новый способ):
   • Используйте /categories чтобы увидеть доступные категории
   • Пример: /check flacon-magazine

2️⃣ По числовому ID (старый способ):
   • Найдите categoryId в DevTools → Network
   • Запрос: /front/api/catalog/cards-list
   • Пример: /track 1000001798

⚙️ Основные команды:

/check <category> - Проверить категорию (ключ или ID)
  Примеры:
  • /check flacon-magazine
  • /check 1000001798

/categories - Показать все доступные категории

/track <categoryId> - Добавить отслеживание по ID
/list - Список отслеживаемых категорий
/remove <categoryId> - Удалить из отслеживания

💡 Рекомендуем использовать текстовые ключи - они проще!
      `;
      this.bot.sendMessage(chatId, helpMessage);
    });

    // Track command - supports both numeric ID and text keys
    this.bot.onText(/\/track (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const input = match[1].trim();

      try {
        this.bot.sendMessage(chatId, '🔍 Проверяю категорию...');

        // Try to parse as number first (old format)
        const categoryId = parseInt(input);

        if (!isNaN(categoryId)) {
          // Numeric ID - use old tracking system
          if (await isSubscribed(chatId, categoryId)) {
            this.bot.sendMessage(chatId, '⚠️ Вы уже отслеживаете эту категорию.');
            return;
          }

          // Fetch category info
          const categoryInfo = await getCategoryInfo(categoryId);

          // Add subscription
          await addCategorySubscription(chatId, categoryId, categoryInfo);

          const message = `
✅ Категория добавлена в отслеживание!

🆔 Category ID: ${categoryInfo.categoryId}
📊 Количество товаров: ${categoryInfo.productCount}
🔗 https://goldapple.ru${categoryInfo.url || ''}

⏳ Я буду проверять изменения каждые 5 минут и уведомлю вас, когда количество товаров изменится.
          `;

          this.bot.sendMessage(chatId, message);
        } else {
          // Text key - use browser-based tracking
          const categoryKey = input;
          const categoryInfo = getCategoryInfoByKey(categoryKey);

          if (!categoryInfo) {
            this.bot.sendMessage(chatId, `❌ Категория "${categoryKey}" не найдена.\n\nИспользуйте /categories для списка доступных категорий.`);
            return;
          }

          // Check if already subscribed
          if (await isSubscribed(chatId, categoryKey)) {
            this.bot.sendMessage(chatId, '⚠️ Вы уже отслеживаете эту категорию.');
            return;
          }

          // Fetch current count using browser
          const checkResult = await handleCheckCommand(categoryKey);

          // Extract count from the message (this is a simple approach)
          // The message format is: "📊 CategoryName: Без изменений (X товаров)"
          // or "📈/📉 CategoryName: ..."

          // For now, fetch fresh data
          const { fetchCategoryProductCount } = await import('./categoryTracker.js');
          const freshData = await fetchCategoryProductCount(categoryKey);

          // Add subscription with text key
          await addCategorySubscription(chatId, categoryKey, {
            categoryName: categoryInfo.name,
            categoryUrl: categoryInfo.url,
            productCount: freshData.productCount
          });

          const message = `
✅ Категория добавлена в отслеживание!

📝 Ключ: ${categoryKey}
📂 Название: ${categoryInfo.name}
📊 Текущее количество: ${freshData.productCount} товаров
🔗 ${categoryInfo.url}

⏳ Я буду проверять изменения каждые 5 минут и уведомлю вас, когда количество товаров изменится.

💡 Используется браузерная автоматизация для обхода защиты.
          `;

          this.bot.sendMessage(chatId, message);
        }
      } catch (error) {
        console.error('Error tracking category:', error);
        this.bot.sendMessage(
          chatId,
          '❌ Ошибка при добавлении категории. Проверьте правильность ID или ключа категории.'
        );
      }
    });

    // List command
    this.bot.onText(/\/list/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const subscriptions = await getUserSubscriptions(chatId);
        const entries = Object.entries(subscriptions);

        if (entries.length === 0) {
          this.bot.sendMessage(chatId, '📭 У вас нет отслеживаемых категорий.\n\nИспользуйте /track <category> для добавления (поддерживаются текстовые ключи и числовые ID).');
          return;
        }

        let message = '📋 Ваши отслеживаемые категории:\n\n';

        entries.forEach(([key, item], index) => {
          const isTextKey = item.categoryKey !== null && item.categoryKey !== undefined;

          message += `${index + 1}. `;
          if (isTextKey) {
            message += `🔑 ${item.categoryKey}\n`;
            message += `   📂 ${item.categoryName || 'Без названия'}\n`;
          } else {
            message += `🆔 ${item.categoryId || key}\n`;
          }

          message += `   📊 Товаров: ${item.lastProductCount || item.productCount}\n`;
          message += `   🔗 ${item.categoryUrl || item.url || 'N/A'}\n`;
          message += `   📅 Добавлено: ${new Date(item.subscribedAt).toLocaleString('ru-RU')}\n`;

          if (isTextKey) {
            message += `   🌐 Тип: Браузерная проверка\n`;
          } else {
            message += `   ⚡ Тип: API проверка\n`;
          }

          message += '\n';
        });

        message += '💡 Используйте /remove <category> для удаления.';

        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error listing subscriptions:', error);
        this.bot.sendMessage(chatId, '❌ Ошибка при загрузке списка категорий.');
      }
    });

    // Remove command
    this.bot.onText(/\/remove (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const categoryId = parseInt(match[1].trim());

      if (isNaN(categoryId)) {
        this.bot.sendMessage(chatId, '❌ Неверный формат ID категории.');
        return;
      }

      try {
        if (!(await isSubscribed(chatId, categoryId))) {
          this.bot.sendMessage(chatId, '⚠️ Вы не отслеживаете эту категорию.');
          return;
        }

        await removeSubscription(chatId, categoryId);
        this.bot.sendMessage(chatId, `✅ Категория ${categoryId} удалена из отслеживания.`);
      } catch (error) {
        console.error('Error removing subscription:', error);
        this.bot.sendMessage(chatId, '❌ Ошибка при удалении категории.');
      }
    });

    // Check command - supports both numeric ID and text keys
    this.bot.onText(/\/check (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const input = match[1].trim();

      try {
        this.bot.sendMessage(chatId, '🔍 Проверяю категорию...');

        // Try to parse as number first (old format)
        const categoryId = parseInt(input);

        if (!isNaN(categoryId)) {
          // Numeric ID - use old API method
          const categoryInfo = await getCategoryInfo(categoryId);

          const message = `
📊 Информация о категории:

🆔 Category ID: ${categoryInfo.categoryId}
📦 Количество товаров: ${categoryInfo.productCount}
🔗 https://goldapple.ru${categoryInfo.url || ''}
🕐 Проверено: ${new Date(categoryInfo.timestamp).toLocaleString('ru-RU')}
          `;

          this.bot.sendMessage(chatId, message);
        } else {
          // Text key - use browser-based method
          const categoryKey = input;

          // Check if category exists
          const categoryInfo = getCategoryInfoByKey(categoryKey);
          if (!categoryInfo) {
            this.bot.sendMessage(chatId, `❌ Категория "${categoryKey}" не найдена.\n\nИспользуйте /categories для списка доступных категорий.`);
            return;
          }

          const message = await handleCheckCommand(categoryKey);
          this.bot.sendMessage(chatId, message);
        }
      } catch (error) {
        console.error('Error checking category:', error);
        this.bot.sendMessage(chatId, '❌ Ошибка при проверке категории. Проверьте правильность ID или ключа категории.');
      }
    });

    // Categories command - show available text-based categories
    this.bot.onText(/\/categories/, (msg) => {
      const chatId = msg.chat.id;
      const categories = getAllCategoryKeys();

      if (categories.length === 0) {
        this.bot.sendMessage(chatId, '📋 Нет доступных категорий');
        return;
      }

      let message = '📋 Доступные категории:\n\n';
      categories.forEach(key => {
        const info = getCategoryInfoByKey(key);
        message += `• ${key}\n  ${info.name}\n  ${info.url}\n\n`;
      });

      message += '\n💡 Используйте /check <category-key> для проверки категории.\nПример: /check flacon-magazine';

      this.bot.sendMessage(chatId, message);
    });

    // Track all categories command
    this.bot.onText(/\/trackall/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const categories = getAllCategoryKeys();

        if (categories.length === 0) {
          this.bot.sendMessage(chatId, '❌ Нет доступных категорий для отслеживания.');
          return;
        }

        this.bot.sendMessage(chatId, `🔄 Начинаю подписку на ${categories.length} категорий...\n\nЭто может занять некоторое время.`);

        const { fetchCategoryProductCount } = await import('./categoryTracker.js');
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const categoryKey of categories) {
          try {
            // Check if already subscribed
            if (await isSubscribed(chatId, categoryKey)) {
              console.log(`Category ${categoryKey} already subscribed, skipping`);
              successCount++; // Count as success if already subscribed
              continue;
            }

            const categoryInfo = getCategoryInfoByKey(categoryKey);

            // Fetch current count using browser
            const freshData = await fetchCategoryProductCount(categoryKey);

            // Add subscription with text key
            await addCategorySubscription(chatId, categoryKey, {
              categoryName: categoryInfo.name,
              categoryUrl: categoryInfo.url,
              productCount: freshData.productCount
            });

            successCount++;
            console.log(`✓ Subscribed to ${categoryKey}: ${freshData.productCount} products`);

            // Add delay between requests to avoid being blocked
            await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));
          } catch (error) {
            errorCount++;
            errors.push({ categoryKey, error: error.message });
            console.error(`✗ Failed to subscribe to ${categoryKey}:`, error);
          }
        }

        // Send summary
        let summaryMessage = `\n✅ Подписка завершена!\n\n`;
        summaryMessage += `📊 Успешно: ${successCount} из ${categories.length}\n`;

        if (errorCount > 0) {
          summaryMessage += `❌ Ошибок: ${errorCount}\n\n`;
          summaryMessage += `Ошибки:\n`;
          errors.forEach(err => {
            summaryMessage += `• ${err.categoryKey}: ${err.error}\n`;
          });
        }

        summaryMessage += `\n💡 Используйте /list для просмотра отслеживаемых категорий.`;

        this.bot.sendMessage(chatId, summaryMessage);
      } catch (error) {
        console.error('Error in trackall command:', error);
        this.bot.sendMessage(chatId, '❌ Ошибка при массовой подписке на категории.');
      }
    });
  }

  /**
   * Send notification about category change
   * @param {number} chatId - Chat ID
   * @param {Object} changeInfo - Change information
   */
  async sendCategoryChangeNotification(chatId, changeInfo) {
    const { categoryId, categoryUrl, previousCount, currentCount, diff } = changeInfo;

    const emoji = diff > 0 ? '📈' : '📉';
    const changeText = diff > 0 ? 'увеличилось' : 'уменьшилось';
    const diffText = diff > 0 ? `+${diff}` : `${diff}`;

    const message = `
${emoji} ИЗМЕНЕНИЕ В КАТЕГОРИИ!

🆔 Category ID: ${categoryId}
📊 Было товаров: ${previousCount}
📊 Стало товаров: ${currentCount}
${emoji} Изменение: ${diffText} товар(ов)

Количество товаров ${changeText}!
🔗 https://goldapple.ru${categoryUrl || ''}
    `;

    try {
      await this.bot.sendMessage(chatId, message);
    } catch (error) {
      console.error(`Error sending notification to ${chatId}:`, error);
    }
  }

  /**
   * Get bot instance
   */
  getBot() {
    return this.bot;
  }
}
