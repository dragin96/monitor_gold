# Стелс-функции браузера

## Обзор

Проект использует Puppeteer с расширенными настройками маскировки для обхода систем обнаружения автоматизации.

## Основные техники маскировки

### 1. Параметры запуска браузера

```javascript
{
  headless: 'new',  // Новый headless режим
  args: [
    '--disable-blink-features=AutomationControlled',
    '--disable-web-security',
    '--disable-features=IsolateOrigins,site-per-process',
    '--window-size=1920,1080',
  ],
  ignoreDefaultArgs: ['--enable-automation']
}
```

### 2. Переопределение JavaScript API

- **navigator.webdriver** → `false`
- **window.chrome** → Добавлены реалистичные свойства
- **navigator.plugins** → Имитация реальных плагинов
- **navigator.languages** → `['ru-RU', 'ru', 'en-US', 'en']`
- **navigator.platform** → `'Win32'`
- **navigator.hardwareConcurrency** → `8`
- **navigator.deviceMemory** → `8`
- **navigator.maxTouchPoints** → `0`

### 3. HTTP заголовки

```javascript
{
  'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
}
```

### 4. User-Agent

```
Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

### 5. Симуляция человеческого поведения

- Случайные движения мыши
- Реалистичная прокрутка страницы
- Случайные задержки (500-2500мс)
- Плавное поведение (smooth scrolling)

## Использование

### В test-browser.js

```javascript
import puppeteer from 'puppeteer';

// Браузер запускается с полной маскировкой
const browser = await puppeteer.launch({
  headless: false,
  args: [...],
  ignoreDefaultArgs: ['--enable-automation']
});

const page = await browser.newPage();
await applyStealthSettings(page);
```

### В основном коде

Функции `applyStealthSettings()` и `simulateHumanBehavior()` автоматически применяются во всех модулях:
- `browserManager.js` - для получения кук
- `goldappleApiBrowser.js` - для API запросов

## Защита от обнаружения

| Метод обнаружения | Наша защита |
|-------------------|-------------|
| navigator.webdriver | ✅ Переопределено на false |
| Chrome DevTools Protocol | ✅ Отключено через --disable-blink-features |
| Автоматизационные флаги | ✅ Удалены через ignoreDefaultArgs |
| Анализ поведения мыши | ✅ Симуляция случайных движений |
| Временные паттерны | ✅ Случайные задержки |
| Fingerprinting | ✅ Реалистичные значения всех параметров |

## Рекомендации

1. Используйте разумные задержки между запросами
2. Не делайте слишком много запросов за короткое время
3. Периодически меняйте User-Agent
4. Используйте прокси для распределения нагрузки (если нужно)

## Дополнительная защита

Для еще более надежной маскировки можно добавить:
- Использование реальных расширений Chrome
- Ротацию User-Agent
- Использование прокси-серверов
- Canvas/WebGL fingerprint spoofing
