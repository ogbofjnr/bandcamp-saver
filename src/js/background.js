chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    let error = false;
    const { url, filename, secret } = request;

    if (url && filename && secret === 'ldibchichoihomejekglfdochkboepai') {
        try {
            chrome.downloads.download({
                url,
                // filename: `${filename}.mp3`, // TODO - fix it!!!
                saveAs: false
            });
        } catch(e) {
            error = true;
        }
    }

    sendResponse({ error, ...request });
});