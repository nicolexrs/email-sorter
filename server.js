const express = require('express');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const app = express();
const port = 3000;

// ✅ CHANGED: use memoryStorage instead of disk storage
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static('public'));

app.post('/upload', upload.fields([
    { name: 'emailsFile' },
    { name: 'keywordsFile' }
]), async (req, res) => {
    // ✅ CHANGED: Read from memory instead of disk path
    const emailsFile = req.files?.emailsFile?.[0];
    const keywordsFile = req.files?.keywordsFile?.[0];

    if (!emailsFile || !keywordsFile) {
        return res.status(400).send('Please upload both an emails file and a keywords file.');
    }

    const keywordMap = new Map();
    const emailResults = {};
    let outputContent = '';

    try {
        // ✅ CHANGED: Read keyword file from memory
        const rlKeywords = readline.createInterface({
            input: require('stream').Readable.from(keywordsFile.buffer.toString().split(/\r?\n/)),
            crlfDelay: Infinity
        });

        for await (const line of rlKeywords) {
            const keyword = line.trim().toLowerCase();
            if (keyword) {
                keywordMap.set(keyword, true);
                emailResults[keyword] = [];
            }
        }

        // ✅ CHANGED: Read email file from memory
        const rlEmails = readline.createInterface({
            input: require('stream').Readable.from(emailsFile.buffer.toString().split(/\r?\n/)),
            crlfDelay: Infinity
        });

        for await (const line of rlEmails) {
            const email = line.trim().toLowerCase();
            if (email) {
                for (const keyword of keywordMap.keys()) {
                    if (email.includes(keyword)) {
                        emailResults[keyword].push(email);
                    }
                }
            }
        }

        // Compile output
        for (const keyword in emailResults) {
            const matchedEmails = emailResults[keyword];
            if (matchedEmails.length > 0) {
                outputContent += `--- Keyword: ${keyword} ---\n`;
                outputContent += matchedEmails.join('\n') + '\n\n';
            }
        }

        res.send(outputContent || 'No matches found.');

    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).send('An error occurred during processing.');
    } finally {
        // ✅ REMOVED: File cleanup no longer needed in memory mode
    }
});

app.listen(port, () => {
    console.log(`✅ Server listening at http://localhost:${port}`);
});
