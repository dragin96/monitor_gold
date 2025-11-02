/**
 * Browser Manager
 * Manages Puppeteer browser instance for fetching fresh cookies
 */

import puppeteer from 'puppeteer';

let browser = null;
let isLaunching = false;

/**
 * Simulate human-like mouse movements and interactions
 * @param {Page} page - Puppeteer page instance
 */
async function simulateHumanBehavior(page) {
  try {
    // Random mouse movements
    await page.mouse.move(
      Math.floor(Math.random() * 800) + 100,
      Math.floor(Math.random() * 600) + 100
    );

    // Random small delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    // Scroll with realistic behavior
    await page.evaluate(() => {
      const scrollStep = Math.floor(Math.random() * 300) + 100;
      window.scrollBy({
        top: scrollStep,
        behavior: 'smooth'
      });
    });

    await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 1000));

    // Scroll back a bit
    await page.evaluate(() => {
      window.scrollBy({
        top: -50,
        behavior: 'smooth'
      });
    });
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
  });
}

/**
 * Launches browser instance with stealth settings
 * @returns {Promise<Browser>}
 */
async function launchBrowser() {
  if (browser && browser.connected) {
    return browser;
  }

  if (isLaunching) {
    // Wait for browser to finish launching
    while (isLaunching) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return browser;
  }

  try {
    isLaunching = true;
    console.log('Launching browser...');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
      ignoreDefaultArgs: ['--enable-automation'],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      }
    });

    console.log('Browser launched successfully');
    return browser;
  } catch (error) {
    console.error('Error launching browser:', error);
    throw error;
  } finally {
    isLaunching = false;
  }
}

/**
 * Closes browser instance
 */
async function closeBrowser() {
  if (browser) {
    try {
      await browser.close();
      console.log('Browser closed');
    } catch (error) {
      console.error('Error closing browser:', error);
    }
    browser = null;
  }
}


/**
 * Fetches fresh cookies from GoldApple website using browser
 * @returns {Promise<string>} Cookie string
 */
export async function fetchCookiesWithBrowser() {
  let page = null;

  try {
    const browserInstance = await launchBrowser();
    page = await browserInstance.newPage();

    // Apply stealth settings
    await applyStealthSettings(page);

    console.log('Navigating to GoldApple catalog...');
    await page.goto('https://goldapple.ru/brands/flacon-magazine', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    console.log('Page loaded successfully');

    // Wait for page to fully initialize and set all cookies
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate human behavior
    await simulateHumanBehavior(page);

    // Additional wait for cookies
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get all cookies
    const cookies = await page.cookies();

    // Format cookies as string
    const cookieString = cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    console.log(`Fetched ${cookies.length} cookies from browser`);

    if (cookies.length > 0) {
      console.log('Cookie names:', cookies.map(c => c.name).join(', '));
    }

    await page.close();
    return cookieString;
  } catch (error) {
    console.error('Error fetching cookies with browser:', error);
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore close error
      }
    }
    return '';
  }
}

/**
 * Makes a request with browser to bypass anti-bot protection
 * @param {string} url - URL to fetch
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
export async function fetchWithBrowser(url, options = {}) {
  let page = null;

  try {
    const browserInstance = await launchBrowser();
    page = await browserInstance.newPage();

    // Apply stealth settings
    await applyStealthSettings(page);

    await page.goto('https://goldapple.ru/brands/flacon-magazine')

    // Listen for API responses
    let responseData = null;

    page.on('response', async (response) => {
      if (response.url().includes(url)) {
        try {
          responseData = await response.json();
        } catch (e) {
          // Not JSON response
        }
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    await page.close();
    return responseData;
  } catch (error) {
    console.error('Error fetching with browser:', error);
    if (page) {
      try {
        await page.close();
      } catch (e) {
        // Ignore
      }
    }
    throw error;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (browser) {
    browser.close().catch(() => {});
  }
});

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});

export { launchBrowser, closeBrowser };
