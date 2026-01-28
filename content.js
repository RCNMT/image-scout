// Create popup styles
const style = document.createElement('style');
const foreground = "#fff"
style.textContent = `
  .image-inspector-popup {
    position: fixed;
    background: rgba(0, 0, 0, 0.95);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    z-index: 999999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    line-height: 1.5;
  }
  
  .image-inspector-popup.follow-mode {
    max-width: 250px;
    pointer-events: none;
  }
  
  .image-inspector-popup.fixed-mode {
    min-height: 200px;
    min-width: 300px;
    overflow-y: auto;
    resize: both;
    border: 1px solid #555;
  }
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #444;
  }
  
  .popup-title {
    color: ${foreground};
    font-weight: bold;
    font-size: 16px;
  }
  
  .popup-close {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  
  .popup-close:hover {
    color: #fff;
  }
  
  .image-inspector-popup.follow-mode .popup-close {
    display: none;
  }
  
  .popup-category {
    font-size: 14px;
    margin: 10px 0;
    padding-bottom: 10px;
    border-bottom: 1px solid #444;
  }
  
  .popup-category:last-child {
    border-bottom: none;
  }
  
  .popup-category-header {
    color: ${foreground};
    font-weight: bold;
    margin-bottom: 8px;
    font-size: 13px;
  }
  
  .popup-item {
    margin: 4px 0;
    word-break: break-all;
  }
  
  .popup-label {
    color: #aaa;
    font-weight: bold;
  }
  
  .popup-value {
    color: #fff;
    margin-left: 6px;
  }
`;

document.head.appendChild(style);

// Default settings
const defaultSettings = {
    popupPosition: 'follow',
    showInfo: ['basic', 'dimensions', 'metadata', 'position', 'file', 'attributes']
};

// Store current settings
let settings = defaultSettings;
let popup = null;
let isDragging = false;
let isResizing = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(defaultSettings, (storedSettings) => {
        settings = storedSettings;
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
        popup.style.left = (e.clientX - dragOffsetX) + 'px';
        popup.style.top = (e.clientY - dragOffsetY) + 'px';
    }

    if (isResizing && settings.popupPosition === 'fixed') {
        const rect = popup.getBoundingClientRect();
        const newWidth = e.clientX - rect.left;
        const newHeight = e.clientY - rect.top;

        if (newWidth > 250) {
            popup.style.width = newWidth + 'px';
        }
        if (newHeight > 150) {
            popup.style.height = newHeight + 'px';
        }
    }
}

function handleMouseUp() {
    isDragging = false;
    isResizing = false;
}

function createCategory(title, items) {
    let html = `
    <div class="popup-category">
        <div class="popup-category-header">${title}</div>
    `;

    items.forEach(item => {
        let tagStart = '';
        let tagEnd = ''
        if (item.tag) {
            tagStart = `<${item.tag} ${item.attr}>`
            tagEnd = `</${item.tag}>`
        }
        html += `
            <div class="popup-item">
                <span class="popup-label">${item.label}:</span>
                <span class="popup-value">${tagStart}${item.value}${tagEnd}</span>
            </div>
        `;
    });

    html += `
    </div>
    `;

    return html;
}

function closePopup() {
    hidePopup();
}

async function showPopup(img, x, y) {
    const popup = createPopup();

    // Basic Info
    let basicItems = [
        { label: 'URL', value: img.src.substring(0, 70) + (img.src.length > 70 ? '...' : ''), tag: `a`, attr: `href="${img.src}" target="_blank"` },
        { label: 'Title', value: img.title || '(none)' },
        { label: 'Alt Text', value: img.alt || '(none)' },
    ];

    // Dimensions
    let dimensionItems = [
        { label: 'Original Width', value: img.naturalWidth + 'px' },
        { label: 'Original Height', value: img.naturalHeight + 'px' },
        { label: 'Render Width', value: img.width ? img.width + 'px' : 'auto' },
        { label: 'Render Height', value: img.height ? img.height + 'px' : 'auto' },
        { label: 'Offset Width', value: img.offsetWidth + 'px' },
        { label: 'Offset Height', value: img.offsetHeight + 'px' },
        { label: 'Aspect Ratio', value: (img.naturalWidth / img.naturalHeight).toFixed(2) }
    ];

    // Metadata
    let metadataItems = [
        { label: 'Complete', value: img.complete ? 'Yes' : 'No' },
        { label: 'Loading', value: img.loading || 'eager' },
        { label: 'Decoding', value: img.decoding || 'auto' },
        { label: 'CORS', value: img.crossOrigin || 'not set' }
    ];

    // Position
    let rect = img.getBoundingClientRect();
    let positionItems = [
        { label: 'Top', value: Math.round(rect.top) + 'px' },
        { label: 'Left', value: Math.round(rect.left) + 'px' },
        { label: 'Bottom', value: Math.round(rect.bottom) + 'px' },
        { label: 'Right', value: Math.round(rect.right) + 'px' }
    ];

    // Attributes
    let attributeItems = [
        { label: 'ID', value: img.id || '(none)' },
        { label: 'Class', value: img.className || '(none)' },
        { label: 'SrcSet', value: img.srcset ? img.srcset.substring(0, 50) + '...' : '(none)' }
    ];

    // Build popup content based on mode
    let content = '';

    if (settings.popupPosition === 'follow') {
        // Minimal mode: only show basic and dimensions
        content += `
            <div class="popup-header">
                <span class="popup-title">Image Info</span>
            </div>
        `;
        basicItems = [
            { label: 'URL', value: img.src.substring(0, 70) + (img.src.length > 70 ? '...' : '') },
            { label: 'Title', value: img.title || '(none)' },
            { label: 'Alt Text', value: img.alt || '(none)' },
        ];
        content += createCategory('Basic', basicItems);
        dimensionItems = [
            { label: 'Original Size', value: `${img.naturalWidth} x ${img.naturalHeight} px` },
            { label: 'Render Size', value: `${img.width} x ${img.height} px` },
            { label: 'Aspect Ratio', value: (img.naturalWidth / img.naturalHeight).toFixed(2) }
        ];
        content += createCategory('Dimensions', dimensionItems);
    } else {
        // Full mode: show all info with close button
        content += `
            <div class="popup-header">
                <span class="popup-title">Image Inspector</span>
                <button class="popup-close" id="popup-close-btn">✕</button>
            </div>
        `;

        if (settings.showInfo.includes('basic')) {
            content += createCategory('Basic Info', basicItems);
        }
        if (settings.showInfo.includes('dimensions')) {
            content += createCategory('Dimensions', dimensionItems);
        }
        if (settings.showInfo.includes('metadata')) {
            content += createCategory('Metadata', metadataItems);
        }
        if (settings.showInfo.includes('position')) {
            content += createCategory('Position', positionItems);
        }
        if (settings.showInfo.includes('attributes')) {
            content += createCategory('Attributes', attributeItems);
        }
    }

    popup.innerHTML = content;

    if (settings.popupPosition === 'follow') {
        popup.style.left = (x + 10) + 'px';
        popup.style.top = (y + 10) + 'px';
        popup.style.width = 'auto';
        popup.style.height = 'auto';
    } else {
        if (!popup.style.left) {
            popup.style.left = (x + 10) + 'px';
            popup.style.top = (y + 10) + 'px';
        }
    }

    popup.style.display = 'block';

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
    // Check if the target itself is an img or if it's inside an img tag
    let img = null;
    
    if (event.target.tagName === 'IMG') {
        img = event.target;
    } else {
        img = event.target.closest('img');
    }
    
    if (img && !img.classList.contains('image-inspector-popup')) {
        showPopup(img, event.clientX, event.clientY);
    }
}, true);

document.addEventListener('mousemove', (event) => {
    let img = null;

    if (event.target.tagName === 'IMG') {
        img = event.target;
    } else {
        img = event.target.closest('img');
    }
    
    if (img && popup && popup.style.display !== 'none' && settings.popupPosition === 'follow') {
        popup.style.left = (event.clientX + 10) + 'px';
        popup.style.top = (event.clientY + 10) + 'px';
    }
}, true);

document.addEventListener('mouseout', (event) => {
    let img = null;
    
    if (event.target.tagName === 'IMG') {
        img = event.target;
    } else {
        img = event.target.closest('img');
    }
    
    if (img && settings.popupPosition === 'follow') {
        hidePopup();
    }
}, true);