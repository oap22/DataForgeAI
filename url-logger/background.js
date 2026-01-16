let currentUrl = null;
let startTime = null;

// Helper to sanitize the URL (get domain only) to avoid messy logs
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return null;
  }
}

// Function to log the time spent on the PREVIOUS url
async function logTime() {
  if (currentUrl && startTime) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds
    const domain = getDomain(currentUrl);

    if (domain) {
      // Fetch existing data
      const data = await chrome.storage.local.get([domain]);
      const existingTime = data[domain] || 0;
      
      // Update storage
      await chrome.storage.local.set({ [domain]: existingTime + duration });
      console.log(`Logged ${duration}s for ${domain}`);
    }
  }
}

async function sendDataToServer() {
  if (!navigator.onLine) {
      console.log("Offline: Skipping sync until next hour.");
      return;
  }
  
  const allData = await chrome.storage.local.get(null);

  try {
    
    //change address after finished local testing
    const response = await fetch('http://127.0.0.1:8000/process_url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(allData)
        });
    //check metadata for server response (200-299 should be ok, anything else is crash)
    if (!response.ok){
      //clear storage because we don't want to send duplicate data
      await chrome.storage.local.clear();
      throw new Error(`Server error: ${response.status}`)
    }
    //body of response is still arriving, so do await
    const result = await response.json();
    console.log("Success:", result);
  } catch (error) {
        console.error("Error sending data:", error);
    }
}

// Update tracker when the active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await logTime(); // Log the previous tab
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  currentUrl = tab.url;
  startTime = Date.now();
});

// Update tracker when the URL in the current tab changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (tab.active && changeInfo.url) {
    await logTime(); // Log the previous URL
    currentUrl = changeInfo.url;
    startTime = Date.now();
  }
});

// Handle window focus changes (stop tracking if user leaves Chrome)
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // User clicked away from Chrome
    await logTime();
    currentUrl = null;
    startTime = null;
  } else {
    // User came back
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      currentUrl = tabs[0].url;
      startTime = Date.now();
    }
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('hourlyDataSync', {
    periodInMinutes: 60 
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'hourlyDataSync') {
    sendDataToServer();
  }
});

