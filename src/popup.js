var STORAGE = chrome.storage.sync;

const KeyManager = {
    APP_NAME: 'cryonics',
    KEY_ATTRIBUTE: 'data-key',

    // Generates a unique key name for storing tabs information
    generateKeyName: function(numberOfTabs) {
        const name = document.getElementById('input-name').value;
        const time = this.getCurrentTimestampAsFilename();
        const tabsString = `${numberOfTabs} tabs`;
        return name 
            ? `${this.APP_NAME} ${time} ${name} ${tabsString}`
            : `${this.APP_NAME} ${time} ${tabsString}`;
    },

    // Returns the current timestamp formatted as a filename
    getCurrentTimestampAsFilename: function() {
        const normalizeTimeToTwoDigits = time => time < 10 ? `0${time}` : time.toString();
        const now = new Date();
        return `${now.getFullYear()}-${normalizeTimeToTwoDigits(now.getMonth() + 1)}-${normalizeTimeToTwoDigits(now.getDate())}T${normalizeTimeToTwoDigits(now.getHours())}:${normalizeTimeToTwoDigits(now.getMinutes())}:${normalizeTimeToTwoDigits(now.getSeconds())}`;
    },

    // Parses a key to extract time, tabs, and name
    parseKey: function(key) {
        const regexAppName = new RegExp(this.APP_NAME + ' ');
        const regexTime = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\s/;
        const regexTabs = /\d+\stabs/;
        
        const time = key.match(regexTime)[0];
        const tabs = key.match(regexTabs)[0];
        const name = key.replace(regexAppName, '').replace(regexTime, '').replace(regexTabs, '').trim();
        
        return { time, tabs, name };
    },

    // Formats a date string into a more readable format
    formatDate: function(dateString) {
        const isoDateString = dateString.replace('T', ' ');
        const date = new Date(isoDateString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }
        
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },

    // Migrates old key format to new format
    migrateKey: function(key) {
        return key.endsWith(')') ? key.replace(/ \((\d+ tabs)\)$/, ' $1') : key;
    },

    // Sets a key attribute on an element
    setKeyAttribute: function(element, key) {
        element.setAttribute(this.KEY_ATTRIBUTE, key);
    },

    // Gets the key attribute from an element
    getKeyAttribute: function(element) {
        return element.getAttribute(this.KEY_ATTRIBUTE);
    },

    // Retrieves the full key from an element
    getFullKey: function(element) {
        return this.getKeyAttribute(element.closest('label'));
    },

    // Generates a selector for a key
    generateKeySelector: function(key) {
        return `label[${this.KEY_ATTRIBUTE}="${key}"]`;
    }
};

// Retrieves URLs from the current window's tabs
function getURLs(callback) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        var urls = [];
        for (var i = 0; i < tabs.length; i++) {
            urls.push(tabs[i].url);
        }
        callback(urls);
    });
}

// Saves URLs under a specific key in storage
function saveURLs(key, urls, callback) {
    var obj = {};
    obj[key] = urls;
    STORAGE.set(obj, callback);
}

// Retrieves URLs from storage using a key
function retrieveURLs(key, callback) {
    STORAGE.get(key, function(items) {
        var urls = items[key];
        callback(key, urls);
    });
}

// Removes URLs from storage using keys
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

// Updates keys in storage
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

function openURLs(urls) {
    let openedCount = 0;
    const totalUrls = urls.length;

    const openNextUrl = () => {
        if (openedCount < totalUrls) {
            chrome.tabs.create({'url': urls[openedCount], 'active': false}, () => {
                openedCount++;
                openNextUrl();
            });
        } else {
            closeNewTabs();
        }
    };

    if (totalUrls > 0) {
        openNextUrl();
    } else {
        closeNewTabs();
    }
}

// Appends key text as child elements
function appendKeyTextChild(parent, key) {
    const { time, tabs, name } = KeyManager.parseKey(key);

    const spanName = document.createElement('span');
    spanName.setAttribute('class', 'key-name');
    spanName.textContent = name;

    const spanTabs = document.createElement('span');
    spanTabs.setAttribute('class', 'key-tabs');
    spanTabs.textContent = tabs;

    const spanTime = document.createElement('span');
    spanTime.setAttribute('class', 'key-time');
    const formattedDate = KeyManager.formatDate(time);
    spanTime.textContent = formattedDate;

    const divInfo = document.createElement('div');
    divInfo.setAttribute('class', 'key-info');
    divInfo.appendChild(spanTime);
    divInfo.appendChild(spanTabs);

    parent.appendChild(spanName);
    parent.appendChild(divInfo);
}

// Adds list items as checkboxes
function addListItemsAsCheckboxes(items, listId) {
    for (var i = 0; i < items.length; i++) {
        var listItem = document.createElement('label');
        KeyManager.setKeyAttribute(listItem, items[i]);
        var checkbox = document.createElement('input');
        var linebreak = document.createElement('br');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('value', '');
        checkbox.addEventListener('click', function() {
            clickHandler(listId);
        });
        listItem.appendChild(checkbox);
        appendKeyTextChild(listItem, items[i]);
        listItem.appendChild(linebreak);
        document.getElementById(listId).appendChild(listItem);
    }
}

// Handles click events for checkboxes
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

// Updates the list view
function updateListView(listId) {
    var list = document.getElementById(listId);
    var emptyMessage = document.getElementById('empty-message');
    var bottomBar = document.querySelector('.bottom-bar');
    var scrollTop = list.scrollTop;
    var btnOpen = document.getElementById('open');
    var btnRemove = document.getElementById('remove');
    var textHint = document.getElementById('hint-open');
    
    getKeysBeginWithPatternFromStorage(KeyManager.APP_NAME, function(keys) {
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
            emptyMessage.style.display = 'block';
            list.style.display = 'none';
            bottomBar.style.display = 'none';
        } else {
            emptyMessage.style.display = 'none';
            list.style.display = 'block';
            bottomBar.style.display = 'flex';
            addListItemsAsCheckboxes(keys, listId);
            btnOpen.style.visibility = 'visible';
            btnRemove.style.visibility = 'visible';
            textHint.style.visibility = 'visible';
            btnOpen.disabled = true;
            btnRemove.disabled = true;
        }

        list.scrollTop = scrollTop;
        setupScrollingNames();
    }
}

// Focuses on the name input field
function focusOnNameField() {
    var nameField = document.getElementById('input-name');
    nameField.focus();
}

// Resets the name input field and focuses on it
function resetNameFieldAndFocusOnIt() {
    var nameField = document.getElementById('input-name');
    nameField.value = '';
    nameField.focus();
}

function getCheckedKeysAndHandleThem(listId, callback) {
    var list = document.getElementById(listId);
    var checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
    var keys = Array.from(checkboxes).map(checkbox => KeyManager.getFullKey(checkbox));
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
    const newItem = document.querySelector(KeyManager.generateKeySelector(newKey));
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

// Sets up scrolling for long names
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

function migrateKeys(keys) {
    return keys.map(key => KeyManager.migrateKey(key));
}

function closeNewTabs(callback) {
    chrome.tabs.query({currentWindow: true}, function(tabs) {
        let newTabIds = tabs
            .filter(tab => tab.url === 'chrome://newtab/')
            .map(tab => tab.id);

        if (newTabIds.length > 0) {
            chrome.tabs.remove(newTabIds, callback);
        } else if (callback) {
            callback();
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
    
    btnOpen.disabled = true;
    btnRemove.disabled = true;
    
    txtName.addEventListener('keypress', function(event) {
        clickButtonOnEnterKeyPressed(btnSave, event);
    });
    
    btnSave.addEventListener('click', function() {
        getURLs(function(urls) {
            const newKey = KeyManager.generateKeyName(urls.length);
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
