// Default settings
const defaultSettings = {
  popupPosition: 'follow',
  showInfo: ['title', 'url', 'alt', 'imageTitle', 'type', 'originalSize', 'renderSize', 'aspectRatio']
};

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get(defaultSettings, (settings) => {
    
    // Set popup position radio button
    const positionRadios = document.querySelectorAll('input[name="popupPosition"]');
    positionRadios.forEach(radio => {
      radio.checked = radio.value === settings.popupPosition;
    });

    
    // Set show info checkboxes
    const infoCheckboxes = document.querySelectorAll('input[name="showInfo"]');
    infoCheckboxes.forEach(checkbox => {
      checkbox.checked = settings.showInfo.includes(checkbox.value);
    });
    updateInformationDisplay();
  });
}

// Save settings
function saveSettings() {
  const popupPosition = document.querySelector('input[name="popupPosition"]:checked').value;
  const showInfo = Array.from(document.querySelectorAll('input[name="showInfo"]:checked')).map(cb => cb.value);

  const settings = {
    popupPosition,
    showInfo
  };

  chrome.storage.sync.set(settings, () => {
    showStatus('Settings saved successfully!', 'success');
    setTimeout(() => {
      hideStatus();
    }, 2000);
  });
}

// Reset to defaults
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    chrome.storage.sync.set(defaultSettings, () => {
      loadSettings();
      showStatus('Settings reset to defaults!', 'success');
      setTimeout(() => {
        hideStatus();
      }, 2000);
    });
  }
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

// Hide status message
function hideStatus() {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status';
}

// Update mockup preview based on selected position
function updateMockupPreview() {
  const selectedPosition = document.querySelector('input[name="popupPosition"]:checked').value;
  const mockupPreview = document.getElementById('mockupPreview');
  const mockupPopup = document.getElementById('mockupPopup');
  const cursorIndicator = document.getElementById('cursorIndicator');
  const followIndicator = document.getElementById('followIndicator');
  const mockupDescription = document.getElementById('mockupDescription');

  if (selectedPosition === 'follow') {
    mockupPreview.className = 'mockup-preview follow-mode';
    mockupPopup.style.position = 'absolute';
    mockupPopup.style.left = '60px';
    mockupPopup.style.top = '30px';
    mockupPopup.style.transform = 'none';
    followIndicator.style.display = 'none';
    cursorIndicator.style.display = 'flex';
    cursorIndicator.style.left = '30px';
    cursorIndicator.style.top = '40px';
    mockupDescription.textContent = 'Popup follows your mouse cursor as you hover over images';
  } else {
    mockupPreview.className = 'mockup-preview fixed-mode';
    mockupPopup.style.position = 'absolute';
    mockupPopup.style.left = '50%';
    mockupPopup.style.top = '50%';
    mockupPopup.style.transform = 'translate(-50%, -50%)';
    mockupPopup.style.cursor = 'move';
    followIndicator.style.display = 'block';
    cursorIndicator.style.display = 'none';
    mockupDescription.textContent = 'Popup stays fixed in one place. You can drag it to reposition';
  }
}

// Update information display in mockup
function updateInformationDisplay() {
  const showInfoCheckboxes = document.querySelectorAll('input[name="showInfo"]:checked');
  const selectedValues = Array.from(showInfoCheckboxes).map(cb => cb.value);

  const infoFieldIds = {
    'title': 'popupTitle',
    'url': 'urlInfo',
    'alt': 'altInfo',
    'imageTitle': 'imageTitleInfo',
    'type': 'typeInfo',
    'originalSize': 'originalSizeInfo',
    'renderSize': 'renderSizeInfo',
    'aspectRatio': 'aspectRatioInfo'
  };

  // Update visibility of each info field
  for (const [value, elementId] of Object.entries(infoFieldIds)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = selectedValues.includes(value) ? 'block' : 'none';
    }
  }
}

// Event listeners
document.getElementById('save').addEventListener('click', saveSettings);
document.getElementById('reset').addEventListener('click', resetSettings);

// Add event listeners for radio buttons to update preview
const positionRadios = document.querySelectorAll('input[name="popupPosition"]');
positionRadios.forEach(radio => {
  radio.addEventListener('change', updateMockupPreview);
});

// Add event listeners for info checkboxes to update preview
const infoCheckboxes = document.querySelectorAll('input[name="showInfo"]');
infoCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', updateInformationDisplay);
});

// Load settings when page loads
document.addEventListener('DOMContentLoaded', function () {
  loadSettings();
  updateMockupPreview();
});