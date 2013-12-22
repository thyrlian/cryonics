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

function openURLs(urls) {
    for (var i = 0; i < urls.length; i++) {
        chrome.tabs.create({"url": urls[i]});
    }
}

function getCurrentTimestampAsFilename() {
    var timestamp = new Date();
    var filename = timestamp.getFullYear() + "_" + (timestamp.getMonth() + 1) + "_" + timestamp.getDate() + "_" + timestamp.getHours() + "_" + timestamp.getMinutes() + "_" + timestamp.getSeconds();
    return filename;
}

function addListItems(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('li');
        var itemText = document.createTextNode(items[i]);
        listItem.appendChild(itemText);
        document.getElementById(listId).appendChild(listItem);
    }
}