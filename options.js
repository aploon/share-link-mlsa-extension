const input = document.getElementById("contributorId");
const status = document.getElementById("status");

chrome.storage.sync.get(["contributorId"], (data) => {
  if (data.contributorId) input.value = data.contributorId;
});

document.getElementById("saveBtn").addEventListener("click", () => {
  const id = input.value.trim();
  chrome.storage.sync.set({ contributorId: id }, () => {
    status.textContent = "Saved ✓";
    setTimeout(() => (status.textContent = ""), 1500);
  });
});
