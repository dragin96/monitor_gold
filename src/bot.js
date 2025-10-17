/**
 * Telegram Bot Handler
 */

import TelegramBot from 'node-telegram-bot-api';
import {
  addCategorySubscription,
  removeSubscription,
  getUserSubscriptions,
  isSubscribed
} from './database.js';
import { getCategoryInfo } from './goldappleApi.js';

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
/track <categoryId> - Отслеживать категорию по ID
/list - Показать все отслеживаемые категории
/remove <categoryId> - Удалить категорию из отслеживания
/check <categoryId> - Проверить количество товаров в категории
/help - Показать справку

💡 Пример: /track 1000001798
      `;
      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const helpMessage = `
📖 Как использовать бота:

1️⃣ Откройте категорию/бренд на goldapple.ru
2️⃣ Найдите categoryId в запросе (в DevTools → Network)
3️⃣ Отправьте команду: /track 1000001798
4️⃣ Бот будет проверять количество товаров каждые 5 минут
5️⃣ Вы получите уведомление, когда количество изменится

🔍 Как найти categoryId:
1. Откройте раздел на goldapple.ru (например, /brands/flacon-magazine)
2. Откройте DevTools (F12) → вкладка Network
3. Найдите запрос к /front/api/catalog/cards-list
4. В теле запроса найдите "categoryId": 1000001798

⚙️ Команды:
/track <categoryId> - Отслеживать категорию
/list - Список отслеживаемых категорий
/remove <categoryId> - Удалить из отслеживания
/check <categoryId> - Проверить количество сейчас

💡 Пример categoryId для бренда Flacon Magazine: 1000001798
      `;
      this.bot.sendMessage(chatId, helpMessage);
    });

    // Track command
    this.bot.onText(/\/track (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const categoryId = parseInt(match[1].trim());

      if (isNaN(categoryId)) {
        this.bot.sendMessage(chatId, '❌ Неверный формат ID категории. Используйте число, например: /track 1000001798');
        return;
      }

      try {
        // Check if already subscribed
        if (await isSubscribed(chatId, categoryId)) {
          this.bot.sendMessage(chatId, '⚠️ Вы уже отслеживаете эту категорию.');
          return;
        }

        this.bot.sendMessage(chatId, '🔍 Проверяю категорию...');

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
      } catch (error) {
        console.error('Error tracking category:', error);
        this.bot.sendMessage(
          chatId,
          '❌ Ошибка при добавлении категории. Проверьте правильность ID категории.'
        );
      }
    });

    // List command
    this.bot.onText(/\/list/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        const subscriptions = await getUserSubscriptions(chatId);
        const items = Object.values(subscriptions);

        if (items.length === 0) {
          this.bot.sendMessage(chatId, '📭 У вас нет отслеживаемых категорий.\n\nИспользуйте /track <categoryId> чтобы добавить категорию.');
          return;
        }

        let message = '📋 Ваши отслеживаемые категории:\n\n';

        items.forEach((item, index) => {
          message += `${index + 1}. Category ID: ${item.categoryId}\n`;
          message += `   📊 Товаров: ${item.lastProductCount || item.productCount}\n`;
          message += `   🔗 https://goldapple.ru${item.url || ''}\n`;
          message += `   📅 Добавлено: ${new Date(item.subscribedAt).toLocaleString('ru-RU')}\n\n`;
        });

        message += '\n💡 Используйте /remove <categoryId> чтобы удалить категорию из отслеживания.';

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

    // Check command
    this.bot.onText(/\/check (.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const categoryId = parseInt(match[1].trim());

      if (isNaN(categoryId)) {
        this.bot.sendMessage(chatId, '❌ Неверный формат ID категории.');
        return;
      }

      try {
        this.bot.sendMessage(chatId, '🔍 Проверяю категорию...');

        const categoryInfo = await getCategoryInfo(categoryId);

        const message = `
📊 Информация о категории:

🆔 Category ID: ${categoryInfo.categoryId}
📦 Количество товаров: ${categoryInfo.productCount}
🔗 https://goldapple.ru${categoryInfo.url || ''}
🕐 Проверено: ${new Date(categoryInfo.timestamp).toLocaleString('ru-RU')}
        `;

        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error checking category:', error);
        this.bot.sendMessage(chatId, '❌ Ошибка при проверке категории. Проверьте правильность ID.');
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
