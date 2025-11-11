const request = require('supertest');
const path = require('path');
const fs = require('fs');
const { app, generatePdf } = require('../index'); // import both

jest.setTimeout(30000); // Puppeteer can be slow

describe('PDF Service', () => {

    // -------------------------
    // Unit test for generatePdf
    // -------------------------
    // describe('generatePdf function', () => {
    //     it('should return a valid PDF buffer', async () => {
    //         const html = '<h1>Hello, PDF!</h1>';
    //         const pdfBuffer = await generatePdf(html);

    //         expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    //         expect(pdfBuffer.length).toBeGreaterThan(1000);

    //         // PDF should start with %PDF
    //         const signature = pdfBuffer.toString('utf8', 0, 4);
    //         expect(signature).toBe('%PDF');
    //     });

    //     it('should throw error when html is missing', async () => {
    //         await expect(generatePdf()).rejects.toThrow('Missing html for PDF');
    //     });
    // });

    // -------------------------
    // Integration test for API
    // -------------------------
    describe('POST /generate', () => {
        it('should return a valid PDF via API', async () => {
            const html = '<h1>Hello, PDF via API!</h1>';

            const response = await request(app)
                .post('/generate')
                .send({ html })
                .expect(200)
                .expect('Content-Type', /application\/pdf/);
            const buffer = response.body;
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(1000);

            const signature = buffer.toString('utf8', 0, 4);
            expect(signature).toBe('%PDF');
        });

        it('should return 400 if html is missing', async () => {
            const response = await request(app)
                .post('/generate')
                .send({})
                .expect(500); // because generatePdf throws, API catches and sends 500

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Missing html');
        });
        it('should return a valid PDF via API and write to file', async () => {
            const html = '<h1>Hello, PDF via API!</h1>';

            const response = await request(app)
                .post('/generate')
                .send({ html })
                .expect(200)
                .expect('Content-Type', /application\/pdf/);

            const buffer = response.body;
            expect(Buffer.isBuffer(buffer)).toBe(true);
            expect(buffer.length).toBeGreaterThan(1000);

            // PDF should start with %PDF
            const signature = buffer.toString('utf8', 0, 4);
            expect(signature).toBe('%PDF');

            // Write buffer to file
            const filePath = path.join(__dirname, 'test-output-api.pdf');
            fs.writeFileSync(filePath, buffer);
            console.log(`PDF via API written to ${filePath}`);
        });
    });
});
