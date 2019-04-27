chrome.runtime.onMessage.addListener((request, sender, cb) => {
    const { url, filename, secret } = request;

    if (url && secret === 'ldibchichoihomejekglfdochkboepai') {
        try {
            const params = { url, saveAs: false };
            if (filename) params.filename =`${filename}.mp3`;

            chrome.downloads.download(params, (res) => {
                if (!res) {
                    params.filename = `${Date.now()}.mp3`;
                    chrome.downloads.download(params);
                }
            });

        } catch(e) {}

        cb();
    }
});