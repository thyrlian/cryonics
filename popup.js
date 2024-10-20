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
    var list = document.getElementById('list');
    var scrollTop = list.scrollTop;

    for (var i = 0; i < keys.length; i++) {
        STORAGE.remove(keys[i]);
    }

    updateListView('list', function() {
        list.scrollTop = scrollTop;
        focusOnNameField();
        if (callback) callback();
    });
}

function openURLs(urls) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        let newTabId = null;
        
        for (let tab of tabs) {
            if (tab.url === 'chrome://newtab/') {
                newTabId = tab.id;
                break;
            }
        }

        let openedCount = 0;
        for (let i = 0; i < urls.length; i++) {
            chrome.tabs.create({'url': urls[i], 'active': false}, function(tab) {
                openedCount++;
                if (openedCount === urls.length && newTabId) {
                    chrome.tabs.remove(newTabId);
                }
            });
        }
    });
}

function getCurrentTimestampAsFilename() {
    var normalizeTimeToTwoDigits = function(time) {
        return time < 10 ? '0' + time : time.toString();
    };
    var timestamp = new Date();
    var filename = timestamp.getFullYear() + '-' +
                   normalizeTimeToTwoDigits(timestamp.getMonth() + 1) + '-' +
                   normalizeTimeToTwoDigits(timestamp.getDate()) + 'T' +
                   normalizeTimeToTwoDigits(timestamp.getHours()) + ':' +
                   normalizeTimeToTwoDigits(timestamp.getMinutes()) + ':' +
                   normalizeTimeToTwoDigits(timestamp.getSeconds());
    return filename;
}

function generateKeyName(numberOfTabs) {
    var name = document.getElementById('input-name').value;
    var time = getCurrentTimestampAsFilename();
    numberOfTabs = numberOfTabs + ' tabs';
    if (name) {
        return APP_NAME + ' ' + time + ' ' + name + ' ' + numberOfTabs;
    } else {
        return APP_NAME + ' ' + time + ' ' + numberOfTabs;
    }
}

function getRealKey(displayKey) {
    var regexTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    var regexTabs = /\d+\stabs/;
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
    var regexTabs = /\d+\stabs/;
    
    var time = key.match(regexTime)[0];
    var tabs = key.match(regexTabs)[0];
    var name = key.replace(regexAppName, '').replace(regexTime, '').replace(regexTabs, '').trim();
    
    // Create hidden element to store the full key
    var hiddenKey = document.createElement('span');
    hiddenKey.setAttribute('class', 'hidden-key');
    hiddenKey.textContent = key;
    hiddenKey.style.display = 'none';
    parent.appendChild(hiddenKey);

    var spanName = document.createElement('span');
    spanName.setAttribute('class', 'key-name');
    spanName.textContent = name;

    var spanTabs = document.createElement('span');
    spanTabs.setAttribute('class', 'key-tabs');
    spanTabs.textContent = tabs;

    var spanTime = document.createElement('span');
    spanTime.setAttribute('class', 'key-time');
    var formattedDate = formatDate(time);
    spanTime.textContent = formattedDate;

    var divInfo = document.createElement('div');
    divInfo.setAttribute('class', 'key-info');
    divInfo.appendChild(spanTime);
    divInfo.appendChild(spanTabs);

    parent.appendChild(spanName);
    parent.appendChild(divInfo);
}

// New function to format the date
function formatDate(dateString) {
    // Remove the 'T' and replace it with a space to make it ISO 8601 compatible
    const isoDateString = dateString.replace('T', ' ');
    const date = new Date(isoDateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function addListItemsAsCheckboxes(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('label');
        listItem.setAttribute('data-key', items[i]);
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

function updateListView(listId, callback) {
    var list = document.getElementById(listId);
    var scrollTop = list.scrollTop;
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    var textHint = document.getElementById('hint-open');
    
    getKeysBeginWithPatternFromStorage(APP_NAME, function(keys) {
        // Migrate keys
        var migratedKeys = migrateKeys(keys);
        
        // If any keys were migrated, update them in storage
        if (migratedKeys.some((key, index) => key !== keys[index])) {
            updateKeysInStorage(keys, migratedKeys, function() {
                populateList(migratedKeys);
            });
        } else {
            populateList(migratedKeys);
        }
    });

    function populateList(keys) {
        list.innerHTML = '';
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
        
        list.scrollTop = scrollTop;
        
        setupScrollingNames();
        
        if (callback) callback();
    }
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
    var checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
    var keys = [];
    for (var i = 0; i < checkboxes.length; i++) {
        var hiddenKey = checkboxes[i].closest('label').querySelector('.hidden-key');
        keys.push(hiddenKey.textContent);
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

function notifyItemAdded(newKey) {
  // Show notification
  const notification = document.getElementById('notification');
  notification.classList.remove('hidden');
  setTimeout(() => {
    notification.classList.add('hidden');
  }, 2000);

  // Update the list view
  const list = document.getElementById('list');
  const isScrolledToBottom = list.scrollHeight - list.scrollTop === list.clientHeight;

  updateListView('list', function() {
    // After the list is updated, find the new item
    const newItem = document.querySelector(`label[data-key="${newKey}"]`);
    if (newItem) {
      if (isScrolledToBottom) {
        // If we were at the bottom, scroll to the new item
        newItem.scrollIntoView({ behavior: 'auto', block: 'end' });
      } else {
        // Check if the new item is in view
        const rect = newItem.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        if (rect.bottom > listRect.bottom || rect.top < listRect.top) {
          // If not in view, scroll to it
          newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
      
      // Highlight the new item without changing its size
      requestAnimationFrame(() => {
        newItem.style.transition = 'background-color 0.3s ease-in-out';
        newItem.style.backgroundColor = '#fffacd';
        setTimeout(() => {
          newItem.style.backgroundColor = '';
          setTimeout(() => {
            newItem.style.transition = '';
          }, 300);
        }, 1500);
      });
    }
  });
}

function migrateKeys(keys) {
    return keys.map(key => {
        if (key.endsWith(')')) {
            return key.replace(/ \((\d+ tabs)\)$/, ' $1');
        }
        return key;
    });
}

function updateKeysInStorage(oldKeys, newKeys, callback) {
    var updates = {};
    oldKeys.forEach((oldKey, index) => {
        if (oldKey !== newKeys[index]) {
            STORAGE.get(oldKey, function(result) {
                updates[newKeys[index]] = result[oldKey];
                STORAGE.remove(oldKey, function() {
                    STORAGE.set(updates, callback);
                });
            });
        }
    });
}

function setupScrollingNames() {
    const nameElements = document.querySelectorAll('#list .key-name');
    nameElements.forEach(nameElement => {
        if (nameElement.scrollWidth > nameElement.offsetWidth) {
            const parentLabel = nameElement.closest('label');
            const parentHeight = parentLabel.offsetHeight;

            let isHovering = false;
            let hoverTimeout;

            const scroll = async () => {
                if (!isHovering) return;

                nameElement.classList.add('scrolling');
                const maxScroll = nameElement.scrollWidth - nameElement.offsetWidth;
                
                // Scroll from right to left
                for (let i = 0; i <= maxScroll; i += 2) {
                    if (!isHovering) break;
                    nameElement.scrollLeft = i;
                    await new Promise(resolve => setTimeout(resolve, 20)); // Adjust speed here
                }

                // Wait at the end
                if (isHovering) await new Promise(resolve => setTimeout(resolve, 1000));

                // Reset to start
                if (isHovering) nameElement.scrollLeft = 0;

                // Wait at the start
                if (isHovering) await new Promise(resolve => setTimeout(resolve, 1000));

                // Repeat if still hovering
                if (isHovering) requestAnimationFrame(scroll);
            };

            // Create a hover area that covers the entire row
            const hoverArea = document.createElement('div');
            hoverArea.style.position = 'absolute';
            hoverArea.style.top = '0';
            hoverArea.style.left = '0';
            hoverArea.style.width = '100%';
            hoverArea.style.height = `${parentHeight}px`;
            hoverArea.style.zIndex = '1';
            parentLabel.style.position = 'relative';
            parentLabel.appendChild(hoverArea);

            hoverArea.addEventListener('mouseenter', () => {
                isHovering = true;
                // Set a timeout to start scrolling after 0.5 seconds
                hoverTimeout = setTimeout(() => {
                    scroll();
                }, 500);
            });

            hoverArea.addEventListener('mouseleave', () => {
                isHovering = false;
                // Clear the timeout if the mouse leaves before 0.5 seconds
                clearTimeout(hoverTimeout);
                nameElement.scrollLeft = 0;
                nameElement.classList.remove('scrolling');
            });
        }
    });
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
            const newKey = generateKeyName(urls.length);
            saveURLs(newKey, urls, function() {
                notifyItemAdded(newKey);
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
