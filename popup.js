// ---- URL transformation utilities based on Microsoft Student Ambassador rules ----

// Remove the language-locale segment (e.g. en-us/, fr-fr/) right after the domain
function removeLocale(urlStr) {
  try {
    const u = new URL(urlStr);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length && /^[a-z]{2}-[a-z]{2}$/i.test(segments[0])) {
      segments.shift();
      u.pathname = "/" + segments.join("/");
    }
    return u.toString();
  } catch (e) {
    return urlStr;
  }
}

// Append the Contributor ID, handling "?" vs "&"
function addContributorId(urlStr, contributorId) {
  if (!contributorId) return urlStr;
  const separator = urlStr.includes("?") ? "&" : "?";
  return `${urlStr}${separator}wt.mc_id=${contributorId}`;
}

function buildSharableLink(originalUrl, contributorId) {
  const withoutLocale = removeLocale(originalUrl);
  return addContributorId(withoutLocale, contributorId);
}

function isLikelyMicrosoftUrl(urlStr) {
  try {
    const host = new URL(urlStr).hostname.toLowerCase();
    return [
      "microsoft.com",
      "learn.microsoft.com",
      "docs.microsoft.com",
      "techcommunity.microsoft.com",
      "devblogs.microsoft.com",
      "azure.microsoft.com",
      "visualstudio.com",
      "github.com" // Microsoft-owned, sometimes eligible depending on the program
    ].some((d) => host === d || host.endsWith("." + d));
  } catch (e) {
    return false;
  }
}

// ---- State and DOM elements ----
const el = {
  contributorId: document.getElementById("contributorId"),
  originalUrl: document.getElementById("originalUrl"),
  resultUrl: document.getElementById("resultUrl"),
  notMsWarning: document.getElementById("notMsWarning"),
  copyBtn: document.getElementById("copyBtn"),
  saveBtn: document.getElementById("saveBtn"),
  shareX: document.getElementById("shareX"),
  shareLinkedin: document.getElementById("shareLinkedin"),
  shareCopy: document.getElementById("shareCopy"),
  history: document.getElementById("history"),
  exportBtn: document.getElementById("exportBtn"),
  toast: document.getElementById("toast"),
};

let currentTab = { url: "", title: "" };
let currentSharableLink = "";

function showToast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.add("show");
  setTimeout(() => el.toast.classList.remove("show"), 1600);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => showToast("Link copied!"));
}

function refreshResult() {
  const id = el.contributorId.value.trim();
  if (!currentTab.url) return;

  el.originalUrl.textContent = currentTab.url;
  el.notMsWarning.style.display = isLikelyMicrosoftUrl(currentTab.url) ? "none" : "block";

  currentSharableLink = buildSharableLink(currentTab.url, id || "YOUR_ID_HERE");
  el.resultUrl.textContent = currentSharableLink;
}

function loadContributorId() {
  chrome.storage.sync.get(["contributorId"], (data) => {
    if (data.contributorId) el.contributorId.value = data.contributorId;
    refreshResult();
  });
}

el.contributorId.addEventListener("input", () => {
  const id = el.contributorId.value.trim();
  chrome.storage.sync.set({ contributorId: id });
  refreshResult();
});

el.copyBtn.addEventListener("click", () => copyToClipboard(currentSharableLink));
el.shareCopy.addEventListener("click", () => copyToClipboard(currentSharableLink));

el.shareX.addEventListener("click", () => {
  const text = encodeURIComponent(`I just learned something with ${currentTab.title || "this Microsoft resource"} 👇`);
  const url = encodeURIComponent(currentSharableLink);
  chrome.tabs.create({ url: `https://twitter.com/intent/tweet?text=${text}&url=${url}` });
});

el.shareLinkedin.addEventListener("click", () => {
  const url = encodeURIComponent(currentSharableLink);
  chrome.tabs.create({ url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}` });
});

el.saveBtn.addEventListener("click", () => {
  const id = el.contributorId.value.trim();
  if (!id) {
    showToast("Add your Contributor ID first");
    return;
  }
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];
    history.unshift({
      title: currentTab.title || currentTab.url,
      originalUrl: currentTab.url,
      sharableUrl: currentSharableLink,
      date: new Date().toISOString(),
    });
    chrome.storage.local.set({ history }, () => {
      renderHistory(history);
      showToast("Added to your list!");
    });
  });
});

el.exportBtn.addEventListener("click", () => {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];
    if (!history.length) {
      showToast("No resources to export");
      return;
    }
    const rows = [["Title", "Original URL", "Shared URL", "Date"]];
    history.forEach((h) => rows.push([h.title, h.originalUrl, h.sharableUrl, h.date]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    chrome.downloads
      ? chrome.downloads.download({ url, filename: "my-msa-resources.csv" })
      : window.open(url);
  });
});

function renderHistory(history) {
  el.history.innerHTML = "";
  if (!history.length) {
    el.history.innerHTML = '<div class="empty">No saved resources yet.</div>';
    return;
  }
  history.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="link">${escapeHtml(item.sharableUrl)}</div>
      <div class="actions">
        <button class="btn-secondary copy-item">Copy</button>
        <button class="btn-secondary open-item">Open</button>
        <button class="btn-secondary delete-item" style="color:var(--danger)">Delete</button>
      </div>
    `;
    div.querySelector(".copy-item").addEventListener("click", () => copyToClipboard(item.sharableUrl));
    div.querySelector(".open-item").addEventListener("click", () => chrome.tabs.create({ url: item.sharableUrl }));
    div.querySelector(".delete-item").addEventListener("click", () => {
      const newHistory = history.filter((_, i) => i !== index);
      chrome.storage.local.set({ history: newHistory }, () => renderHistory(newHistory));
    });
    el.history.appendChild(div);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

function loadHistory() {
  chrome.storage.local.get(["history"], (data) => renderHistory(data.history || []));
}

// ---- Initialization ----
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  currentTab = { url: tab.url || "", title: tab.title || "" };
  loadContributorId();
});

loadHistory();
