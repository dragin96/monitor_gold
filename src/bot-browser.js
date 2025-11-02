/**
 * Telegram Bot with Browser Support
 */

import TelegramBot from 'node-telegram-bot-api';
import { handleCheckCommand, handleCheckAllCommand } from './bot-test.js';
import { getAllCategoryKeys, getCategoryInfo } from './categoryTracker.js';

export class BrowserGoldAppleBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.setupCommands();
    this.setupErrorHandling();
  }

  /**
   * Setup bot commands
   */
  setupCommands() {
    // /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
👋 Привет! Я бот для отслеживания изменений в категориях GoldApple.

📋 Доступные команды:

/check <category> - Проверить категорию
/checkall - Проверить все категории
/categories - Список доступных категорий
/subscribe - Подписаться на уведомления
/unsubscribe - Отписаться от уведомлений
/status - Статус трекера
/help - Показать эту справку

Пример: /check flacon-magazine
      `;

      this.bot.sendMessage(chatId, welcomeMessage);
    });

    // /help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, this.getHelpMessage());
    });

    // /check command
    this.bot.onText(/\/check(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const categoryKey = match[1]?.trim();

      if (!categoryKey) {
        this.bot.sendMessage(chatId, '❌ Укажите категорию. Например: /check flacon-magazine');
        return;
      }

      try {
        this.bot.sendMessage(chatId, '🔄 Проверяю категорию...');
        const message = await handleCheckCommand(categoryKey);
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      }
    });

    // /checkall command
    this.bot.onText(/\/checkall/, async (msg) => {
      const chatId = msg.chat.id;

      try {
        this.bot.sendMessage(chatId, '🔄 Проверяю все категории...');
        const message = await handleCheckAllCommand();
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        this.bot.sendMessage(chatId, `❌ Ошибка: ${error.message}`);
      }
    });

    // /categories command
    this.bot.onText(/\/categories/, (msg) => {
      const chatId = msg.chat.id;
      const categories = getAllCategoryKeys();

      if (categories.length === 0) {
        this.bot.sendMessage(chatId, '📋 Нет доступных категорий');
        return;
      }

      let message = '📋 Доступные категории:\n\n';
      categories.forEach(key => {
        const info = getCategoryInfo(key);
        message += `• ${key}\n  ${info.name}\n  ${info.url}\n\n`;
      });

      this.bot.sendMessage(chatId, message);
    });

    // /subscribe command
    this.bot.onText(/\/subscribe/, (msg) => {
      const chatId = msg.chat.id;

      if (this.tracker) {
        this.tracker.addSubscriber(chatId);
        this.bot.sendMessage(chatId, '✅ Вы подписаны на уведомления об изменениях');
      } else {
        this.bot.sendMessage(chatId, '❌ Трекер не инициализирован');
      }
    });

    // /unsubscribe command
    this.bot.onText(/\/unsubscribe/, (msg) => {
      const chatId = msg.chat.id;

      if (this.tracker) {
        this.tracker.removeSubscriber(chatId);
        this.bot.sendMessage(chatId, '✅ Вы отписаны от уведомлений');
      } else {
        this.bot.sendMessage(chatId, '❌ Трекер не инициализирован');
      }
    });

    // /status command
    this.bot.onText(/\/status/, (msg) => {
      const chatId = msg.chat.id;

      if (this.tracker) {
        const status = this.tracker.getStatus();
        const message = `
📊 Статус трекера:

${status.isRunning ? '🟢 Работает' : '🔴 Остановлен'}
Подписчиков: ${status.subscriberCount}
        `;
        this.bot.sendMessage(chatId, message);
      } else {
        this.bot.sendMessage(chatId, '❌ Трекер не инициализирован');
      }
    });
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });

    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });
  }

  /**
   * Set tracker instance
   * @param {Object} tracker - Tracker instance
   */
  setTracker(tracker) {
    this.tracker = tracker;
  }

  /**
   * Send message to chat
   * @param {number} chatId - Chat ID
   * @param {string} message - Message text
   */
  async sendMessage(chatId, message) {
    return this.bot.sendMessage(chatId, message);
  }

  /**
   * Get help message
   * @returns {string} Help message
   */
  getHelpMessage() {
    return `
📚 Справка по командам:

/check <category> - Проверить количество товаров в категории
/checkall - Проверить все категории
/categories - Показать список доступных категорий
/subscribe - Подписаться на автоматические уведомления
/unsubscribe - Отписаться от уведомлений
/status - Показать статус трекера
/help - Показать эту справку

Примеры:
• /check flacon-magazine
• /checkall
    `;
  }

  /**
   * Stop bot
   */
  stop() {
    this.bot.stopPolling();
  }
}
