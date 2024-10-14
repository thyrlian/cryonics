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
    var name = document.getElementById('input-name').value;
    var time = getCurrentTimestampAsFilename();
    numberOfTabs = '(' + numberOfTabs + ' tabs' + ')';
    if (name) {
        return APP_NAME + ' ' + time + ' ' + name + ' ' + numberOfTabs;
    } else {
        return APP_NAME + ' ' + time + ' ' + numberOfTabs;
    }
}

function getRealKey(displayKey) {
    var regexTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    var regexTabs = /\(\d+\stabs\)/;
    var time = displayKey.match(regexTime)[0];
    var tabs = displayKey.match(regexTabs)[0];
    var name = displayKey.replace(time, '').replace(tabs, '').trim();
    if (name.length > 0) {
        return APP_NAME + ' ' + time + ' ' + name + ' ' + tabs;
    } else {
        return APP_NAME + ' ' + time + ' ' + tabs;
    }
}

function appendKeyTextChild(parent, key) {
    var regexAppName = new RegExp(APP_NAME + ' ');
    var regexTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\s/;
    var regexTabs = /\(\d+\stabs\)/;
    
    var time = key.match(regexTime)[0];
    var tabs = key.match(regexTabs)[0];
    var name = key.replace(regexAppName, '').replace(regexTime, '').replace(regexTabs, '');
    
    var spanName = document.createElement('span');
    spanName.setAttribute('class', 'key-name');
    spanName.innerHTML = name;

    var spanTabs = document.createElement('span');
    spanTabs.setAttribute('class', 'key-tabs');
    spanTabs.innerHTML = tabs;

    var spanTime = document.createElement('span');
    spanTime.setAttribute('class', 'key-time');
    spanTime.innerHTML = time;

    var divInfo = document.createElement('div');
    divInfo.setAttribute('class', 'key-info');
    divInfo.appendChild(spanTime);
    divInfo.appendChild(spanTabs);

    parent.appendChild(spanName);
    parent.appendChild(divInfo);
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

function focusOnNameField() {
    var nameField = document.getElementById('input-name');
    nameField.focus();
}

function resetNameFieldAndFocusOnIt() {
    var nameField = document.getElementById('input-name');
    nameField.value = '';
    nameField.focus();
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

function attachDebugInfo(keys) {
    var debugDivision = document.getElementById('debug');
    var list = document.createElement('ol');
    var debugSeparator = document.createElement('p');
    debugSeparator.appendChild(document.createTextNode('==================== DEBUG ===================='));
    debugDivision.innerHTML = '';
    debugDivision.appendChild(debugSeparator);
    debugDivision.appendChild(list);
    
    var attachURLs = function(key, urls) {
        for (var i = 0; i < urls.length; i++) {
            var item = document.createElement('li');
            var text = document.createTextNode(urls[i]);
            item.appendChild(text);
            list.appendChild(item);
        }
    };
    
    for (var i = 0; i < keys.length; i++) {
        retrieveURLs(keys[i], attachURLs);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var btnSave = document.getElementById('save');
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    var txtName = document.getElementById('input-name');
    var listId = 'list';
    
    updateListView(listId);
    focusOnNameField();
    
    txtName.addEventListener('keypress', function(event) {
        clickButtonOnEnterKeyPressed(btnSave, event);
    });
    
    btnSave.addEventListener('click', function() {
        getURLs(function(urls) {
            saveURLs(generateKeyName(urls.length), urls, function() {
                updateListView(listId);
                resetNameFieldAndFocusOnIt();
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
                focusOnNameField();
            });
        });
    });
});