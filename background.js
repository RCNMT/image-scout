chrome.runtime.onInstalled.addListener(() => {
  console.log('Image Inspector extension installed!');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'logMessage') {
    console.log('Background: ', request.message);
  }
});
