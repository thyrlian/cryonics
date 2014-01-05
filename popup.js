var STORAGE = chrome.storage.sync;
var APP_NAME = 'cryonics';

function getURLs(callback) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        var urls = [];
        for (var i = 0; i < tabs.length; i++) {
            urls.push(tabs[i].url);
        }
        callback(urls);
    });
}

function saveURLs(key, urls, callback) {
    var obj = {};
    obj[key] = urls;
    STORAGE.set(obj, callback);
}

function retrieveURLs(key, callback) {
    STORAGE.get(key, function(items) {
        var urls = items[key];
        callback(key, urls);
    });
}

function openURLsFromMultipleKeysAndThenRemoveThem(keys) {
    var openAndThenRemove = function(key, urls) {
        openURLs(urls);
        removeURLs([key]);
    };
    
    for (var i = 0; i < keys.length; i++) {
        retrieveURLs(keys[i], openAndThenRemove);
    }
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

function removeURLs(keys, callback) {
    for (var i = 0; i < keys.length; i++) {
        STORAGE.remove(keys[i]);
    }
    callback();
}

function openURLs(urls) {
    for (var i = 0; i < urls.length; i++) {
        chrome.tabs.create({'url': urls[i]});
    }
}

function getCurrentTimestampAsFilename() {
    var normalizeTimeToTwoDigits = function(time) {
        if (time < 10) {
            time = '0' + time.toString();
        }
        return time;
    };
    var timestamp = new Date();
    var filename = timestamp.getFullYear() + '-' + normalizeTimeToTwoDigits((timestamp.getMonth() + 1)) + '-' + normalizeTimeToTwoDigits(timestamp.getDate()) + 'T' + normalizeTimeToTwoDigits(timestamp.getHours()) + ':' + normalizeTimeToTwoDigits(timestamp.getMinutes()) + ':' + normalizeTimeToTwoDigits(timestamp.getSeconds());
    return filename;
}

function generateKeyName(numberOfTabs) {
    var hint = document.getElementById('input-hint').value;
    var time = getCurrentTimestampAsFilename();
    numberOfTabs = '(' + numberOfTabs + ' tabs' + ')';
    if (hint) {
        return APP_NAME + ' ' + time + ' ' + hint + ' ' + numberOfTabs;
    } else {
        return APP_NAME + ' ' + time + ' ' + numberOfTabs;
    }
}

function getRealKey(displayKey) {
    return APP_NAME + ' ' + displayKey;
}

function appendKeyTextChild(parent, key) {
    var regexAppName = new RegExp(APP_NAME + ' ');
    var regexTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\s/;
    var regexTabs = /\(\d+\stabs\)/;
    var time = key.match(regexTime)[0];
    var tabs = key.match(regexTabs)[0];
    var hint = key.replace(regexAppName, '').replace(regexTime, '').replace(regexTabs, '');
    var textNodeTime = document.createTextNode(time);
    var spanTabs = document.createElement('span');
    spanTabs.setAttribute('class', 'key-tabs');
    spanTabs.innerHTML = tabs;
    parent.appendChild(textNodeTime);
    if (hint.length != 0) {
        var spanHint = document.createElement('span');
        spanHint.setAttribute('class', 'key-hint');
        spanHint.innerHTML = hint;
        parent.appendChild(spanHint);
    }
    parent.appendChild(spanTabs);
}

function addListItemsAsCheckboxes(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('label');
        var checkbox = document.createElement('input');
        var linebreak = document.createElement('br');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('value', '');
        checkbox.addEventListener('click', makeClickHandler(listId));
        listItem.appendChild(checkbox);
        appendKeyTextChild(listItem, items[i]);
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

function makeClickHandler(listId) {
    return function() {
        clickHandler(listId);
    };
}

function updateListView(listId) {
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    var textHint = document.getElementById('hint-open');
    document.getElementById(listId).innerHTML = '';
    getKeysBeginWithPatternFromStorage(APP_NAME, function(keys) {
        if (keys.length == 0) {
            btnOpen.style.visibility = 'hidden';
            btnRemove.style.visibility = 'hidden';
            textHint.style.visibility = 'hidden';
        } else {
            addListItemsAsCheckboxes(keys, listId);
            btnOpen.style.visibility = 'visible';
            btnRemove.style.visibility = 'visible';
            textHint.style.visibility = 'visible';
            btnOpen.disabled = true;
            btnRemove.disabled = true;
        }
    });
}

function focusOnHintField() {
    var hintField = document.getElementById('input-hint');
    hintField.focus();
}

function resetHintFieldAndFocusOnIt() {
    var hintField = document.getElementById('input-hint');
    hintField.value = '';
    hintField.focus();
}

function getCheckedKeysAndHandleThem(listId, callback) {
    var list = document.getElementById(listId);
    var items = list.querySelectorAll('input[type="checkbox"]:checked');
    var keys = [];
    for (var i = 0; i < items.length; i++) {
        var key = getRealKey(items[i].parentNode.textContent);
        keys.push(key);
    }
    callback(keys);
}

function clickButtonOnEnterKeyPressed(button, event) {
    if (event.keyCode == 13) {
        button.click();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var btnSave = document.getElementById('save');
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    var txtHint = document.getElementById('input-hint');
    var listId = 'list';
    
    updateListView(listId);
    focusOnHintField();
    
    txtHint.addEventListener('keypress', function(event) {
        clickButtonOnEnterKeyPressed(btnSave, event);
    });
    
    btnSave.addEventListener('click', function() {
        getURLs(function(urls) {
            saveURLs(generateKeyName(urls.length), urls, function() {
                updateListView(listId);
                resetHintFieldAndFocusOnIt();
            });
        });
    });
    
    btnOpen.addEventListener('click', function() {
        getCheckedKeysAndHandleThem(listId, function(keys) {
            openURLsFromMultipleKeysAndThenRemoveThem(keys);
        });
    });
    
    btnRemove.addEventListener('click', function() {
        getCheckedKeysAndHandleThem(listId, function(keys) {
            removeURLs(keys, function() {
                updateListView(listId);
                focusOnHintField();
            });
        });
    });
});