export default async function handler(req, res) {
  console.log('Test Puppeteer API called');
  
  try {
    // Try to import Puppeteer
    const puppeteer = await import('puppeteer');
    console.log('Puppeteer imported successfully');
    
    // Try to launch browser
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('Browser launched successfully');
    
    const page = await browser.newPage();
    console.log('New page created');
    
    await page.setContent('<html><body><h1>Test</h1></body></html>');
    console.log('Content set');
    
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated, size:', pdf.length);
    
    await browser.close();
    console.log('Browser closed');
    
    res.status(200).json({ 
      success: true, 
      message: 'Puppeteer is working correctly',
      pdfSize: pdf.length 
    });
    
  } catch (error) {
    console.error('Puppeteer test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    });
  }
}
