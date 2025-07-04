const promptField = document.getElementById('prompt');
const sendButton = document.getElementById('send');
const spinner = document.getElementById('spinner');

sendButton.addEventListener('click', async () => {
  const prompt = promptField.value.trim();
  if (!prompt) return;

  sendButton.disabled = true;
  sendButton.textContent = 'Sending...';
  spinner.classList.remove('hidden');

  try {
    // Ottieni il contenuto della pagina
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageContent = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText
    });

    const fullPrompt = `Web page content:\n${pageContent[0].result}\n\nUser prompt:\n${prompt}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are SmartPage, a Chrome extension that acts as a user agent to analyze and interact with web pages. Given the full content of a web page and a user\'s request, respond with clean and well-structured HTML code only. Use proper semantic tags like <h1>, <p>, <ul>, <table>, <strong>, <em>, etc. Include styling only if essential. Do not include any explanations, introductions, or comments. Return only raw HTML, ready to be inserted directly into a web page. The answer should be complete, detailed, and must not end with \'...\'. Avoid Login, Register etc, focus only on the content of the web page.'},
          {
            role: 'user',
            content: fullPrompt
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok || !data.choices || !data.choices[0]) {
      throw new Error(data.error?.message || 'Invalid response from OpenAI');
    }

    const reply = data.choices[0].message.content.trim();

    await chrome.storage.local.set({ smartpage_result: reply });

    chrome.windows.create({
      url: chrome.runtime.getURL("result.html"),
      type: "popup",
      width: 800,
      height: 800
    });

  } catch (err) {
    console.error('OpenAI request failed:', err);
    alert(`⚠️ Error: ${err.message}`);
  }

  spinner.classList.add('hidden');
  sendButton.disabled = false;
  sendButton.textContent = 'Send ✉️';
});
