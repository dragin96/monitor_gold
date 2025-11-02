# Тестовая реализация для использования в боте

## Обзор архитектуры

Проект разделен на переиспользуемые модули для интеграции с Telegram ботом:

### Структура модулей

```
src/
├── categoryTracker.js      # Управление категориями и сравнение данных
├── storage.js              # Хранение данных (JSON)
├── goldappleApiBrowser.js  # Браузерная автоматизация для получения данных
├── bot-test.js             # Тестовая реализация команд бота
├── bot-browser.js          # Telegram бот с browser поддержкой
└── tracker-browser.js      # Трекер с cron-расписанием
```

---

## Модуль 1: categoryTracker.js

### Назначение
Управление категориями GoldApple и сравнение количества товаров.

### Основные функции

#### `getCategoryInfo(categoryKey)`
Получить информацию о категории по ключу.

```javascript
import { getCategoryInfo } from './categoryTracker.js';

const info = getCategoryInfo('flacon-magazine');
// { name: 'Flacon Magazine', url: 'https://goldapple.ru/brands/flacon-magazine' }
```

#### `getAllCategoryKeys()`
Получить все доступные ключи категорий.

```javascript
import { getAllCategoryKeys } from './categoryTracker.js';

const keys = getAllCategoryKeys();
// ['flacon-magazine', ...]
```

#### `addCategory(key, name, url)`
Добавить новую категорию.

```javascript
import { addCategory } from './categoryTracker.js';

addCategory('new-brand', 'New Brand', 'https://goldapple.ru/brands/new-brand');
```

#### `fetchCategoryProductCount(categoryKey)`
Получить текущее количество товаров в категории через браузер.

```javascript
import { fetchCategoryProductCount } from './categoryTracker.js';

const data = await fetchCategoryProductCount('flacon-magazine');
// {
//   categoryKey: 'flacon-magazine',
//   categoryName: 'Flacon Magazine',
//   categoryUrl: 'https://...',
//   productCount: 150,
//   timestamp: '2025-11-02T...'
// }
```

#### `compareProductCounts(oldCount, newCount)`
Сравнить старое и новое количество товаров.

```javascript
import { compareProductCounts } from './categoryTracker.js';

const comparison = compareProductCounts(100, 150);
// {
//   oldCount: 100,
//   newCount: 150,
//   difference: 50,
//   percentChange: 50.00,
//   changed: true,
//   increased: true,
//   decreased: false
// }
```

#### `formatProductCountMessage(categoryName, comparison)`
Форматировать сообщение об изменении для отправки пользователю.

```javascript
import { formatProductCountMessage } from './categoryTracker.js';

const message = formatProductCountMessage('Flacon Magazine', comparison);
// "📈 Flacon Magazine:
// Было: 100 товаров
// Стало: 150 товаров
// Изменение: +50 (+50.00%)"
```

---

## Модуль 2: storage.js

### Назначение
Сохранение и загрузка данных о количестве товаров в JSON формате.

### Основные функции

#### `loadCategoryCounts()`
Загрузить все сохраненные данные.

```javascript
import { loadCategoryCounts } from './storage.js';

const counts = await loadCategoryCounts();
// {
//   'flacon-magazine': {
//     count: 150,
//     timestamp: '2025-11-02T...',
//     lastUpdated: '2025-11-02T...'
//   }
// }
```

#### `saveCategoryCounts(counts)`
Сохранить данные всех категорий.

```javascript
import { saveCategoryCounts } from './storage.js';

await saveCategoryCounts({
  'flacon-magazine': { count: 150, timestamp: new Date().toISOString() }
});
```

#### `getCategoryCount(categoryKey)`
Получить данные конкретной категории.

```javascript
import { getCategoryCount } from './storage.js';

const data = await getCategoryCount('flacon-magazine');
// { count: 150, timestamp: '2025-11-02T...', lastUpdated: '2025-11-02T...' }
```

#### `updateCategoryCount(categoryKey, count, timestamp)`
Обновить количество товаров для категории.

```javascript
import { updateCategoryCount } from './storage.js';

await updateCategoryCount('flacon-magazine', 155, new Date().toISOString());
```

#### `getCategoryHistory(categoryKey)`
Получить историю изменений категории.

```javascript
import { getCategoryHistory } from './storage.js';

const history = await getCategoryHistory('flacon-magazine');
// [
//   { count: 150, timestamp: '2025-11-01T...' },
//   { count: 155, timestamp: '2025-11-02T...' }
// ]
```

#### `addHistoryEntry(categoryKey, count, timestamp)`
Добавить запись в историю (автоматически ограничивает до 100 записей).

```javascript
import { addHistoryEntry } from './storage.js';

await addHistoryEntry('flacon-magazine', 160, new Date().toISOString());
```

---

## Модуль 3: bot-test.js

### Назначение
Тестовая реализация команд бота, демонстрирует паттерны использования.

### Основные функции

#### `checkCategoryChanges(categoryKey)`
Проверить изменения в категории и обновить storage.

```javascript
import { checkCategoryChanges } from './bot-test.js';

const result = await checkCategoryChanges('flacon-magazine');
// {
//   categoryKey: 'flacon-magazine',
//   categoryName: 'Flacon Magazine',
//   categoryUrl: 'https://...',
//   comparison: { oldCount: 100, newCount: 150, ... },
//   message: '📈 Flacon Magazine: ...',
//   timestamp: '2025-11-02T...'
// }
```

#### `checkAllCategories()`
Проверить все категории с задержками между запросами.

```javascript
import { checkAllCategories } from './bot-test.js';

const results = await checkAllCategories();
// [
//   { categoryKey: 'flacon-magazine', comparison: {...}, message: '...' },
//   ...
// ]
```

#### `handleCheckCommand(categoryKey)`
Обработчик команды /check для бота.

```javascript
import { handleCheckCommand } from './bot-test.js';

const message = await handleCheckCommand('flacon-magazine');
// Возвращает готовое сообщение для отправки пользователю
```

#### `handleCheckAllCommand()`
Обработчик команды /checkall для бота.

```javascript
import { handleCheckAllCommand } from './bot-test.js';

const message = await handleCheckAllCommand();
// "📊 Проверка всех категорий:
//
// 📈 Flacon Magazine: ...
// ..."
```

---

## Модуль 4: bot-browser.js

### Назначение
Полноценный Telegram бот с поддержкой browser-based проверок.

### Использование

```javascript
import { BrowserGoldAppleBot } from './bot-browser.js';

const bot = new BrowserGoldAppleBot('YOUR_TELEGRAM_BOT_TOKEN');

// Установить tracker для подписок
bot.setTracker(trackerInstance);

// Отправить сообщение
await bot.sendMessage(chatId, 'Привет!');

// Остановить бота
bot.stop();
```

### Доступные команды

- `/start` - Приветствие и список команд
- `/help` - Справка по командам
- `/check <category>` - Проверить конкретную категорию
- `/checkall` - Проверить все категории
- `/categories` - Показать список доступных категорий
- `/subscribe` - Подписаться на уведомления
- `/unsubscribe` - Отписаться от уведомлений
- `/status` - Показать статус трекера

---

## Модуль 5: tracker-browser.js

### Назначение
Автоматический трекер с cron-расписанием и уведомлениями подписчиков.

### Использование

```javascript
import { BrowserCategoryTracker } from './tracker-browser.js';

const tracker = new BrowserCategoryTracker(botInstance);

// Добавить подписчика
tracker.addSubscriber(chatId);

// Удалить подписчика
tracker.removeSubscriber(chatId);

// Запустить автоматические проверки (каждый час)
tracker.start();

// Остановить проверки
tracker.stop();

// Получить статус
const status = tracker.getStatus();
// { isRunning: true, subscriberCount: 5 }

// Ручная проверка
await tracker.checkAllCategoriesAndNotify();
```

---

## Пример полной интеграции

### Простой бот с автоматическими проверками

```javascript
import { BrowserGoldAppleBot } from './src/bot-browser.js';
import { BrowserCategoryTracker } from './src/tracker-browser.js';

// Создать бот
const bot = new BrowserGoldAppleBot(process.env.TELEGRAM_BOT_TOKEN);

// Создать трекер
const tracker = new BrowserCategoryTracker(bot);

// Связать трекер с ботом
bot.setTracker(tracker);

// Запустить автоматические проверки
tracker.start();

console.log('Bot started!');
```

### Запуск

```bash
# Установить зависимости
npm install node-telegram-bot-api puppeteer

# Установить токен бота
export TELEGRAM_BOT_TOKEN="your_token_here"

# Запустить
node your-bot-file.js
```

---

## Тестирование

### Запуск тестов

```bash
# Тест bot-test.js (проверка одной категории и всех)
node src/bot-test.js

# Тест browser (базовая проверка браузера)
node test-browser.js
```

### Что проверяют тесты

1. **bot-test.js**:
   - Проверка одной категории
   - Сравнение старого и нового количества
   - Сохранение в storage
   - Проверка всех категорий с задержками
   - Форматирование сообщений

2. **test-browser.js**:
   - Запуск браузера
   - Навигация на страницу
   - Извлечение данных из DOM
   - Применение stealth-настроек

---

## Хранилище данных

### Структура файлов

```
data/
├── category-counts.json           # Текущие данные всех категорий
└── flacon-magazine-history.json   # История конкретной категории
```

### Формат category-counts.json

```json
{
  "flacon-magazine": {
    "count": 150,
    "timestamp": "2025-11-02T10:30:00.000Z",
    "lastUpdated": "2025-11-02T10:30:00.000Z"
  }
}
```

### Формат *-history.json

```json
[
  {
    "count": 145,
    "timestamp": "2025-11-01T10:00:00.000Z"
  },
  {
    "count": 150,
    "timestamp": "2025-11-02T10:30:00.000Z"
  }
]
```

---

## Добавление новых категорий

```javascript
import { addCategory } from './src/categoryTracker.js';

// Добавить новую категорию
addCategory(
  'new-brand-key',           // Ключ (используется в командах)
  'New Brand Name',          // Название (отображается пользователям)
  'https://goldapple.ru/...' // URL категории
);
```

---

## Важные замечания

### Задержки между запросами

Для избежания блокировки используйте задержки:

```javascript
// В bot-test.js уже реализовано:
const delay = Math.floor(Math.random() * 5000) + 5000; // 5-10 секунд
await new Promise(resolve => setTimeout(resolve, delay));
```

### Браузерная автоматизация

- Используется `headless: false` для отладки
- Применены stealth-настройки для обхода детекции
- Симуляция человеческого поведения (движения мыши, скроллинг)

### Обработка ошибок

Все модули имеют обработку ошибок:

```javascript
try {
  const result = await handleCheckCommand('category-key');
} catch (error) {
  console.error('Error:', error.message);
  // Отправить сообщение об ошибке пользователю
}
```

---

## Расширение функционала

### Добавление новых команд в бота

Отредактируйте [bot-browser.js](src/bot-browser.js):

```javascript
setupCommands() {
  // Добавьте новую команду
  this.bot.onText(/\/mycommand/, async (msg) => {
    const chatId = msg.chat.id;
    // Ваша логика
    this.bot.sendMessage(chatId, 'Response');
  });
}
```

### Изменение расписания проверок

Отредактируйте [tracker-browser.js](src/tracker-browser.js):

```javascript
start() {
  // Изменить на '0 */2 * * *' для проверки каждые 2 часа
  this.cronJob = cron.schedule('0 */1 * * *', async () => {
    await this.checkAllCategoriesAndNotify();
  });
}
```

---

## Диагностика проблем

### Если бот не получает данные

1. Проверьте, что браузер запускается (должно быть видимое окно при `headless: false`)
2. Проверьте debug-вывод в консоли
3. Убедитесь, что селектор `[data-category-products-count]` существует на странице

### Если сайт блокирует доступ

Смотрите [ANTIBOT_SOLUTIONS.md](ANTIBOT_SOLUTIONS.md) для решений:
- Использование прокси
- puppeteer-extra с stealth плагином
- Ротация User-Agent
- Сохранение профиля браузера
