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

// Try flagship Flash first, fall back to high-throughput Flash-Lite on 503/404
// Use high-throughput Flash-Lite models first to avoid 3.8-flash 503 overload
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash"];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
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
});

async function sendToTab(tabId, payload) {
  try {
    await chrome.tabs.sendMessage(tabId, payload);
  } catch (err) {
    console.error("Failed to send message to tab (try refreshing the webpage):", err);
  }
}

async function callGemini(apiKey, systemPrompt, userText) {
  let lastError = "Unknown error";

  for (const model of MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents: [
              {
                parts: [{ text: userText }]
              }
            ]
          })
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { ok: true, text };
        lastError = `Empty response from ${model}`;
        continue;
      }

      lastError = `${model} (${response.status}): ${data.error?.message || "Request failed"}`;
      console.warn("Gemini fallback triggered:", lastError);

      // Retry with next model on 503 (overloaded) or 404 (model unavailable)
      if (response.status === 503 || response.status === 404) {
        continue;
      }

      // Stop immediately on invalid API key (400/403) or quota exhaustion (429)
      return { ok: false, error: lastError };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err.name === "AbortError" ? `${model} timed out after 25s` : err.message;
    }
  }

  return { ok: false, error: lastError };
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!PROMPTS[info.menuItemId] || !info.selectionText || !tab?.id) return;

  await sendToTab(tab.id, { type: "SHOW_LOADING" });

  const { apiKey } = await chrome.storage.local.get("apiKey");
  if (!apiKey) {
    await sendToTab(tab.id, {
      type: "SHOW_RESULT",
      text: "⚠️ Please click the CodeBridge icon in your toolbar and save your Gemini API key first."
    });
    return;
  }

  const result = await callGemini(apiKey, PROMPTS[info.menuItemId], info.selectionText);

  if (result.ok) {
    await sendToTab(tab.id, { type: "SHOW_RESULT", text: result.text });
  } else {
    await sendToTab(tab.id, { type: "SHOW_RESULT", text: `Gemini API Error — ${result.error}` });
  }
});