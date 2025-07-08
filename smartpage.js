const promptField = document.getElementById('prompt');
const sendButton = document.getElementById('send');
const spinner = document.getElementById('spinner');

sendButton.addEventListener('click', async () => {
  const prompt = promptField.value.trim();
  if (!prompt) return;

  sendButton.disabled = true;
  sendButton.classList.add('hidden');
  spinner.classList.remove('hidden');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const pageContentArr = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const elements = document.querySelectorAll('h1, h2, h3, p, table, form');
        let content = '';

        elements.forEach(el => {
          if (el.tagName === 'TABLE') {
            content += el.outerHTML + '\n';
          } else if (el.tagName === 'FORM') {
            content += '<form>\n';
            el.querySelectorAll('label, input, select, textarea, button').forEach(input => {
              content += input.outerHTML + '\n';
            });
            content += '</form>\n';
          } else {
            content += `<${el.tagName.toLowerCase()}>${el.innerText}</${el.tagName.toLowerCase()}>\n`;
          }
        });

        return content;
      }
    });

    const pageContent = pageContentArr[0]?.result || '';

    const systemPrompt = `You are SmartPage, a Chrome extension that acts as an intelligent agent to either analyze or interact with web pages.

    If the user's request is an analysis of the content (like summarizing, extracting data, etc.), respond with structured, clean HTML using semantic tags (like <h1>, <table>, <ul>, <p>, etc.). Avoid introductions or explanations.

    If the user's request involves interacting with the page (e.g. filling a form, clicking a button), respond only with a JSON array of actions. Each must include:

    - type: "fill_form" | "click" | "set_innerHTML"
    - selector: a valid CSS selector (use IDs/classes actually present)
    - value: for fill_form or set_innerHTML only

    Example:
    [
      { "type": "fill_form", "selector": "#email", "value": "test@example.com" },
      { "type": "click", "selector": "#submit" }
    ]

    Never guess selectors. Do not include code, comments or explanations. Never truncate the output.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Page content:\n${pageContent}\n\nUser request:\n${prompt}` }
        ]
      })
    });

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      alert("⚠️ No response from model. Check prompt length or API key/quota.");
      return;
    }

    const isJS = result.trim().startsWith('[') || result.includes('"type":') || result.includes('"selector":');

    if (isJS) {
      await chrome.storage.local.set({ smartpage_injected_code: result });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['injected.js']
      });
    } else {
      await chrome.storage.local.set({ smartpage_result: result });
      chrome.windows.create({
        url: chrome.runtime.getURL("result.html"),
        type: "popup",
        width: 800,
        height: 800
      });
    }

  } catch (err) {
    alert(`❌ Error: ${err.message}`);
  }

  sendButton.disabled = false;
  sendButton.classList.remove('hidden');
  spinner.classList.add('hidden');
});