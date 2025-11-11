// index.js
const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

// Move PDF generation logic into a separate async function
async function generatePdf(html, launchOptions = {}) {
    const defaultLaunchOptions = {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    };

    if (!html) throw new Error('Missing html for PDF');

    let browser;
    try {
        browser = await puppeteer.launch({ ...defaultLaunchOptions, ...launchOptions });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
        });
        return pdfBuffer;
    } finally {
        if (browser) await browser.close();
    }
}

// API route
app.post('/generate', async (req, res) => {
    const { html, launchOptions } = req.body;
    try {
        const pdfBuffer = await generatePdf(html, launchOptions);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
        });
        res.end(pdfBuffer);
    } catch (err) {
        console.error('PDF error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Healthcheck
app.get('/health', (req, res) => res.status(200).send('ok'));

// Start server only if this file is run directly
if (require.main === module) {
    app.listen(8080, () => console.log('PDF service running on port 8080'));
}

// Export for tests
module.exports = { app, generatePdf };
