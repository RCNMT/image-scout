const modeFollow = document.getElementById('modeFollow');
const modeFixed = document.getElementById('modeFixed');
const optionsBtn = document.getElementById('optionsBtn');

optionsBtn.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

// load stored mode
chrome.storage.sync.get({ popupPosition: 'follow' }, (s) => {
  if (modeFollow && modeFixed) {
    modeFollow.checked = s.popupPosition === 'follow';
    modeFixed.checked = s.popupPosition === 'fixed';
  }
});

if (modeFollow && modeFixed) {
  modeFollow.addEventListener('change', () => {
    if (modeFollow.checked) chrome.storage.sync.set({ popupPosition: 'follow' });
  });
  modeFixed.addEventListener('change', () => {
    if (modeFixed.checked) chrome.storage.sync.set({ popupPosition: 'fixed' });
  });
}
