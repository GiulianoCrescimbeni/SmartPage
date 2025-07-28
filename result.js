const resultArea = document.getElementById('result');

chrome.storage.local.get('smartpage_result', (data) => {
  const html = data.smartpage_result || '<p>No result found.</p>';
  document.getElementById('result').innerHTML = html;
});

document.getElementById('download-html-btn').addEventListener('click', () => {
  const resultElement = document.getElementById('result');
  const htmlContent = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>SmartPage Result</title>
        <style>
          body {
            background-color: #0f111a;
            color: #e6e6e6;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            padding: 20px;
          }
          h1, h2, h3 {
            color: #1f76bb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background-color: #2a2d3a;
            color: #e6e6e6;
          }
          table, th, td {
            border: 1px solid #444;
          }
          th, td {
            padding: 8px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        ${resultElement.innerHTML}
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'smartpage_result.html';
  a.click();

  URL.revokeObjectURL(url);
});