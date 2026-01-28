// Default settings
const defaultSettings = {
  popupPosition: 'follow',
  showInfo: ['basic', 'dimensions', 'metadata', 'position', 'file', 'attributes']
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

// Event listeners
document.getElementById('save').addEventListener('click', saveSettings);
document.getElementById('reset').addEventListener('click', resetSettings);

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);
