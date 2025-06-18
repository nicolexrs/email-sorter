const express = require('express');
const multer = require('multer');

const app = express();
const port = 3000;

// Use memory storage instead of disk
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static('public'));

app.post('/upload', upload.fields([
    { name: 'emailsFile' },
    { name: 'keywordsFile' }
]), async (req, res) => {
    const emailsFile = req.files?.emailsFile?.[0];
    const keywordsFile = req.files?.keywordsFile?.[0];

    if (!emailsFile || !keywordsFile) {
        return res.status(400).send('Please upload both an emails file and a keywords file.');
    }

    const keywordMap = new Map();
    const emailResults = {};
    let outputContent = '';

    try {
        const keywordLines = keywordsFile.buffer.toString('utf-8').split(/\r?\n/);
        for (const line of keywordLines) {
            const keyword = line.trim().toLowerCase();
            if (keyword) {
                keywordMap.set(keyword, true);
                emailResults[keyword] = [];
            }
        }

        const emailLines = emailsFile.buffer.toString('utf-8').split(/\r?\n/);
        for (const emailLine of emailLines) {
            const email = emailLine.trim().toLowerCase();
            if (email) {
                for (const keyword of keywordMap.keys()) {
                    if (email.includes(keyword)) {
                        emailResults[keyword].push(email);
                    }
                }
            }
        }

        for (const keyword in emailResults) {
            const matches = emailResults[keyword];
            if (matches.length > 0) {
                outputContent += `--- Keyword: ${keyword} ---\n`;
                outputContent += matches.join('\n') + '\n\n';
            }
        }

        res.send(outputContent || 'No matches found.');

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).send('An error occurred during processing.');
    }
});

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
