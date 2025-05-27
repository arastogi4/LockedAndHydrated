chrome.storage.local.get('lockInfo', (data) => {
  const lockInfo = data.lockInfo;
  if (lockInfo && Array.isArray(lockInfo.sites)) {
    const current = window.location.hostname;
    const allowed = lockInfo.sites.some(site => current.includes(site));
    if (!allowed) {
      window.location.href = 'https://' + lockInfo.sites[0];
    }
  }
});

chrome.storage.local.get('blockInfo', (data) => {
  const blockInfo = data.blockInfo;
  const isBlockPage = window.location.pathname.endsWith('block.html');
  if (blockInfo && Array.isArray(blockInfo.blockedSites)) {
    const now = Date.now();
    if (blockInfo.unlockTime && now > blockInfo.unlockTime) {
      // Block expired, clear it
      chrome.storage.local.set({ blockInfo: null });
      if (isBlockPage) {
        window.history.back();
      }
      return;
    }
    const current = window.location.hostname;
    const blocked = blockInfo.blockedSites.some(site => current.includes(site));
    if (blocked && !isBlockPage) {
      window.location.href = chrome.runtime.getURL('block.html');
    }
  } else if (isBlockPage) {
    // Block is lifted, go back to the original site
    window.history.back();
  }
});

// Water reminder notification logic (automated, no alarms)
chrome.storage.local.get('waterReminder', (data) => {
  const reminder = data.waterReminder;
  if (reminder && Date.now() > reminder) {
    chrome.runtime.sendMessage({ type: 'SHOW_WATER_NOTIFICATION' });
    chrome.storage.local.remove('waterReminder');
  }
}); 