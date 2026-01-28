document.getElementById('inspectBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'getImages' }, (response) => {
    if (response && response.images) {
      displayResults(response.images);
    }
  });
});

document.getElementById('clearBtn').addEventListener('click', () => {
  document.getElementById('results').classList.add('hidden');
  document.getElementById('imageList').innerHTML = '';
});

function displayResults(images) {
  const resultDiv = document.getElementById('results');
  const imageList = document.getElementById('imageList');
  
  imageList.innerHTML = '';
  
  if (images.length === 0) {
    imageList.innerHTML = '<li>No images found on this page.</li>';
  } else {
    images.forEach((src, index) => {
      const li = document.createElement('li');
      li.textContent = `Image ${index + 1}: ${src.substring(0, 50)}...`;
      li.title = src;
      imageList.appendChild(li);
    });
  }
  
  resultDiv.classList.remove('hidden');
}
