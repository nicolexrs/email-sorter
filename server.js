const express = require('express');
const multer = require('multer');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const app = express();
const port = 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });
app.use(express.static('public')); // Serve frontend files from /public

// Handle file uploads and filtering
app.post('/upload', upload.fields([
    { name: 'emailsFile' },
    { name: 'keywordsFile' }
]), async (req, res) => {
    const emailsFile = req.files?.emailsFile?.[0];
    const keywordsFile = req.files?.keywordsFile?.[0];

    const emailsFilePath = emailsFile?.path;
    const keywordsFilePath = keywordsFile?.path;

    // Ensure both files are provided
    if (!emailsFilePath || !keywordsFilePath) {
        if (emailsFilePath && fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (keywordsFilePath && fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
        return res.status(400).send('Please upload both an emails file and a keywords file.');
    }

    const keywordSet = new Set();
    let outputContent = '';

    try {
        // Read keywords into a Set
        const rlKeywords = readline.createInterface({
            input: fs.createReadStream(keywordsFilePath),
            crlfDelay: Infinity
        });

        for await (const line of rlKeywords) {
            const keyword = line.trim().toLowerCase();
            if (keyword) keywordSet.add(keyword);
        }

        if (keywordSet.size === 0) {
            return res.status(400).send('The keywords file is empty.');
        }

        // Filter emails
        const rlEmails = readline.createInterface({
            input: fs.createReadStream(emailsFilePath),
            crlfDelay: Infinity
        });

        const remainingEmails = [];

        for await (const line of rlEmails) {
            const email = line.trim().toLowerCase();
            if (email) {
                let hasKeyword = false;
                for (const keyword of keywordSet) {
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
        if (!outputContent) outputContent = 'All emails contained keywords.';

        res.setHeader('Content-Disposition', 'attachment; filename="filtered_emails.txt"');
        res.setHeader('Content-Type', 'text/plain');
        res.send(outputContent);

    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).send('An error occurred during processing.');
    } finally {
        // Clean up temp files
        if (fs.existsSync(emailsFilePath)) fs.unlinkSync(emailsFilePath);
        if (fs.existsSync(keywordsFilePath)) fs.unlinkSync(keywordsFilePath);
    }
});

app.listen(port, () => {
    console.log(`✅ Server listening at http://localhost:${port}`);
});
