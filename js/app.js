// Global variables
let allData = [];
let headers = [];
let currentTeam = '';
let sortColumn = -1;
let sortAscending = true;
let currentPlayer = '';
let radarChartInstance1 = null;
let radarChartInstance2 = null;

// Radar chart configuration
const radarStats = [
  { key: 'G', label: 'Games', index: 2 },
  { key: 'FGA', label: 'FGA', index: 5 },
  { key: 'FG%', label: 'FG%', index: 6 },
  { key: '3PA', label: '3PA', index: 7 },
  { key: '3P%', label: '3P%', index: 8 },
  { key: 'eFG%', label: 'eFG%', index: 13 },
  { key: 'FT', label: 'FT', index: 14 },
  { key: 'FT%', label: 'FT%', index: 16 },
  { key: 'PTS', label: 'Points', index: 25 }
];

// Helper function to normalize a value to 0-4 scale
function normalizeToLevel(value, min, max) {
  if (max === min) return 2; // Return middle level if no range
  return Math.round((value - min) / (max - min) * 4);
}

// Function to get min/max for a stat across all players
function getStatRange(statIndex) {
  const values = allData.map(row => parseFloat(row[statIndex]) || 0).filter(v => !isNaN(v));
  return { min: Math.min(...values), max: Math.max(...values) };
}

// Function to create radar chart using Chart.js
function createRadarChart(playerData, chartNumber) {
  // Determine which chart instance and container to use
  const chartInstance = chartNumber === 1 ? radarChartInstance1 : radarChartInstance2;
  const containerId = chartNumber === 1 ? 'radar_chart1' : 'radar_chart2';
  const canvasId = `radar-chart-canvas${chartNumber}`;

  // Destroy previous chart instance if it exists
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Clear the chart container
  document.getElementById(containerId).innerHTML = `<canvas id="${canvasId}" width="400" height="400"></canvas>`;

  // Calculate normalized values
  const values = radarStats.map(stat => {
    const range = getStatRange(stat.index);
    const value = parseFloat(playerData[stat.index]) || 0;
    return normalizeToLevel(value, range.min, range.max);
  });

  const labels = radarStats.map(stat => stat.label);

  // Create the chart
  const ctx = document.getElementById(canvasId).getContext('2d');
  const newChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: labels,
      datasets: [{
        label: `${playerData[0]} - ${playerData[1]}`,
        data: values,
        borderColor: chartNumber === 1 ? '#d32f2f' : '#1976d2',
        backgroundColor: chartNumber === 1 ? 'rgba(211, 47, 47, 0.3)' : 'rgba(25, 118, 210, 0.3)',
        borderWidth: 2,
        pointBackgroundColor: chartNumber === 1 ? '#d32f2f' : '#1976d2',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 4,
          ticks: {
            stepSize: 1,
            display: true,
            font: {
              size: 12
            }
          },
          grid: {
            color: '#ccc'
          },
          angleLines: {
            color: '#333'
          },
          pointLabels: {
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      }
    }
  });

  // Update the appropriate chart instance
  if (chartNumber === 1) {
    radarChartInstance1 = newChartInstance;
  } else {
    radarChartInstance2 = newChartInstance;
  }
}

// Helper function to select a team
function selectTeamByName(teamName) {
  const select = document.getElementById('team-select');
  if (select) {
    const optionExists = Array.from(select.options).some(opt => opt.value === teamName);
    if (optionExists && select.value !== teamName) {
      select.value = teamName;
      currentTeam = teamName;
      sortColumn = -1; // Reset sorting
      displayTeamData(teamName);
      populatePlayerSelect(teamName);
    }
  }
}

// Load and display CSV data
async function loadCSVData() {
  try {
    const response = await fetch('data/nbl-stats.csv');
    const data = await response.text();
    
    // Simple CSV parser that handles commas in values
    function parseCSV(text) {
      const lines = text.trim().split('\n');
      return lines.map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      });
    }
    
    const rows = parseCSV(data);
    headers = rows[0];
    allData = rows.slice(1);
    
    // Get unique teams (Team is the second column, index 1)
    const teams = [...new Set(allData.map(row => row[1]))].sort();
    
    // Populate dropdown
    const select = document.getElementById('team-select');
    select.innerHTML = '<option value="">-- Select a Team --</option>';
    teams.forEach(team => {
      const option = document.createElement('option');
      option.value = team;
      option.textContent = team;
      select.appendChild(option);
    });
    
    // Add event listener for team selection
    select.addEventListener('change', function() {
      currentTeam = this.value;
      sortColumn = -1; // Reset sorting when changing teams
      displayTeamData(currentTeam);
      populatePlayerSelect(currentTeam);
    });
    
    // Display first team by default
    if (teams.length > 0) {
      currentTeam = teams[0];
      select.value = teams[0];
      displayTeamData(teams[0]);
      populatePlayerSelect(teams[0]);
    }
    
  } catch (error) {
    console.error('Error loading CSV:', error);
    document.getElementById('stats_table').innerHTML = `<p style="color: red;">Error loading player statistics: ${error.message}</p>`;
  }
}

function sortData(data, columnIndex, ascending) {
  return data.slice().sort((a, b) => {
    let valA = a[columnIndex];
    let valB = b[columnIndex];
    
    // Try to convert to numbers for numeric comparison
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return ascending ? numA - numB : numB - numA;
    } else {
      // String comparison
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    }
  });
}

function displayTeamData(teamName) {
  if (!teamName) {
    document.getElementById('stats_table').innerHTML = '<p>Please select a team to view players.</p>';
    return;
  }
  
  // Filter data for selected team (Team is column index 1)
  let teamData = allData.filter(row => row[1] === teamName);
  
  // Apply sorting if a column is selected
  if (sortColumn >= 0) {
    teamData = sortData(teamData, sortColumn, sortAscending);
  }
  
  let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px;"><thead><tr>';
  headers.forEach((header, index) => {
    const arrow = sortColumn === index ? (sortAscending ? ' ▲' : ' ▼') : '';
    tableHTML += `<th style="padding: 8px; background-color: #f2f2f2; text-align: left; font-weight: bold; cursor: pointer; user-select: none;" onclick="sortTable(${index})">${header}${arrow}</th>`;
  });
  tableHTML += '</tr></thead><tbody>';
  
  teamData.forEach(row => {
    tableHTML += '<tr>';
    row.forEach(value => {
      tableHTML += `<td style="padding: 8px; border: 1px solid #ddd;">${value}</td>`;
    });
    tableHTML += '</tr>';
  });
  
  tableHTML += '</tbody></table>';
  
  if (teamData.length === 0) {
    tableHTML = '<p>No players found for this team.</p>';
  }
  
  document.getElementById('stats_table').innerHTML = tableHTML;
}

function sortTable(columnIndex) {
  if (sortColumn === columnIndex) {
    // Toggle sort direction if clicking the same column
    sortAscending = !sortAscending;
  } else {
    // New column, default to descending
    sortColumn = columnIndex;
    sortAscending = false;
  }
  displayTeamData(currentTeam);
}

function populatePlayerSelect(teamName) {
  const playerSelect1 = document.getElementById('player-select');
  const playerSelect2 = document.getElementById('player-select2');
  if (!playerSelect1 || !playerSelect2) return;
  
  // Populate first selector
  playerSelect1.innerHTML = '<option value="">-- Select Player 1 --</option>';
  
  // Populate second selector
  playerSelect2.innerHTML = '<option value="">-- Select Player 2 --</option>';
  
  if (!teamName) return;
  
  const teamPlayers = allData.filter(row => row[1] === teamName);
  teamPlayers.forEach(player => {
    // Add to player select 1
    const option1 = document.createElement('option');
    option1.value = JSON.stringify(player);
    option1.textContent = player[0];
    playerSelect1.appendChild(option1);
    
    // Add to player select 2
    const option2 = document.createElement('option');
    option2.value = JSON.stringify(player);
    option2.textContent = player[0];
    playerSelect2.appendChild(option2);
  });
  
  // Remove existing listeners and add new ones
  const newSelect1 = playerSelect1.cloneNode(true);
  playerSelect1.parentNode.replaceChild(newSelect1, playerSelect1);
  
  const newSelect2 = playerSelect2.cloneNode(true);
  playerSelect2.parentNode.replaceChild(newSelect2, playerSelect2);
  
  // Add event listeners
  newSelect1.addEventListener('change', displayRadarChart1);
  newSelect2.addEventListener('change', displayRadarChart2);
}

function displayRadarChart1() {
  const playerSelect = document.getElementById('player-select');
  if (!playerSelect || !playerSelect.value) {
    document.getElementById('radar_chart1').innerHTML = '<p style="text-align: center; color: #666;">Select a player</p>';
    return;
  }
  
  try {
    const playerData = JSON.parse(playerSelect.value);
    createRadarChart(playerData, 1);
  } catch (error) {
    console.error('Error displaying radar chart 1:', error);
    document.getElementById('radar_chart1').innerHTML = '<p style="color: red;">Error displaying radar chart.</p>';
  }
}

function displayRadarChart2() {
  const playerSelect = document.getElementById('player-select2');
  if (!playerSelect || !playerSelect.value) {
    document.getElementById('radar_chart2').innerHTML = '<p style="text-align: center; color: #666;">Select a player</p>';
    return;
  }
  
  try {
    const playerData = JSON.parse(playerSelect.value);
    createRadarChart(playerData, 2);
  } catch (error) {
    console.error('Error displaying radar chart 2:', error);
    document.getElementById('radar_chart2').innerHTML = '<p style="color: red;">Error displaying radar chart.</p>';
  }
}

