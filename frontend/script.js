document.addEventListener('DOMContentLoaded', () => {
    // Note: Assuming standard local dev port for Wrangler or you can replace with prod URL later
    const API_URL = 'https://image-to-prompt-backend.aa6154332.workers.dev/';

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadContent = document.getElementById('uploadContent');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const removeBtn = document.getElementById('removeBtn');

    const customPromptInput = document.getElementById('customPrompt');
    const generateBtn = document.getElementById('generateBtn');

    const resultArea = document.getElementById('resultArea');
    const resultContent = document.getElementById('resultContent');
    const copyBtn = document.getElementById('copyBtn');

    const loadingOverlay = document.getElementById('loadingOverlay');

    let currentFile = null;

    // --- Drag and Drop Logic --- //

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('dragover'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => {
        // Only trigger click if the preview is not shown
        if (!currentFile) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', function (e) {
        if (this.files && this.files[0]) {
            handleFile(this.files[0]);
        }
    });

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        currentFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            uploadContent.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            generateBtn.disabled = false;
        };

        reader.readAsDataURL(file);
    }

    removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent triggering file input click
        clearImage();
    });

    function clearImage() {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        uploadContent.classList.remove('hidden');
        generateBtn.disabled = true;
        resultArea.classList.add('hidden');
    }

    // --- Generation Logic --- //

    generateBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // Show loading state
        loadingOverlay.classList.remove('hidden');
        // Small delay to allow CSS transition to kick in
        setTimeout(() => loadingOverlay.classList.add('active'), 10);
        resultArea.classList.add('hidden');

        try {
            const formData = new FormData();
            formData.append('image', currentFile);

            const customPrompt = customPromptInput.value.trim();
            if (customPrompt) {
                formData.append('prompt', customPrompt);
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to generate description');
            }

            const data = await response.json();

            // Assume the AI responds with an object containing 'response' or directly a string.
            // Often llava models return {"response": "..."} layout 
            // We should safely parse it.
            const resultText = data.response || JSON.stringify(data);

            resultContent.textContent = resultText;
            resultArea.classList.remove('hidden');

            // Scroll to results
            setTimeout(() => {
                resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);

        } catch (error) {
            alert('Error generating description: ' + error.message);
            console.error(error);
        } finally {
            loadingOverlay.classList.remove('active');
            setTimeout(() => loadingOverlay.classList.add('hidden'), 300);
        }
    });

    // --- Copy Logic --- //
    copyBtn.addEventListener('click', () => {
        const text = resultContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            icon.style.color = '#10b981'; // green

            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                icon.style.color = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy. Please try manually.');
        });
    });

});
