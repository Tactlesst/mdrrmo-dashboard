export default async function handler(req, res) {
  console.log('PDF generation API called');
  
  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  
  try {
    // Dynamic import to avoid SSR issues
    const puppeteer = await import('puppeteer');
    console.log('Puppeteer imported successfully');
    
    const { htmlContent, fileName } = req.body;
    console.log('Received request:', { fileName, htmlLength: htmlContent?.length });

    if (!htmlContent) {
      console.log('No HTML content provided');
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log('Launching Puppeteer...');
    
    // Launch Puppeteer with minimal args for better compatibility
    browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    }).catch(error => {
      console.error('Failed to launch Puppeteer:', error);
      throw new Error(`Puppeteer launch failed: ${error.message}`);
    });

    console.log('Puppeteer launched successfully');
    const page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 800 });
    console.log('Viewport set');

    // Clean and prepare HTML content
    const cleanHtml = htmlContent
      .replace(/class="[^"]*"/g, '') // Remove Tailwind classes that might cause issues
      .replace(/style="[^"]*"/g, ''); // Remove inline styles that might conflict

    console.log('Setting page content...');
    
    // Set content with simplified styling
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${fileName || 'PCR_Report'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 10pt; 
              line-height: 1.4; 
              color: #000; 
              background: white; 
              padding: 20px; 
            }
            h1 { font-size: 14pt; font-weight: bold; margin: 10px 0; text-align: center; }
            .section { margin-bottom: 15px; border: 1px solid #000; padding: 10px; }
            .field { margin-bottom: 8px; }
            .field-label { font-weight: bold; font-size: 9pt; margin-bottom: 2px; }
            .field-value { font-size: 9pt; word-wrap: break-word; }
            img { max-width: 150px; max-height: 50px; object-fit: contain; }
            @page { size: A4; margin: 1cm; }
          </style>
        </head>
        <body>
          ${cleanHtml}
        </body>
      </html>
    `, { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Page content set successfully');
    
    // Generate PDF
    console.log('Generating PDF...');
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true
    }).catch(error => {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    });

    console.log('PDF generated successfully, size:', pdf.length);
    
    await browser.close();
    console.log('Browser closed');

    // Set headers for PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName || 'PCR_Report'}.pdf"`);
    res.setHeader('Content-Length', pdf.length);

    // Send PDF
    res.send(pdf);
    console.log('PDF sent to client');

  } catch (error) {
    console.error('PDF generation error:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure browser is closed even on error
    try {
      if (browser) {
        await browser.close();
        console.log('Browser closed after error');
      }
    } catch (closeError) {
      console.error('Error closing browser:', closeError);
    }
    
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Increase API timeout for PDF generation
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  maxDuration: 30, // 30 seconds timeout
};
