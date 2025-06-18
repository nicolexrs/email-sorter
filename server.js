const express = require('express');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const app = express();
const port = 3000;

const upload = multer({ dest: 'uploads/' });
app.use(express.static('public'));

app.post('/upload', upload.fields([
    { name: 'emailsFile' },
    { name: 'keywordsFile' }
]), async (req, res) => {
    const emailsFilePath = req.files?.emailsFile?.[0]?.path;
    const keywordsFilePath = req.files?.keywordsFile?.[0]?.path;

    if (!emailsFilePath || !keywordsFilePath) {
        // Delete any uploaded file to avoid orphan files
        if (emailsFilePath && fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (keywordsFilePath && fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
        return res.status(400).send('Please upload both an emails file and a keywords file.');
    }

    const keywordMap = new Map();
    const emailResults = {};
    let outputContent = '';

    try {
        // Read keywords
        const rlKeywords = readline.createInterface({
            input: fs.createReadStream(keywordsFilePath),
            crlfDelay: Infinity
        });

        for await (const line of rlKeywords) {
            const keyword = line.trim().toLowerCase();
            if (keyword) {
                keywordMap.set(keyword, true);
                emailResults[keyword] = [];
            }
        }

        // Read emails and match keywords
        const rlEmails = readline.createInterface({
            input: fs.createReadStream(emailsFilePath),
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
        // Clean up uploaded files
        if (fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
    }
});

app.listen(port, () => {
    console.log(`✅ Server listening at http://localhost:${port}`);
});
