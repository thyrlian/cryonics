const STORAGE = chrome.storage.sync;

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
    migrateKey: (key) => key.endsWith(')') ? key.replace(/ \((\d+ tabs)\)$/, ' $1') : key,

    // Sets a key attribute on an element
    setKeyAttribute: (element, key) => element.setAttribute(KeyManager.KEY_ATTRIBUTE, key),

    // Gets the key attribute from an element
    getKeyAttribute: (element) => element.getAttribute(KeyManager.KEY_ATTRIBUTE),

    // Retrieves the full key from an element
    getFullKey: (element) => KeyManager.getKeyAttribute(element.closest('label')),

    // Generates a selector for a key
    generateKeySelector: (key) => `label[${KeyManager.KEY_ATTRIBUTE}="${key}"]`
};

// Retrieves URLs from the current window's tabs
async function getURLs() {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.map(tab => tab.url);
}

// Saves URLs under a specific key in storage
function saveURLs(key, urls, callback) {
    const obj = { [key]: urls };
    STORAGE.set(obj, callback);
}

// Retrieves URLs from storage using a key
function retrieveURLs(key, callback) {
    STORAGE.get(key, (items) => {
        const urls = items[key];
        callback(key, urls);
    });
}

// Removes URLs from storage using keys
function removeURLs(keys, callback) {
    const list = document.getElementById('list');
    const scrollTop = list.scrollTop;

    keys.forEach(key => STORAGE.remove(key));

    updateListView('list', () => {
        list.scrollTop = scrollTop;
        focusOnNameField();
        if (callback) callback();
    });
}

// Updates keys in storage
function updateKeysInStorage(oldKeys, newKeys, callback) {
    const updates = {};
    oldKeys.forEach((oldKey, index) => {
        if (oldKey !== newKeys[index]) {
            STORAGE.get(oldKey, (result) => {
                updates[newKeys[index]] = result[oldKey];
                STORAGE.remove(oldKey, () => {
                    STORAGE.set(updates, callback);
                });
            });
        }
    });
}

function getKeysBeginWithPatternFromStorage(pattern, callback) {
    STORAGE.get(null, (items) => {
        const regex = new RegExp(pattern);
        const allKeys = Object.keys(items);
        const wantedKeys = allKeys.filter(key => key.match(regex));
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

function openURLsFromMultipleKeysAndThenRemoveThem(keys) {
    keys.forEach(key => {
        retrieveURLs(key, (key, urls) => {
            openURLs(urls);
            removeURLs([key]);
        });
    });
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
    items.forEach(item => {
        const listItem = document.createElement('label');
        KeyManager.setKeyAttribute(listItem, item);
        const checkbox = document.createElement('input');
        const linebreak = document.createElement('br');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.setAttribute('value', '');
        checkbox.addEventListener('click', () => handleCheckboxClick(listId));
        listItem.appendChild(checkbox);
        appendKeyTextChild(listItem, item);
        listItem.appendChild(linebreak);
        document.getElementById(listId).appendChild(listItem);
    });
}

// Updates the list view
function updateListView(listId) {
    const list = document.getElementById(listId);
    const emptyMessage = document.getElementById('empty-message');
    const bottomBar = document.querySelector('.bottom-bar');
    const scrollTop = list.scrollTop;
    const btnOpen = document.getElementById('open');
    const btnRemove = document.getElementById('remove');
    const textHint = document.getElementById('hint-open');
    
        // Migrate keys
    getKeysBeginWithPatternFromStorage(KeyManager.APP_NAME, keys => {
        const migratedKeys = migrateKeys(keys);

        // If any keys were migrated, update them in storage
        if (migratedKeys.some((key, index) => key !== keys[index])) {
            updateKeysInStorage(keys, migratedKeys, () => populateList(migratedKeys));
        } else {
            populateList(migratedKeys);
        }
    });

    function populateList(keys) {
        list.innerHTML = '';
        if (keys.length === 0) {
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
    const nameField = document.getElementById('input-name');
    nameField.focus();
}

// Resets the name input field and focuses on it
function resetNameFieldAndFocusOnIt() {
    const nameField = document.getElementById('input-name');
    nameField.value = '';
    nameField.focus();
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

function getCheckedKeysAndHandleThem(listId, callback) {
    const list = document.getElementById(listId);
    const checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
    const keys = Array.from(checkboxes).map(checkbox => KeyManager.getFullKey(checkbox));
    callback(keys);
}

function attachDebugInfo(keys) {
    const debugDivision = document.getElementById('debug');
    const list = document.createElement('ol');
    const debugSeparator = document.createElement('p');
    debugSeparator.appendChild(document.createTextNode('==================== DEBUG ===================='));
    debugDivision.innerHTML = '';
    debugDivision.appendChild(debugSeparator);
    debugDivision.appendChild(list);
    
    keys.forEach(key => {
        retrieveURLs(key, (key, urls) => {
            urls.forEach(url => {
                const item = document.createElement('li');
                const text = document.createTextNode(url);
                item.appendChild(text);
                list.appendChild(item);
            });
        });
    });
}

function migrateKeys(keys) {
    return keys.map(key => KeyManager.migrateKey(key));
}

function closeNewTabs(callback) {
    chrome.tabs.query({currentWindow: true}, tabs => {
        const newTabIds = tabs
            .filter(tab => tab.url === 'chrome://newtab/')
            .map(tab => tab.id);

        if (newTabIds.length > 0) {
            chrome.tabs.remove(newTabIds, callback);
        } else if (callback) {
            callback();
        }
    });
}

// ==================== Event Handling Methods ====================

// Handles click events for checkboxes
function handleCheckboxClick(listId) {
    const list = document.getElementById(listId);
    const counter = list.querySelectorAll('input[type="checkbox"]:checked').length;
    const btnOpen = document.getElementById('open');
    const btnRemove = document.getElementById('remove');
    btnOpen.disabled = counter === 0;
    btnRemove.disabled = counter === 0;
}

// Notifies the user when an item is added
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

    updateListView('list', () => {
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

// Sets up event listeners on DOMContentLoaded
function setupEventListeners() {
    const btnSave = document.getElementById('save');
    const btnOpen = document.getElementById('open');
    const btnRemove = document.getElementById('remove');
    const txtName = document.getElementById('input-name');
    const listId = 'list';

    btnOpen.disabled = true;
    btnRemove.disabled = true;

    txtName.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            btnSave.click();
        }
    });

    btnSave.addEventListener('click', async () => {
        const urls = await getURLs();
        const newKey = KeyManager.generateKeyName(urls.length);
        saveURLs(newKey, urls, () => {
            notifyItemAdded(newKey);
            resetNameFieldAndFocusOnIt();
        });
    });

    btnOpen.addEventListener('click', () => {
        getCheckedKeysAndHandleThem(listId, keys => {
            openURLsFromMultipleKeysAndThenRemoveThem(keys);
        });
    });

    btnRemove.addEventListener('click', () => {
        getCheckedKeysAndHandleThem(listId, keys => {
            removeURLs(keys, () => {
                updateListView(listId);
                focusOnNameField();
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateListView('list');
    focusOnNameField();
    setupEventListeners();
});
