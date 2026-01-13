document.addEventListener('DOMContentLoaded', async () => {
  const tableBody = document.getElementById('logTable');
  const clearBtn = document.getElementById('clearBtn');

  // Load and display data
  function renderData(items) {
    tableBody.innerHTML = '';
    // Convert object to array and sort by time (descending)
    const sortedData = Object.entries(items).sort(([,a], [,b]) => b - a);

    if (sortedData.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="2">No data yet.</td></tr>';
      return;
    }

    sortedData.forEach(([domain, time]) => {
      const row = document.createElement('tr');
      const domainCell = document.createElement('td');
      const timeCell = document.createElement('td');

      domainCell.textContent = domain;
      timeCell.textContent = Math.round(time); // Round to nearest second

      row.appendChild(domainCell);
      row.appendChild(timeCell);
      tableBody.appendChild(row);
    });
  }

  // Initial Fetch
  const items = await chrome.storage.local.get(null); // null gets all keys
  renderData(items);

  // Clear Data Button Logic
  clearBtn.addEventListener('click', () => {
    chrome.storage.local.clear(() => {
      renderData({});
    });
  });
});