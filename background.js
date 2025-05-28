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
  } else if (msg.type === 'SHOW_WATER_NOTIFICATION') {
    chrome.notifications.create('water-reminder', {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Hydration Reminder',
      message: 'Time to drink some water!'
    });
  } else if (msg.type === 'SET_WATER_ALARM') {
    try {
      chrome.alarms.create('water-reminder', { delayInMinutes: 60 });
      sendResponse({ success: true });
    } catch (error) {
      console.error('Error setting water alarm:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'water-reminder') {
    chrome.notifications.create('water-reminder', {
      type: 'basic',
      iconUrl: 'icon-128.png',
      title: 'Hydration Reminder',
      message: 'Time to drink some water!'
    });
  }
}); 