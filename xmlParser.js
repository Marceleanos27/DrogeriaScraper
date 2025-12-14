import axios from 'axios';
import xml2js from 'xml2js';

/**
 * Fetches and parses XML data from the given URL
 * @param {string} url - The URL of the XML feed
 * @returns {Promise<Object>} Parsed XML data
 */
export async function fetchAndParseXML(url) {
  try {
    console.log(`Fetching XML from: ${url}`);
    
    // Fetch XML data
    const response = await axios.get(url, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    console.log('XML fetched successfully, parsing...');
    
    // Parse XML to JSON
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true
    });
    
    const result = await parser.parseStringPromise(response.data);
    
    console.log('XML parsed successfully');
    return result;
    
  } catch (error) {
    console.error('Error fetching or parsing XML:', error.message);
    throw error;
  }
}

/**
 * Extracts products from parsed XML data
 * @param {Object} xmlData - Parsed XML data
 * @returns {Array} Array of product objects
 */
export function extractProducts(xmlData) {
  try {
    // Navigate through the XML structure to find products
    // RSS feed structure: rss -> channel -> item
    let products = [];
    
    // Check for RSS feed structure (drogeriadomov.sk uses this)
    if (xmlData.rss && xmlData.rss.channel) {
      const channel = xmlData.rss.channel;
      if (channel.item) {
        products = Array.isArray(channel.item) 
          ? channel.item 
          : [channel.item];
      }
    }
    // Fallback to other common structures
    else if (xmlData.root && xmlData.root.product) {
      products = Array.isArray(xmlData.root.product) 
        ? xmlData.root.product 
        : [xmlData.root.product];
    } else if (xmlData.products && xmlData.products.product) {
      products = Array.isArray(xmlData.products.product) 
        ? xmlData.products.product 
        : [xmlData.products.product];
    } else if (xmlData.feed && xmlData.feed.entry) {
      products = Array.isArray(xmlData.feed.entry) 
        ? xmlData.feed.entry 
        : [xmlData.feed.entry];
    }
    
    console.log(`Extracted ${products.length} products`);
    return products;
    
  } catch (error) {
    console.error('Error extracting products:', error.message);
    return [];
  }
}
