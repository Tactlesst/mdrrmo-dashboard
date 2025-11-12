export default async function handler(req, res) {
  console.log('Simple PDF test API called');
  
  try {
    // Test if we can import Puppeteer
    console.log('Attempting to import Puppeteer...');
    const puppeteer = await import('puppeteer');
    console.log('Puppeteer imported successfully');
    
    // Test if we can launch browser
    console.log('Attempting to launch browser...');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully');
    
    // Test if we can create a page
    console.log('Creating new page...');
    const page = await browser.newPage();
    console.log('Page created successfully');
    
    // Test if we can set simple content
    console.log('Setting simple content...');
    await page.setContent('<html><body><h1>Test PDF</h1><p>This is a test.</p></body></html>');
    console.log('Content set successfully');
    
    // Test if we can generate PDF
    console.log('Generating PDF...');
    const pdf = await page.pdf({ format: 'A4' });
    console.log('PDF generated successfully, size:', pdf.length);
    
    await browser.close();
    console.log('Browser closed');
    
    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Puppeteer is working correctly',
      pdfSize: pdf.length,
      steps: [
        'Import successful',
        'Browser launch successful', 
        'Page creation successful',
        'Content setting successful',
        'PDF generation successful'
      ]
    });
    
  } catch (error) {
    console.error('Puppeteer test failed:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      step: 'Failed during test execution'
    });
  }
}
