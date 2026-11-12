let overlay = null;

function createOverlay(content) {
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "380px",
    maxHeight: "420px",
    overflowY: "auto",
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    zIndex: "999999",
    whiteSpace: "pre-wrap"
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontWeight: "bold",
    borderBottom: "1px solid #313244",
    paddingBottom: "6px"
  });
  header.innerHTML = `<span>Dev ↔ PM Translator</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  Object.assign(closeBtn.style, {
    background: "none",
    border: "none",
    color: "#cdd6f4",
    cursor: "pointer",
    fontSize: "14px"
  });
  closeBtn.onclick = () => overlay.remove();
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.textContent = content;

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy to Clipboard";
  Object.assign(copyBtn.style, {
    marginTop: "12px",
    padding: "6px 12px",
    backgroundColor: "#89b4fa",
    color: "#11111b",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer"
  });
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(content);
    copyBtn.textContent = "Copied!";
  };

  overlay.appendChild(header);
  overlay.appendChild(body);
  overlay.appendChild(copyBtn);
  document.body.appendChild(overlay);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_LOADING") createOverlay("Translating...");
  if (msg.type === "SHOW_RESULT") createOverlay(msg.text);
});