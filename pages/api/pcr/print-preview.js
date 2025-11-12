export default async function handler(req, res) {
  console.log('Print preview API called');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { htmlContent, fileName } = req.body;
    console.log('Received request:', { fileName, htmlLength: htmlContent?.length });

    if (!htmlContent) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    // Clean HTML content for better display
    const cleanHtml = htmlContent
      .replace(/class="[^"]*no-print[^"]*"/g, '') // Remove no-print elements
      .replace(/style="[^"]*"/g, '') // Remove inline styles
      .replace(/class="[^"]*"/g, ''); // Remove all classes

    // Create a complete HTML page with print and download functionality
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${fileName || 'PCR_Report'}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.4;
              color: #000;
              background: #f5f5f5;
              padding: 0;
            }
            
            .controls {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: #2563eb;
              color: white;
              padding: 10px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 1000;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .controls h1 {
              font-size: 18px;
              margin: 0;
            }
            
            .controls-buttons {
              display: flex;
              gap: 10px;
            }
            
            .btn {
              background: #1d4ed8;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              display: flex;
              align-items: center;
              gap: 5px;
              transition: background-color 0.2s;
            }
            
            .btn:hover {
              background: #1e40af;
            }
            
            .btn:disabled {
              background: #6b7280;
              cursor: not-allowed;
            }
            
            .content-wrapper {
              margin-top: 60px;
              padding: 20px;
              display: flex;
              justify-content: center;
            }
            
            .content {
              background: white;
              max-width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              margin: 0 auto;
            }
            
            .content h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 10px 0;
              text-align: center;
            }
            
            .content h2 {
              font-size: 14pt;
              font-weight: bold;
              margin: 8px 0;
            }
            
            .content h3 {
              font-size: 12pt;
              font-weight: bold;
              margin: 6px 0;
            }
            
            .content p {
              margin: 4px 0;
              font-size: 10pt;
            }
            
            .content label {
              font-weight: bold;
              font-size: 10pt;
            }
            
            .content img {
              max-width: 150px;
              max-height: 50px;
              object-fit: contain;
            }
            
            .content div {
              margin: 4px 0;
            }
            
            .spinner {
              display: none;
              width: 16px;
              height: 16px;
              border: 2px solid #ffffff;
              border-top: 2px solid transparent;
              border-radius: 50%;
              animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            
            @media print {
              .controls {
                display: none !important;
              }
              
              .content-wrapper {
                margin-top: 0;
                padding: 0;
              }
              
              .content {
                box-shadow: none;
                margin: 0;
                padding: 0;
                max-width: none;
              }
              
              body {
                background: white;
              }
              
              @page {
                size: A4;
                margin: 1cm;
              }
            }
          </style>
        </head>
        <body>
          <div class="controls">
            <h1>📋 ${fileName || 'PCR Report'}</h1>
            <div class="controls-buttons">
              <button class="btn" onclick="downloadPDF()" id="downloadBtn">
                <span class="spinner" id="spinner"></span>
                📥 Download PDF
              </button>
              <button class="btn" onclick="window.print()">
                🖨️ Print
              </button>
              <button class="btn" onclick="window.close()" style="background: #dc2626;">
                ❌ Close
              </button>
            </div>
          </div>
          
          <div class="content-wrapper">
            <div class="content" id="content">
              ${cleanHtml}
            </div>
          </div>
          
          <script>
            async function downloadPDF() {
              const downloadBtn = document.getElementById('downloadBtn');
              const spinner = document.getElementById('spinner');
              
              // Show loading state
              downloadBtn.disabled = true;
              spinner.style.display = 'inline-block';
              downloadBtn.innerHTML = '<span class="spinner"></span> Generating PDF...';
              
              try {
                const { jsPDF } = window.jspdf;
                const content = document.getElementById('content');
                
                // Create PDF
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                // Convert content to canvas
                const canvas = await html2canvas(content, {
                  scale: 2,
                  useCORS: true,
                  allowTaint: true,
                  backgroundColor: '#ffffff'
                });
                
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = 210; // A4 width in mm
                const pageHeight = 295; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;
                
                // Add image to PDF (handle multiple pages if needed)
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                  position = heightLeft - imgHeight;
                  pdf.addPage();
                  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                  heightLeft -= pageHeight;
                }
                
                // Download the PDF
                pdf.save('${fileName || 'PCR_Report'}.pdf');
                
              } catch (error) {
                console.error('Error generating PDF:', error);
                alert('Failed to generate PDF. Please try printing instead.');
              } finally {
                // Restore button state
                downloadBtn.disabled = false;
                spinner.style.display = 'none';
                downloadBtn.innerHTML = '📥 Download PDF';
              }
            }
            
            // Auto-focus for better user experience
            window.focus();
          </script>
        </body>
      </html>
    `;

    // Set headers for HTML response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Send the complete HTML page
    res.send(fullHtml);

  } catch (error) {
    console.error('Print preview error:', error);
    res.status(500).json({ 
      error: 'Failed to generate print preview',
      details: error.message 
    });
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
