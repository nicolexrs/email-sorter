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
        if (emailsFilePath && fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (keywordsFilePath && fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
        return res.status(400).send('Please upload both an emails file and a keywords file.');
    }

    const keywordMap = new Map();
    let outputContent = '';

    try {
        const rlKeywords = readline.createInterface({
            input: fs.createReadStream(keywordsFilePath),
            crlfDelay: Infinity
        });

        for await (const line of rlKeywords) {
            const keyword = line.trim().toLowerCase();
            if (keyword) {
                keywordMap.set(keyword, true);
            }
        }

        const rlEmails = readline.createInterface({
            input: fs.createReadStream(emailsFilePath),
            crlfDelay: Infinity
        });

        const remainingEmails = [];

        for await (const line of rlEmails) {
            const email = line.trim().toLowerCase();
            if (email) {
                let hasKeyword = false;
                for (const keyword of keywordMap.keys()) {
                    if (email.includes(keyword)) {
                        hasKeyword = true;
                        break;
                    }
                }

                if (!hasKeyword) {
                    remainingEmails.push(email);
                }
            }
        }

        outputContent = remainingEmails.join('\n');
        res.send(outputContent || 'All emails contained keywords.');

    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).send('An error occurred during processing.');
    } finally {
        if (fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
    }
});

app.listen(port, () => {
    console.log(`✅ Server listening at http://localhost:${port}`);
});
