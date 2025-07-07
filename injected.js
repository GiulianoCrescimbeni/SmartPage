chrome.storage.local.get('smartpage_injected_code', (data) => {
  try {
    const raw = data.smartpage_injected_code;

    if (!raw || typeof raw !== 'string') {
      console.warn('No script data found.');
      return;
    }

    if (!raw.trim().startsWith('[')) {
      console.warn('Response is not a JSON array:', raw);
      return;
    }

    let actions;
    try {
      actions = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse JSON:', raw);
      return;
    }

    if (!Array.isArray(actions)) {
      console.warn('Parsed data is not an array.');
      return;
    }

    actions.forEach((action) => {
      const el = document.querySelector(action.selector);
      if (!el) {
        console.warn(`Element not found for selector: ${action.selector}`);
        return;
      }

      switch (action.type) {
        case 'fill_form':
          el.value = action.value;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(`Filled ${action.selector} with ${action.value}`);
          break;
        case 'click':
          el.click();
          console.log(`Clicked ${action.selector}`);
          break;
        case 'set_innerHTML':
          el.innerHTML = action.value;
          console.log(`Set innerHTML on ${action.selector}`);
          break;
        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    });

  } catch (err) {
    console.error('Execution error:', err);
    alert('Failed to run page interaction.');
  }
});
