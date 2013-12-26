var STORAGE = chrome.storage.sync;

function getURLs(callback) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        var urls = [];
        for (var i = 0; i < tabs.length; i++) {
            urls.push(tabs[i].url);
        }
        callback(urls);
    });
}

function saveURLs(key, urls) {
    var obj = {};
    obj[key] = urls;
    STORAGE.set(obj);
}

function retrieveURLs(key, callback) {
    STORAGE.get(key, function(items) {
        callback(items[key]);
    });
}

// used for debug only
function getAllKeysFromStorage(callback) {
    STORAGE.get(null, function(items) {
        var keys = Object.keys(items);
        callback(keys);
    });
}

function removeURLs(keys) {
    for (var i = 0; i < keys.length; i++) {
        STORAGE.remove(keys[i]);
    }
}

function openURLs(urls) {
    for (var i = 0; i < urls.length; i++) {
        chrome.tabs.create({"url": urls[i]});
    }
}

function getCurrentTimestampAsFilename() {
    var normalizeTimeToTwoDigits = function(time) {
        if (time < 10) {
            time = "0" + time.toString();
        }
        return time;
    };
    var timestamp = new Date();
    var filename = timestamp.getFullYear() + "-" + normalizeTimeToTwoDigits((timestamp.getMonth() + 1)) + "-" + normalizeTimeToTwoDigits(timestamp.getDate()) + "T" + normalizeTimeToTwoDigits(timestamp.getHours()) + ":" + normalizeTimeToTwoDigits(timestamp.getMinutes()) + ":" + normalizeTimeToTwoDigits(timestamp.getSeconds());
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

function addListItemsAsCheckboxes(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('label');
        var checkbox = document.createElement('input');
        var itemText = document.createTextNode(items[i]);
        var linebreak = document.createElement('br');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('value', '');
        listItem.appendChild(checkbox);
        listItem.appendChild(itemText);
        listItem.appendChild(linebreak);
        document.getElementById(listId).appendChild(listItem);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
});