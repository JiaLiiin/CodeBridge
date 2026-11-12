document.getElementById("saveBtn").addEventListener("click", async () => {
  const apiKey = document.getElementById("keyInput").value.trim();
  await chrome.storage.local.set({ apiKey });
  document.getElementById("status").textContent = "Saved!";
});