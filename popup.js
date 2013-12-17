function getURLs(callback) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        var urls = [];
        for (var i = 0; i < tabs.length; i++) {
            urls.push(tabs[i].url);
        }
        callback(urls);
    });
}

function saveURLs() {
    
}

function retrieveURLs() {
    
}

function openURLs() {
    
}

function getCurrentTimestampAsFilename() {
    var timestamp = new Date();
    var filename = timestamp.getFullYear() + "_" + (timestamp.getMonth() + 1) + "_" + timestamp.getDate() + "_" + timestamp.getHours() + "_" + timestamp.getMinutes() + "_" + timestamp.getSeconds();
    return filename;
}