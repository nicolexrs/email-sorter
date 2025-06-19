document.addEventListener('DOMContentLoaded', () => {
    const emailsFileInput = document.getElementById('emailsFile');
    const keywordsFileInput = document.getElementById('keywordsFile');
    const processButton = document.getElementById('processButton');
    const loadingMessage = document.getElementById('loading');
    const errorMessagesDiv = document.getElementById('errorMessages');
    const resultsSection = document.querySelector('.results-section');
    const resultsOutput = document.getElementById('resultsOutput');
    const downloadButton = document.getElementById('downloadButton');

    processButton.addEventListener('click', async () => {
        const emailsFile = emailsFileInput.files[0];
        const keywordsFile = keywordsFileInput.files[0];

        errorMessagesDiv.textContent = '';
        errorMessagesDiv.classList.add('hidden');
        resultsSection.classList.add('hidden');
        resultsOutput.textContent = '';
        downloadButton.classList.add('hidden');
        loadingMessage.classList.add('hidden');
        processButton.disabled = true;

        if (!emailsFile || !keywordsFile) {
            errorMessagesDiv.textContent = '⚠️ Please select both an emails file and a keywords file.';
            errorMessagesDiv.classList.remove('hidden');
            processButton.disabled = false;
            return;
        }

        loadingMessage.classList.remove('hidden');

        const formData = new FormData();
        formData.append('emailsFile', emailsFile);
        formData.append('keywordsFile', keywordsFile);

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const responseText = await response.text();

            if (response.ok) {
                resultsOutput.textContent = responseText || '✅ No matches found.';
                resultsSection.classList.remove('hidden');
                downloadButton.classList.remove('hidden');
            } else {
                errorMessagesDiv.textContent = `❌ Server error: ${responseText}`;
                errorMessagesDiv.classList.remove('hidden');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            errorMessagesDiv.textContent = `❌ Network or server error: ${error.message}`;
            errorMessagesDiv.classList.remove('hidden');
        } finally {
            loadingMessage.classList.add('hidden');
            processButton.disabled = false;
        }
    });

    downloadButton.addEventListener('click', () => {
        const content = resultsOutput.textContent;
        if (!content) return;

        const filename = 'email_results.txt';
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});

function showFileName(event, targetId) {
    const input = event.target;
    const fileName = input.files.length > 0 ? input.files[0].name : 'No file selected';
    document.getElementById(targetId).textContent = fileName;
}
