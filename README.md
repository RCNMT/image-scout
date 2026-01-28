# Image Inspector Chrome Extension

A Chrome extension for inspecting images on web pages.

## Files Structure

```
image-inspector/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.js          # Popup logic
├── styles.css        # Styling
├── background.js     # Service worker (background script)
├── content.js        # Content script
└── images/           # Extension icons (optional)
    ├── icon-16.png
    ├── icon-48.png
    └── icon-128.png
```

## Features

- Click the extension icon to open the popup
- Click "Inspect Images" button to find all images on the current page
- View a list of image URLs found on the page
- Clear results with the "Clear" button

## Installation

1. Open `chrome://extensions/` in your Chrome browser
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Navigate to the `image-inspector` folder
5. The extension should now appear in your extensions list

## What's Included

- **manifest.json**: Manifest V3 configuration file
- **popup.html/js**: User interface and interaction logic
- **content.js**: Script that runs on web pages to extract image data
- **background.js**: Service worker for background tasks
- **styles.css**: Professional styling with gradient design

## Next Steps

To customize this template:
- Replace placeholder icons in the `images/` folder
- Modify the popup UI in `popup.html`
- Add more functionality to `content.js` or `popup.js`
- Update permissions in `manifest.json` as needed
