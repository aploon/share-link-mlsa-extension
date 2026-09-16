// ---- Utilitaires de transformation d'URL selon les règles Microsoft Student Ambassador ----

// Retire le segment de langue-locale (ex: en-us/, fr-fr/) juste après le domaine
function removeLocale(urlStr) {
  try {
    const u = new URL(urlStr);
    const segments = u.pathname.split("/").filter(Boolean);
    if (segments.length && /^[a-z]{2}-[a-z]{2}$/i.test(segments[0])) {
      segments.shift();
      u.pathname = "/" + segments.join("/") + (u.pathname.endsWith("/") && segments.length ? "/" : "");
    }
    return u.toString();
  } catch (e) {
    return urlStr;
  }
}

// Ajoute le Contributor ID à la fin, en gérant "?" vs "&"
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
      "github.com" // Microsoft-owned, parfois éligible selon programme
    ].some((d) => host === d || host.endsWith("." + d));
  } catch (e) {
    return false;
  }
}

// ---- État et éléments DOM ----
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
  navigator.clipboard.writeText(text).then(() => showToast("Lien copié !"));
}

function refreshResult() {
  const id = el.contributorId.value.trim();
  if (!currentTab.url) return;

  el.originalUrl.textContent = currentTab.url;
  el.notMsWarning.style.display = isLikelyMicrosoftUrl(currentTab.url) ? "none" : "block";

  currentSharableLink = buildSharableLink(currentTab.url, id || "TON_ID_ICI");
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
  const text = encodeURIComponent(`Je viens d'apprendre quelque chose avec ${currentTab.title || "cette ressource Microsoft"} 👇`);
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
    showToast("Ajoute d'abord ton Contributor ID");
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
      showToast("Ajouté à ta liste !");
    });
  });
});

el.exportBtn.addEventListener("click", () => {
  chrome.storage.local.get(["history"], (data) => {
    const history = data.history || [];
    if (!history.length) {
      showToast("Aucune ressource à exporter");
      return;
    }
    const rows = [["Titre", "URL originale", "URL partagée", "Date"]];
    history.forEach((h) => rows.push([h.title, h.originalUrl, h.sharableUrl, h.date]));
    const csv = rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    chrome.downloads
      ? chrome.downloads.download({ url, filename: "mes-ressources-msa.csv" })
      : window.open(url);
  });
});

function renderHistory(history) {
  el.history.innerHTML = "";
  if (!history.length) {
    el.history.innerHTML = '<div class="empty">Aucune ressource sauvegardée pour le moment.</div>';
    return;
  }
  history.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="link">${escapeHtml(item.sharableUrl)}</div>
      <div class="actions">
        <button class="btn-secondary copy-item">Copier</button>
        <button class="btn-secondary open-item">Ouvrir</button>
        <button class="btn-secondary delete-item" style="color:var(--danger)">Supprimer</button>
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

// ---- Initialisation ----
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  currentTab = { url: tab.url || "", title: tab.title || "" };
  loadContributorId();
});

loadHistory();
