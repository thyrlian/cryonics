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

function getKeysBeginWithPatternFromStorage(pattern, callback) {
    STORAGE.get(null, function(items) {
        var regex = new RegExp(pattern);
        var allKeys = Object.keys(items);
        var wantedKeys = [];
        for (var i = 0; i < allKeys.length; i++) {
            if (allKeys[i].match(regex)) {
                wantedKeys.push(allKeys[i]);
            }
        }
        callback(wantedKeys);
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

function addListItemsAsCheckboxes(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('label');
        var checkbox = document.createElement('input');
        var itemText = document.createTextNode(items[i]);
        var linebreak = document.createElement('br');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('value', '');
        if (checkbox.addEventListener) {
            checkbox.addEventListener('click', function() {clickHandler(listId);}, false);
        } else if (checkbox.attachEvent) {
            checkbox.attachEvent('onclick', function() {clickHandler(listId);});
        }
        listItem.appendChild(checkbox);
        listItem.appendChild(itemText);
        listItem.appendChild(linebreak);
        document.getElementById(listId).appendChild(listItem);
    }
}

function clickHandler(listId) {
    var list = document.getElementById(listId);
    var counter = list.querySelectorAll('input[type="checkbox"]:checked').length;
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    if (counter > 0) {
        btnOpen.disabled = false;
        btnRemove.disabled = false;
    } else {
        btnOpen.disabled = true;
        btnRemove.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    getKeysBeginWithPatternFromStorage('cryonics', function(keys) {
        if (keys.length == 0) {
            document.getElementById('open').style.visibility = 'hidden';
            document.getElementById('remove').style.visibility = 'hidden';
            document.getElementById('hint-open').style.visibility = 'hidden';
        } else {
            addListItemsAsCheckboxes(keys, 'list');
        }
    });
});