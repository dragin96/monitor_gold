/**
 * GoldApple API Client using Browser
 * Makes API requests directly through browser to bypass anti-bot protection
 */

import puppeteer from 'puppeteer';

let browser = null;

/**
 * Simulate human-like mouse movements and interactions
 * @param {Page} page - Puppeteer page instance
 */
async function simulateHumanBehavior(page) {
  try {
    // Wait a bit before starting
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Random mouse movements (multiple times)
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(
        Math.floor(Math.random() * 800) + 100,
        Math.floor(Math.random() * 600) + 100
      );
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 300));
    }

    // Scroll down slowly
    await page.evaluate(() => {
      const scrollStep = Math.floor(Math.random() * 200) + 150;
      window.scrollBy({
        top: scrollStep,
        behavior: 'smooth'
      });
    });

    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1500));

    // Scroll up a bit
    await page.evaluate(() => {
      window.scrollBy({
        top: -100,
        behavior: 'smooth'
      });
    });

    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));

    // Scroll down again
    await page.evaluate(() => {
      const scrollStep = Math.floor(Math.random() * 300) + 200;
      window.scrollBy({
        top: scrollStep,
        behavior: 'smooth'
      });
    });

    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1500));
  } catch (e) {
    // Ignore errors in simulation
  }
}

/**
 * Apply stealth settings to page to avoid detection
 * @param {Page} page - Puppeteer page instance
 */
async function applyStealthSettings(page) {
  // Set realistic User-Agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  // Set extra HTTP headers
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  });

  // Hide automation traces
  await page.evaluateOnNewDocument(() => {
    // Override navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override Chrome properties
    window.chrome = {
      runtime: {},
      loadTimes: function() {},
      csi: function() {},
      app: {},
    };

    // Add realistic plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['ru-RU', 'ru', 'en-US', 'en'],
    });

    // Mask headless mode
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Add permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Override hardwareConcurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      get: () => 8,
    });

    // Override deviceMemory
    Object.defineProperty(navigator, 'deviceMemory', {
      get: () => 8,
    });

    // Override maxTouchPoints
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => 0,
    });

    // Override screen properties
    Object.defineProperty(screen, 'width', {
      get: () => 1920,
    });
    Object.defineProperty(screen, 'height', {
      get: () => 1080,
    });
    Object.defineProperty(screen, 'availWidth', {
      get: () => 1920,
    });
    Object.defineProperty(screen, 'availHeight', {
      get: () => 1040,
    });

    // Override battery
    Object.defineProperty(navigator, 'getBattery', {
      value: () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1
      })
    });

    // Override connection
    Object.defineProperty(navigator, 'connection', {
      get: () => ({
        effectiveType: '4g',
        rtt: 50,
        downlink: 10,
        saveData: false
      })
    });
  });
}

/**
 * Get or create browser instance with stealth settings
 */
async function getBrowser() {
  if (browser && browser.connected) {
    return browser;
  }

  console.log('Launching browser for API requests...');
  browser = await puppeteer.launch({
    headless: 'new',  // Используем новый headless режим для стабильности на сервере
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080',
      '--start-maximized',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ],
    ignoreDefaultArgs: ['--enable-automation'],
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    }
  });

  return browser;
}

/**
 * Fetches product count from GoldApple catalog page by parsing DOM
 * @param {string} categoryUrl - Category URL (e.g., 'https://goldapple.ru/brands/flacon-magazine')
 * @returns {Promise<Object>} Product data with count
 */
export async function fetchProductCountFromPage(categoryUrl) {
  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  try {
    // Apply stealth settings to avoid detection
    await applyStealthSettings(page);

    console.log(`Fetching product count from: ${categoryUrl}`);

    // Navigate to the category page
    await page.goto(categoryUrl, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Page loaded, extracting product count...');

    // Try to find the element with different selectors
    const debugInfo = await page.evaluate(() => {
      // Try main selector
      let element = document.querySelector('[data-category-products-count]');
      if (element) {
        const count = element.getAttribute('data-category-products-count');
        return {
          found: true,
          count: parseInt(count, 10),
          selector: '[data-category-products-count]',
          html: element.outerHTML.substring(0, 200)
        };
      }

      // Search all elements with data attributes
      const dataElements = [];
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        if (el.hasAttribute('data-category-products-count')) {
          const count = el.getAttribute('data-category-products-count');
          dataElements.push({
            tag: el.tagName,
            count: count,
            html: el.outerHTML.substring(0, 200)
          });
        }
      }

      if (dataElements.length > 0) {
        return {
          found: true,
          count: parseInt(dataElements[0].count, 10),
          elements: dataElements
        };
      }

      // Last resort: search for text containing numbers
      const bodyText = document.body.textContent;
      const matches = bodyText.match(/(\d+)\s*товар/i);

      return {
        found: false,
        count: matches ? parseInt(matches[1], 10) : 0,
        bodySnippet: bodyText.substring(0, 500),
        textMatch: matches ? matches[0] : null
      };
    });

    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

    // Check if site is blocking us
    if (debugInfo.bodySnippet && debugInfo.bodySnippet.includes('Доступ к сайту временно ограничен')) {
      await page.close().catch(() => {});
      throw new Error('Site access is temporarily restricted. The site detected automation.');
    }

    const productCount = debugInfo.count;
    console.log(`Found ${productCount} products on page`);

    await page.close().catch(() => {});

    // Return data in a format similar to API response
    return {
      data: {
        productCount: productCount,
        cardsCount: productCount,
        url: categoryUrl
      }
    };
  } catch (error) {
    try {
      await page.close();
    } catch (closeError) {
      // Ignore close errors
    }
    console.error('Error fetching product count from page:', error);
    throw error;
  }
}

/**
 * Fetches products from GoldApple catalog using browser by parsing page
 * @param {number} categoryId - Category ID
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 24)
 * @param {string} cityId - City ID
 * @returns {Promise<Object>} Product data
 */
export async function fetchProductsWithBrowser(categoryId, pageNumber = 1, pageSize = 24, cityId = '0c5b2444-70a0-4932-980c-b4dc0d3f02b5') {
  // For now, we'll use a default URL - this can be made dynamic
  const categoryUrl = 'https://goldapple.ru/brands/flacon-magazine';
  return await fetchProductCountFromPage(categoryUrl);
}

/**
 * Close browser instance
 */
export async function closeBrowserApi() {
  if (browser) {
    await browser.close();
    browser = null;
    console.log('Browser closed');
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (browser) {
    browser.close().catch(() => {});
  }
});
