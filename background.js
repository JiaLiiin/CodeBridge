const PROMPTS = {
  "pm-to-dev": `You are a Senior Tech Lead. Translate this non-technical idea into an actionable engineering spec. Include:
1. User Story (As a..., I want..., so that...)
2. Acceptance Criteria (3-4 bullet points)
3. Technical Clarifications Needed (2-3 questions for the stakeholder)
Keep it concise and structured.`,

  "dev-to-pm": `You are a Technical Product Manager. Translate this technical message or code summary for a non-technical stakeholder. Include:
1. Plain-English Summary (1-2 sentences, zero jargon)
2. User / Business Impact
3. Risks or Timeline Considerations
Keep it concise and clear.`
};

// Create right-click options on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "pm-to-dev",
    title: "Translate: Manager → Developer Spec",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "dev-to-pm",
    title: "Translate: Developer → Plain English",
    contexts: ["selection"]
  });
});

// Handle right-click events
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!PROMPTS[info.menuItemId] || !info.selectionText) return;

  // Tell the webpage to show a "Translating..." card
  chrome.tabs.sendMessage(tab.id, { type: "SHOW_LOADING" });

  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) {
    chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_RESULT",
      text: "⚠️ Please click the extension icon in your toolbar and save your API key first."
    });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PROMPTS[info.menuItemId] },
          { role: "user", content: info.selectionText }
        ]
      })
    });

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content || "Error: Could not generate translation.";
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_RESULT", text: translated });
  } catch (err) {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_RESULT", text: `Network error: ${err.message}` });
  }
});