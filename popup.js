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
            content: 'You are SmartPage, a Chrome extension that acts as a user agent to analyze and interact with web pages. Given the full content of a web page and a user’s request, respond with clean and well-structured HTML code only. You must analyze the full content of the page in detail, but respond strictly and exclusively to what the user asks in the prompt that follows. Use proper semantic tags like <h1>, <p>, <ul>, <table>, <strong>, <em>, etc. Focus on extracting any relevant tabular data, numerical summaries, key figures, and structured content from the page. Reconstruct tables clearly using the <table> tag where applicable, with accurate headers and rows. If the page contains charts or infographics, describe the key values or trends numerically. Do not include explanations, introductions, or comments. Do not use markdown. Return only raw HTML, ready to be inserted directly into a web page. The answer must be complete, detailed, and must not end with \'...\'. Ignore elements like Login, Register, Newsletter popups, etc. If useful data appears embedded in visual elements, try to extract the key numeric trends and restate them textually or in a table.'},
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
