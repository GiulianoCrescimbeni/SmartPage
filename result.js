const resultArea = document.getElementById('result');

chrome.storage.local.get('smartpage_result', (data) => {
  const html = data.smartpage_result || '<p>No result found.</p>';
  document.getElementById('result').innerHTML = html;
});

