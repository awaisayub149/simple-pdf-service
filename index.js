const express = require('express');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/generate', async (req, res) => {
    const { html, launchOptions = {} } = req.body;
    const defaultLaunchOptions = {
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // For production environments
    };

    if (!html) {
        return res.status(400).json({ success: false, message: 'Missing html for PDF' });
    }

    let browser;
    try {
        // Launch Puppeteer
        browser = await puppeteer.launch({ ...defaultLaunchOptions, ...launchOptions });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '10mm', bottom: '20mm', left: '10mm' },
        });

        res.set({
            // 'Content-Type': 'application/pdf',
            // 'Content-Disposition': `attachment; filename=generated.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF error:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(8080, () => console.log('PDF service running on port 8080'));
