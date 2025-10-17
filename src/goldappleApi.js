/**
 * GoldApple API Client
 * Handles all API requests to GoldApple website
 */

const DEFAULT_CITY_ID = '0c5b2444-70a0-4932-980c-b4dc0d3f02b5'; // Moscow

/**
 * Fetches products from GoldApple catalog
 * @param {number} categoryId - Category ID
 * @param {number} pageNumber - Page number (default: 1)
 * @param {number} pageSize - Page size (default: 24)
 * @param {string} cityId - City ID (default: Moscow)
 * @returns {Promise<Object>} Product data
 */
export async function fetchProducts(categoryId, pageNumber = 1, pageSize = 24, cityId = DEFAULT_CITY_ID) {
  const url = 'https://goldapple.ru/front/api/catalog/cards-list?locale=ru';

  const payload = {
    categoryId,
    pageNumber,
    pageSize,
    filters: [],
    mode: 'dynamic',
    cityId,
    cityDistrict: null,
    geoPolygons: [],
    regionId: cityId
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        "cookie": "ga-lang=ru; ga-device-id=rYMiFCxukCxdcxZNjBku8; digi-analytics-sessionId=V8fdlf9aRYlYtZhN5YYjE; _sp_ses.925f=*; advcake_track_id=0ddb83f9-838d-abfb-9fad-ce25195d0419; advcake_session_id=cafe08e9-65ff-7aab-5455-9d185b4fec3f; __zzatw-goldapple-ru=MDA0dBA=Fz2+aQ==; _ym_uid=1760728358427797155; _ym_d=1760728358; _ym_isad=1; mindboxDeviceUUID=2131991c-e2a5-4086-b28b-0381a743b154; directCrm-session=%7B%22deviceGuid%22%3A%222131991c-e2a5-4086-b28b-0381a743b154%22%7D; _ym_visorc=b; ga-session-assets=1760728377.16.78814.767251|35ea8fadbee41dc5f5431a69d8c9f4c4; advcake_track_url=%3D20250113fg0N0A1A1LHsAwbKJYnbt28hz8pbJUkacvbmWwj2X50QjNOQIVlwDZAf2O%2B8IT6VDXaAe7g2BKpraCaHUg6NE%2BS0G%2BWv6xOTk2FNdlIY%2FEQcCQmUSDXdXcxvN379swSSA7qBmSdxw6duR%2B1KUMSQ%2BXGNdIgAuLGyYlFX1dgEz7ToZFhqgt5LQkOyi6sqeEIHR%2BbGAav11DHUcFcGBP9kPWXHufJAl1VBgKkwrAlkvdl8jNxFxLFG6hEcwX1B8izYBCuVr7IeDn7z3%2FeB68z7X3KQY2zDMnpbdAAegMg1YrP5wFyZiSXEIt2PaBsU6C23QCCTPUj3F%2BPDr5Jqlf8pDPEU10JRGAWVQo1iBgLz5NWZqhN%2FnEa76dQqhl2Uk3X2zGDYHwtE7nArx58QMoVcRgYPKE5K8lNO6t%2BlIH6o%2FvUluqsCcuh%2F0Tns7tHT5fnbUgJ6YxG4IYGYrBpBYfnbGRQTzyJnqtwVMKfSfWKQTI2d5jrJjczAu52h8%2F3oQqfsIGwJYn4G6gcRnkUkPS1127sSt1oClSf%2Bjc1CBTXmuek29skk9XHPmp7iN2jLIR6gtgsTmGufuDpLs4wtYiglcKKvXC7rPOIbSgmufOJ2Su8yw7jeS4oS7tV89e%2BSf5P0JEa2smcPUkNy894OH%2BwyD%2BPFb7FjS2Sd9YivsH71Md2zoaHCC4Z%2F1fI%3D; _gcl_au=1.1.1857235493.1760728386; _ga=GA1.1.1765942761.1760728386; isAddressConfirmed=true; _ga_QE5MQ8XJJK=GS2.1.s1760728385$o1$g1$t1760728481$j24$l0$h0; _sp_id.925f=caea615d-00ac-47b1-a856-80502a0b9dc0.1760728357.1.1760728481..b5db8335-21bb-4b49-a6c8-b5eccf2a37e8..2f1f15a8-8344-4dac-9b58-4c2746e0515a.1760728357591.45; ngx_s_id=OTgxNzE0MGItZmExMS00ZTA4LTgyMGEtNjY5MThkODM4NzUyQDE3NjA3Mjk2ODIzMTBAOTAwMDAwQDE3NjA3MjgzNTUxMzJAYzRhZDUxYWE1N2Y4MzFmYmMwYTUwMTBhYjAzN2NmNzI0OGM2YTE3NWZjMTNkM2ExZTI4ZDA2YmVjZjliOThlYg==; gsscw-goldapple-ru=eLKq2AeWlG96Rkg+3BrtTLHxXIgt/NFiprs8CBMjTw55ZlWn1kZN7aKJJslVqt01BJTScTPF5uCrw4XLOHQ1lrsQ1ZzYXBO6caQ0tZnLkjrJywdrAcd0ELD26KbDTBuFiSrVvnz2GCLOsiFiTjwN53YEjYuJJ0GHbkCIJEHYiLsXJrkeC4NDJaDP7cd6qxud6xrt0Rasrm8jlArFU9apXabxqzt/Ot6BKInHNfui/6qhCcFfUZKxct7E+jGzj9A6lux223vIPUDekA==; cfidsw-goldapple-ru=OpXPbi0atjW24U3MQ0QC0gsSQgrd5Tu36HQN/ooJopR3OSAd5jmZWN2omgnprkS1j8I8npKWFTyYAxlOxNQpyGL4GazPs60IEO79klO0vUFNM0oW6eyETAj20NmBplMx/c9eJk3Dt8xYhjcyRYJROwzamKyjrnHfsIXDTg==; cfidsw-goldapple-ru=OpXPbi0atjW24U3MQ0QC0gsSQgrd5Tu36HQN/ooJopR3OSAd5jmZWN2omgnprkS1j8I8npKWFTyYAxlOxNQpyGL4GazPs60IEO79klO0vUFNM0oW6eyETAj20NmBplMx/c9eJk3Dt8xYhjcyRYJROwzamKyjrnHfsIXDTg==; gsscw-goldapple-ru=eLKq2AeWlG96Rkg+3BrtTLHxXIgt/NFiprs8CBMjTw55ZlWn1kZN7aKJJslVqt01BJTScTPF5uCrw4XLOHQ1lrsQ1ZzYXBO6caQ0tZnLkjrJywdrAcd0ELD26KbDTBuFiSrVvnz2GCLOsiFiTjwN53YEjYuJJ0GHbkCIJEHYiLsXJrkeC4NDJaDP7cd6qxud6xrt0Rasrm8jlArFU9apXabxqzt/Ot6BKInHNfui/6qhCcFfUZKxct7E+jGzj9A6lux223vIPUDekA==; fgsscw-goldapple-ru=KKr7865f5700a6510e0e6502feb39cfaaf503ade",
        "Referer": "https://goldapple.ru/brands/flacon-magazine"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching products:', error.message);
    throw error;
  }
}

/**
 * Fetches a single product by itemId
 * @param {string} itemId - Product item ID
 * @returns {Promise<Object>} Product details
 */
export async function fetchProductById(itemId) {
  const url = `https://goldapple.ru/front/api/catalog/product/${itemId}?locale=ru`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-US,en;q=0.9,ru;q=0.8',
        'cache-control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching product ${itemId}:`, error.message);
    throw error;
  }
}

/**
 * Checks if product is in stock
 * @param {string} itemId - Product item ID
 * @returns {Promise<boolean>} True if in stock
 */
export async function checkProductAvailability(itemId) {
  try {
    const product = await fetchProductById(itemId);
    return product?.data?.inStock || false;
  } catch (error) {
    console.error(`Error checking availability for ${itemId}:`, error);
    return false;
  }
}

/**
 * Extracts product info from product object
 * @param {Object} productData - Product data object
 * @returns {Object} Formatted product info
 */
export function formatProductInfo(productData) {
  const product = productData?.product || productData;

  return {
    itemId: product.itemId,
    name: product.name,
    brand: product.brand,
    productType: product.productType,
    price: product.price?.actual?.amount || 0,
    currency: product.price?.actual?.currency || 'RUB',
    inStock: product.inStock || false,
    url: product.url ? `https://goldapple.ru${product.url}` : null,
    imageUrl: product.imageUrls?.[0]?.url || null
  };
}

/**
 * Gets category product count
 * @param {number} categoryId - Category ID
 * @returns {Promise<Object>} Category info with product count
 */
export async function getCategoryInfo(categoryId) {
  try {
    const data = await fetchProducts(categoryId, 1, 1);

    return {
      categoryId,
      productCount: data.data?.productCount || 0,
      cardsCount: data.data?.cardsCount || 0,
      url: data.data?.url || null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error getting category info for ${categoryId}:`, error);
    throw error;
  }
}

/**
 * Gets all products from a category (all pages)
 * @param {number} categoryId - Category ID
 * @returns {Promise<Array>} Array of all products
 */
export async function getAllProductsFromCategory(categoryId) {
  try {
    // First request to get total count
    const firstPage = await fetchProducts(categoryId, 1, 24);
    const totalCount = firstPage.data?.productCount || 0;
    const pageSize = 24;
    const totalPages = Math.ceil(totalCount / pageSize);

    let allProducts = [...(firstPage.data?.cards || [])];

    // Fetch remaining pages
    const promises = [];
    for (let page = 2; page <= totalPages; page++) {
      promises.push(fetchProducts(categoryId, page, pageSize));
    }

    const results = await Promise.all(promises);
    results.forEach(result => {
      if (result.data?.cards) {
        allProducts = allProducts.concat(result.data.cards);
      }
    });

    return allProducts;
  } catch (error) {
    console.error(`Error getting all products from category ${categoryId}:`, error);
    throw error;
  }
}
