import cron from 'node-cron';
import dotenv from 'dotenv';
import { fetchAndParseXML, extractProducts } from './xmlParser.js';
import { saveProductsToRedis, getUpdateMetadata } from './redisClient.js';

dotenv.config();

const XML_URL = process.env.XML_URL || 'https://www.drogeriadomov.sk/export/products.xml';

/**
 * Main function to scrape XML and save to Redis
 */
async function scrapeAndSave() {
  console.log('\n========================================');
  console.log('Starting XML scraping process...');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
  try {
    // Fetch and parse XML
    const xmlData = await fetchAndParseXML(XML_URL);
    
    // Extract products from parsed data
    const products = extractProducts(xmlData);
    
    if (products.length === 0) {
      console.warn('No products found in XML. Check the XML structure.');
      return;
    }
    
    // Save to Redis
    const result = await saveProductsToRedis(products);
    
    console.log('\n========================================');
    console.log('Scraping completed successfully!');
    console.log(`Products saved: ${result.count}`);
    console.log(`Timestamp: ${result.timestamp}`);
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n========================================');
    console.error('Error during scraping process:');
    console.error(error);
    console.error('========================================\n');
  }
}

/**
 * Displays the current scheduler status
 */
async function displayStatus() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   XML Parser & Redis Uploader Started     ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`📅 Schedule: Every 12 hours (0 */12 * * *)`);
  console.log(`🔗 XML Source: ${XML_URL}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  
  try {
    const metadata = await getUpdateMetadata();
    if (metadata.lastUpdate) {
      console.log(`\n📊 Last Update: ${metadata.lastUpdate}`);
      console.log(`📦 Products Count: ${metadata.count}`);
    } else {
      console.log('\n📊 No previous updates found in Redis');
    }
  } catch (error) {
    console.log('\n⚠️  Could not fetch metadata (Redis might not be configured yet)');
  }
  
  console.log('\n════════════════════════════════════════════\n');
}

/**
 * Initialize the scheduler
 */
async function initScheduler() {
  // Display initial status
  await displayStatus();
  
  // Run immediately on startup
  console.log('🚀 Running initial scrape...\n');
  await scrapeAndSave();
  
  // Schedule to run every 12 hours
  // Cron format: '0 */12 * * *' means at minute 0 of every 12th hour
  const schedule = '0 */12 * * *';
  
  console.log(`\n⏰ Scheduler activated! Next run in 12 hours...`);
  console.log(`   Press Ctrl+C to stop\n`);
  
  cron.schedule(schedule, async () => {
    await scrapeAndSave();
  });
}

// Start the scheduler
initScheduler().catch(error => {
  console.error('Failed to initialize scheduler:', error);
  process.exit(1);
});
