let overlay = null;

function formatMarkdown(raw) {
  // 1. Escape HTML characters for security
  let html = raw
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">");

  // 2. Convert horizontal rules (---)
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #313244;margin:10px 0;">');

  // 3. Convert headings (### Title)
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<div style="font-size:15px;font-weight:700;color:#89b4fa;margin:12px 0 4px 0;">$1</div>'
  );

  // 4. Convert bold (**text**), italic (*text*), and inline code (`code`)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f5e0dc;">$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(
    /`([^`]+)`/g,
    '<code style="background:#313244;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>'
  );

  // 5. Convert bullet points (- item)
  html = html.replace(/^- (.+)$/gm, '<div style="padding-left:12px;margin:3px 0;">• $1</div>');

  // 6. Preserve line breaks
  html = html.replace(/\n/g, "<br>");

  return html;
}

function createOverlay(content, isFormatted = false) {
  if (overlay) overlay.remove();

  overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "400px",
    maxHeight: "460px",
    overflowY: "auto",
    backgroundColor: "#1e1e2e",
    color: "#cdd6f4",
    padding: "16px",
    borderRadius: "10px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: "13.5px",
    lineHeight: "1.55",
    zIndex: "999999"
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
    fontWeight: "bold",
    borderBottom: "1px solid #313244",
    paddingBottom: "8px"
  });
  header.innerHTML = `<span>CodeBridge (Dev ↔ PM)</span>`;

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
  if (isFormatted) {
    body.innerHTML = formatMarkdown(content);
  } else {
    body.textContent = content;
  }

  const copyBtn = document.createElement("button");
  copyBtn.textContent = "Copy Markdown";
  Object.assign(copyBtn.style, {
    marginTop: "14px",
    padding: "6px 12px",
    backgroundColor: "#89b4fa",
    color: "#11111b",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer"
  });
  copyBtn.onclick = () => {
    // Copies the original clean Markdown so pasting into Jira/GitHub stays formatted
    navigator.clipboard.writeText(content);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Markdown"), 1500);
  };

  overlay.appendChild(header);
  overlay.appendChild(body);
  overlay.appendChild(copyBtn);
  document.body.appendChild(overlay);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SHOW_LOADING") createOverlay("Translating...", false);
  if (msg.type === "SHOW_RESULT") createOverlay(msg.text, true);
});