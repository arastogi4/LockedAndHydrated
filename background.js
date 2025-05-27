let blockInfo = null;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ blockInfo: null });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SET_BLOCK') {
    blockInfo = {
      blockedSites: msg.blockedSites,
      unlockTime: Date.now() + msg.duration * 60 * 1000
    };
    chrome.storage.local.set({ blockInfo });
    sendResponse({ success: true });
  } else if (msg.type === 'UNBLOCK') {
    blockInfo = null;
    chrome.storage.local.set({ blockInfo: null });
    sendResponse({ success: true });
  } else if (msg.type === 'GET_BLOCK') {
    chrome.storage.local.get('blockInfo', (data) => {
      sendResponse({ blockInfo: data.blockInfo });
    });
    return true;
  }
});

chrome.storage.local.get('blockInfo', (data) => {
  const blockInfo = data.blockInfo;
  if (blockInfo && Array.isArray(blockInfo.blockedSites)) {
    const now = Date.now();
    if (blockInfo.unlockTime && now > blockInfo.unlockTime) {
      // Block expired, clear it
      chrome.storage.local.set({ blockInfo: null });
      return;
    }
    const current = window.location.hostname;
    const blocked = blockInfo.blockedSites.some(site => current.includes(site));
    if (blocked) {
      window.location.href = chrome.runtime.getURL('block.html');
    }
  }
}); 