const sitesInput = document.getElementById('sites');
const durationInput = document.getElementById('duration');
const lockBtn = document.getElementById('lockBtn');
const confirmBtn = document.getElementById('confirmBtn');
const unlockBtn = document.getElementById('unlockBtn');
const statusDiv = document.getElementById('status');
const waterBtn = document.getElementById('waterBtn');

let pendingBlock = null;

function setInputsDisabled(disabled) {
  sitesInput.disabled = disabled;
  durationInput.disabled = disabled;
  lockBtn.disabled = disabled;
}

function updateStatus() {
  chrome.runtime.sendMessage({ type: 'GET_BLOCK' }, (res) => {
    if (res.blockInfo && res.blockInfo.blockedSites) {
      const mins = Math.max(0, Math.ceil((res.blockInfo.unlockTime - Date.now()) / 60000));
      statusDiv.textContent = `Blocked sites: ${res.blockInfo.blockedSites.join(', ')} (${mins} min left)`;
      lockBtn.style.display = 'none';
      confirmBtn.style.display = 'none';
      unlockBtn.style.display = 'block';
      setInputsDisabled(true);
    } else {
      statusDiv.textContent = 'No sites blocked.';
      lockBtn.style.display = 'block';
      confirmBtn.style.display = 'none';
      unlockBtn.style.display = 'none';
      setInputsDisabled(false);
    }
  });
}

lockBtn.onclick = () => {
  const blockedSites = sitesInput.value.split(',').map(s => s.trim()).filter(Boolean);
  const duration = parseInt(durationInput.value);
  if (!blockedSites.length || !duration) {
    statusDiv.textContent = 'Please enter at least one site and a duration.';
    return;
  }
  pendingBlock = { blockedSites, duration };
  statusDiv.textContent = `Ready to block: ${blockedSites.join(', ')} for ${duration} min. Click Confirm to activate.`;
  confirmBtn.style.display = 'block';
  setInputsDisabled(true);
};

confirmBtn.onclick = () => {
  if (!pendingBlock) return;
  confirmBtn.disabled = true;
  chrome.runtime.sendMessage({ type: 'SET_BLOCK', ...pendingBlock }, (res) => {
    if (res.success) {
      updateStatus();
      pendingBlock = null;
      confirmBtn.style.display = 'none';
      confirmBtn.disabled = false;
    } else {
      statusDiv.textContent = 'Failed to block. Try again.';
      setInputsDisabled(false);
      confirmBtn.disabled = false;
    }
  });
};

unlockBtn.onclick = () => {
  chrome.runtime.sendMessage({ type: 'UNBLOCK' }, (res) => {
    if (res.success) updateStatus();
  });
};

function checkWaterReminder() {
  chrome.storage.local.get('waterReminder', (data) => {
    const reminder = data.waterReminder;
    if (reminder && Date.now() > reminder) {
      chrome.notifications.create('water-reminder', {
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: 'Hydration Reminder',
        message: 'Time to drink some water!'
      });
      chrome.storage.local.remove('waterReminder');
    }
  });
}

waterBtn.onclick = () => {
  const nextReminder = Date.now() + 60 * 60 * 1000;
  chrome.storage.local.set({ waterReminder: nextReminder }, () => {
    statusDiv.textContent = 'You will be reminded to drink water in 1 hour.';
  });
};

updateStatus();
checkWaterReminder();
setInterval(updateStatus, 10000); 