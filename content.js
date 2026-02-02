// Create popup styles
const style = document.createElement('style');
const foreground = "#fff"
style.textContent = `
  .image-inspector-popup {
    position: fixed;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 8px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    z-index: 999999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    line-height: 1.25;
    width: 140px;
  }
  
  .image-inspector-popup.follow-mode {
    pointer-events: none;
  }
  
  .image-inspector-popup.fixed-mode {
    min-height: 200px;
    min-width: 200px;
    overflow-y: auto;
    resize: both;
    border: 1px solid #555;
    pointer-events: auto;
  }
  
  .popup-title {
    color: ${foreground};
    font-weight: 600;
    font-size: 12px;
    margin-bottom: 4px;
    display: block;
  }
  
  .image-inspector-popup.fixed-mode .popup-title {
    display: block;
  }
  
  .image-inspector-popup.follow-mode .popup-close {
    display: none;
  }
  
  .popup-close {
    position: absolute;
    top: 4px;
    right: 4px;
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  
  .popup-close:hover {
    color: #fff;
  }
  
  .popup-info-item {
    font-size: 11px;
    font-weight: 200;
    color: #ddd;
    margin-bottom: 3px;
    word-break: break-all;
  }
  
  .popup-info-item strong {
    color: #fff;
  }
`;

document.head.appendChild(style);

document.head.appendChild(style);

// Default settings
const defaultSettings = {
    popupPosition: 'follow',
    showInfo: ['title', 'url', 'alt', 'imageTitle', 'type', 'originalSize', 'renderSize', 'aspectRatio']
};

// Store current settings
let settings = defaultSettings;
let popup = null;
let isDragging = false;
let isResizing = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
// Track whether Ctrl is currently held
let ctrlPressed = false;

// Keep track of Ctrl key so popup only appears when held
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && !ctrlPressed) ctrlPressed = true;
}, true);

document.addEventListener('keyup', (e) => {
    if (!e.ctrlKey && ctrlPressed) {
        ctrlPressed = false;
        // hide popup when Ctrl released
        if (settings.popupPosition === 'follow')
            hidePopup();
    }
}, true);

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(defaultSettings, (storedSettings) => {
        let mode = settings.popupPosition;
        settings = storedSettings;
        if (mode !== settings.popupPosition) {
            switchMode();
        }
    });
}

loadSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync') {
        loadSettings();
    }
});

function createPopup() {
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'image-inspector-popup';
        if (settings.popupPosition === 'follow') {
            popup.classList.add('follow-mode');
        } else {
            popup.classList.add('fixed-mode');
        }
        document.body.appendChild(popup);

        // Add drag and resize functionality
        popup.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }
    return popup;
}

function switchMode() {
    if (popup) {
        hidePopup();
        if (settings.popupPosition === 'follow') {
            popup.classList.remove('fixed-mode');
            popup.classList.add('follow-mode');
        } else {
            popup.classList.remove('follow-mode');
            popup.classList.add('fixed-mode');
        }
    }
}

function handleMouseDown(e) {
    if (settings.popupPosition === 'fixed' && e.target.classList.contains('popup-close')) {
        return;
    }

    if (settings.popupPosition === 'fixed') {
        const rect = popup.getBoundingClientRect();
        const isNearEdge = e.clientX > rect.right - 10 || e.clientY > rect.bottom - 10;

        if (isNearEdge) {
            isResizing = true;
        } else {
            isDragging = true;
            dragOffsetX = e.clientX - popup.offsetLeft;
            dragOffsetY = e.clientY - popup.offsetTop;
        }
    }
}

function handleMouseMove(e) {
    if (isDragging && settings.popupPosition === 'fixed') {
        const rect = popup.getBoundingClientRect();
        const desiredLeft = e.clientX - dragOffsetX;
        const desiredTop = e.clientY - dragOffsetY;
        const clamped = clampToViewport(desiredLeft, desiredTop, rect.width, rect.height);
        popup.style.left = clamped.left + 'px';
        popup.style.top = clamped.top + 'px';
    }

    if (isResizing && settings.popupPosition === 'fixed') {
        const rect = popup.getBoundingClientRect();
        let newWidth = e.clientX - rect.left;
        let newHeight = e.clientY - rect.top;

        // enforce min and max (stay inside viewport)
        const maxWidth = Math.max(window.innerWidth - rect.left - 8, 250);
        const maxHeight = Math.max(window.innerHeight - rect.top - 8, 150);
        newWidth = Math.min(Math.max(newWidth, 250), maxWidth);
        newHeight = Math.min(Math.max(newHeight, 150), maxHeight);

        popup.style.width = newWidth + 'px';
        popup.style.height = newHeight + 'px';
    }
}

function handleMouseUp() {
    isDragging = false;
    isResizing = false;
}

// Clamp coordinates so popup remains inside the viewport
function clampToViewport(left, top, width, height, margin = 8) {
    const maxLeft = Math.max(window.innerWidth - width - margin, margin);
    const maxTop = Math.max(window.innerHeight - height - margin, margin);
    left = Math.min(Math.max(left, margin), maxLeft);
    top = Math.min(Math.max(top, margin), maxTop);
    return { left, top };
}

function closePopup() {
    hidePopup();
}

async function showPopup(img, x, y) {
    const popup = createPopup();

    // Build popup content based on settings
    let content = '';

    // Show title if enabled
    if (settings.showInfo.includes('title')) {
        content += `<div class="popup-title">Image Scout</div>`;
    }

    // Show URL
    if (settings.showInfo.includes('url')) {
        const urlDisplay = img.src.length > 40 ? img.src.substring(0, 40) + '...' : img.src;
        content += `<div class="popup-info-item"><strong>URL:</strong> ${urlDisplay}</div>`;
    }

    // Show Alt
    if (settings.showInfo.includes('alt')) {
        const altText = img.alt || '(none)';
        content += `<div class="popup-info-item"><strong>Alt:</strong> ${altText}</div>`;
    }

    // Show Image Title
    if (settings.showInfo.includes('imageTitle')) {
        const titleText = img.title || '(none)';
        content += `<div class="popup-info-item"><strong>Title:</strong> ${titleText}</div>`;
    }

    // Show Type
    if (settings.showInfo.includes('type')) {
        const type = img.src.split('.').pop().split('?')[0].toUpperCase();
        content += `<div class="popup-info-item"><strong>Type:</strong> ${type}</div>`;
    }

    // Show Original Size
    if (settings.showInfo.includes('originalSize')) {
        content += `<div class="popup-info-item"><strong>Original:</strong> ${img.naturalWidth}×${img.naturalHeight}</div>`;
    }

    // Show Render Size
    if (settings.showInfo.includes('renderSize')) {
        content += `<div class="popup-info-item"><strong>Render:</strong> ${img.width}×${img.height}</div>`;
    }

    // Show Aspect Ratio
    if (settings.showInfo.includes('aspectRatio')) {
        const aspectRatio = (img.naturalWidth / img.naturalHeight).toFixed(2);
        content += `<div class="popup-info-item"><strong>Aspect Ratio:</strong> ${aspectRatio}</div>`;
    }

    // Add close button for fixed mode
    if (settings.popupPosition === 'fixed') {
        content += `<button class="popup-close" id="popup-close-btn">✕</button>`;
    }

    popup.innerHTML = content;

    // show first so we can measure size for clamping
    popup.style.display = 'block';

    const rect = popup.getBoundingClientRect();
    const popupW = rect.width || popup.offsetWidth || 200;
    const popupH = rect.height || popup.offsetHeight || 100;

    if (settings.popupPosition === 'follow') {
        // Prefer placing popup to the right and below the cursor.
        // If that overflows, flip vertically (above) or horizontally (to the left).
        const margin = 8;
        let desiredLeft = x + 10;
        let desiredTop = y + 10;

        // Horizontal flip if would overflow right
        if (desiredLeft + popupW + margin > window.innerWidth) {
            desiredLeft = x - popupW - 10;
        }

        // Vertical flip if would overflow bottom
        if (desiredTop + popupH + margin > window.innerHeight) {
            desiredTop = y - popupH - 10;
        }

        const clamped = clampToViewport(desiredLeft, desiredTop, popupW, popupH, margin);
        popup.style.left = clamped.left + 'px';
        popup.style.top = clamped.top + 'px';
        popup.style.width = 'auto';
        popup.style.height = 'auto';
    } else {
        if (!popup.style.left) {
            const desiredLeft = x + 10;
            const desiredTop = y + 10;
            const clamped = clampToViewport(desiredLeft, desiredTop, popupW, popupH);
            popup.style.left = clamped.left + 'px';
            popup.style.top = clamped.top + 'px';
        } else {
            // ensure existing fixed position still inside viewport
            const left = parseFloat(popup.style.left) || 0;
            const top = parseFloat(popup.style.top) || 0;
            const clamped = clampToViewport(left, top, popupW, popupH);
            popup.style.left = clamped.left + 'px';
            popup.style.top = clamped.top + 'px';
        }
    }

    // Add close button listener after content is inserted
    const closeBtn = popup.querySelector('#popup-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hidePopup);
    }
}

function hidePopup() {
    if (popup) {
        popup.style.display = 'none';
    }
}

document.addEventListener('click', (event) => {
    const img = event.target.closest('img');
    if (img && popup && popup.style.display === 'block') {
        if (settings.popupPosition === 'follow') {
            hidePopup();
        }
    }
}, true);

document.addEventListener('mouseover', (event) => {
    // only when Ctrl held
    if (!ctrlPressed && !event.ctrlKey) return;

    // Check if the target itself is an img or if it's inside an img tag
    let img = null;
    if (event.target && event.target.tagName === 'IMG') {
        img = event.target;
    } else if (event.target && event.target.closest) {
        img = event.target.closest('img');
    }

    if (popup && popup.style.display !== 'none' && img && !img.classList.contains('image-inspector-popup')) {
        showPopup(img, event.clientX, event.clientY);
    }
}, true);

document.addEventListener('mousemove', (event) => {
    // only when Ctrl held
    if (!ctrlPressed && !event.ctrlKey) return;

    let img = null;
    if (event.target && event.target.tagName === 'IMG') {
        img = event.target;
    } else if (event.target && event.target.closest) {
        img = event.target.closest('img');
    }

    if (img && !img.classList.contains('image-inspector-popup')) {
        showPopup(img, event.clientX, event.clientY);
    }

    if (img && popup && popup.style.display !== 'none' && settings.popupPosition === 'follow') {
        const rect = popup.getBoundingClientRect();
        const popupW = rect.width || popup.offsetWidth || 200;
        const popupH = rect.height || popup.offsetHeight || 100;
        const margin = 8;

        let desiredLeft = event.clientX + 10;
        let desiredTop = event.clientY + 10;

        if (desiredLeft + popupW + margin > window.innerWidth) {
            desiredLeft = event.clientX - popupW - 10;
        }
        if (desiredTop + popupH + margin > window.innerHeight) {
            desiredTop = event.clientY - popupH - 10;
        }

        const clamped = clampToViewport(desiredLeft, desiredTop, popupW, popupH, margin);
        popup.style.left = clamped.left + 'px';
        popup.style.top = clamped.top + 'px';
    }
}, true);

document.addEventListener('mouseout', (event) => {
    // only when Ctrl held
    if (!ctrlPressed && !event.ctrlKey) return;

    let img = null;
    if (event.target && event.target.tagName === 'IMG') {
        img = event.target;
    } else if (event.target && event.target.closest) {
        img = event.target.closest('img');
    }

    if (img && settings.popupPosition === 'follow') {
        hidePopup();
    }
}, true);