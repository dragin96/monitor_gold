/**
 * GoldApple Category Tracker Telegram Bot
 * Main entry point
 */

import dotenv from 'dotenv';
import { GoldAppleBot } from './bot.js';
import { CategoryTracker } from './tracker.js';

// Load environment variables
dotenv.config();

// Validate environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 5;

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env file');
  console.error('Please create a .env file based on .env.example');
  process.exit(1);
}

console.log('🤖 Starting GoldApple Category Tracker Telegram Bot...\n');

// Initialize bot
const bot = new GoldAppleBot(BOT_TOKEN);
console.log('✅ Telegram bot initialized');

// Initialize tracker
const tracker = new CategoryTracker(bot);
tracker.start(CHECK_INTERVAL);

console.log('\n📱 Bot is running! Press Ctrl+C to stop.\n');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Shutting down...');
  tracker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Shutting down...');
  tracker.stop();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});
