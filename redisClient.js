import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Saves products to Upstash Redis
 * @param {Array} products - Array of product objects
 * @returns {Promise<Object>} Result of the save operation
 */
export async function saveProductsToRedis(products) {
  try {
    console.log(`Saving ${products.length} products to Redis...`);
    
    const timestamp = new Date().toISOString();
    const batchSize = 100; // Process in batches to avoid overwhelming Redis
    let savedCount = 0;
    
    // Save metadata about the update
    await redis.set('products:last_update', timestamp);
    await redis.set('products:count', products.length);
    
    // Process products in batches
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Save each product with a unique key
      const promises = batch.map(async (product, index) => {
        const productId = product['g:id'] || product.id || product.code || `product_${i + index}`;
        const key = `product:${productId}`;
        
        // Remove unwanted fields
        const cleanProduct = { ...product };
        delete cleanProduct['g:id'];
        delete cleanProduct['g:gtin'];
        delete cleanProduct['g:shipping'];
        delete cleanProduct['g:free_shipping_threshold'];
        
        // Add timestamp to product data
        const productData = {
          ...cleanProduct,
          last_updated: timestamp
        };
        
        await redis.set(key, JSON.stringify(productData));
        
        // Also add to a set for easy retrieval of all product IDs
        await redis.sadd('products:all_ids', productId);
        
        return productId;
      });
      
      await Promise.all(promises);
      savedCount += batch.length;
      console.log(`Saved ${savedCount}/${products.length} products`);
    }
    
    console.log('All products saved successfully to Redis');
    
    return {
      success: true,
      count: products.length,
      timestamp: timestamp
    };
    
  } catch (error) {
    console.error('Error saving products to Redis:', error.message);
    throw error;
  }
}

/**
 * Gets all products from Redis
 * @returns {Promise<Array>} Array of all products
 */
export async function getAllProducts() {
  try {
    // Get all product IDs
    const productIds = await redis.smembers('products:all_ids');
    
    // Fetch all products
    const products = await Promise.all(
      productIds.map(async (id) => {
        const data = await redis.get(`product:${id}`);
        return typeof data === 'string' ? JSON.parse(data) : data;
      })
    );
    
    return products;
    
  } catch (error) {
    console.error('Error getting products from Redis:', error.message);
    throw error;
  }
}

/**
 * Gets metadata about the last update
 * @returns {Promise<Object>} Metadata object
 */
export async function getUpdateMetadata() {
  try {
    const lastUpdate = await redis.get('products:last_update');
    const count = await redis.get('products:count');
    
    return {
      lastUpdate,
      count
    };
    
  } catch (error) {
    console.error('Error getting metadata from Redis:', error.message);
    throw error;
  }
}

/**
 * Clears all product data from Redis
 * @returns {Promise<void>}
 */
export async function clearAllProducts() {
  try {
    const productIds = await redis.smembers('products:all_ids');
    
    // Delete all product keys
    if (productIds.length > 0) {
      await Promise.all(
        productIds.map(id => redis.del(`product:${id}`))
      );
    }
    
    // Clear the set
    await redis.del('products:all_ids');
    await redis.del('products:last_update');
    await redis.del('products:count');
    
    console.log('All products cleared from Redis');
    
  } catch (error) {
    console.error('Error clearing products from Redis:', error.message);
    throw error;
  }
}

export default redis;
