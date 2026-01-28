let currentDirectory = null;
let services = [];

const elements = {
  selectDirBtn: document.getElementById('selectDirBtn'),
  currentPath: document.getElementById('currentPath'),
  controls: document.getElementById('controls'),
  serviceSelector: document.getElementById('serviceSelector'),
  serviceSelect: document.getElementById('serviceSelect'),
  upBtn: document.getElementById('upBtn'),
  downBtn: document.getElementById('downBtn'),
  restartBtn: document.getElementById('restartBtn'),
  pullBtn: document.getElementById('pullBtn'),
  statusBtn: document.getElementById('statusBtn'),
  logsBtn: document.getElementById('logsBtn'),
  clearBtn: document.getElementById('clearBtn'),
  output: document.getElementById('output'),
  fixDirectoryCheck: document.getElementById('fixDirectoryCheck'),
  stopOnCloseCheck: document.getElementById('stopOnCloseCheck')
};

// Load saved config on startup
async function loadSavedConfig() {
  const config = await window.electronAPI.getConfig();
  
  // Update checkboxes
  if (config.dockerDirectory) {
    elements.fixDirectoryCheck.checked = true;
  }
  elements.stopOnCloseCheck.checked = true;
  
  // Auto-load directory if saved
  if (config.dockerDirectory) {
    currentDirectory = config.dockerDirectory;
    elements.currentPath.textContent = currentDirectory;
    elements.controls.style.display = 'grid';
    appendOutput(`Auto-loaded directory: ${currentDirectory}`, 'success');
    await loadServices();
    checkStatus();
  }
}

// Save settings when checkboxes change
elements.fixDirectoryCheck.addEventListener('change', async () => {
  const config = {
    dockerDirectory: elements.fixDirectoryCheck.checked ? currentDirectory : null,
    stopOnClose: elements.stopOnCloseCheck.checked
  };
  await window.electronAPI.saveConfig(config);
  
  if (elements.fixDirectoryCheck.checked) {
    appendOutput('✓ Directory will be remembered', 'success');
  } else {
    appendOutput('✓ Directory will not be remembered', 'info');
  }
});

elements.stopOnCloseCheck.addEventListener('change', async () => {
  const config = {
    dockerDirectory: elements.fixDirectoryCheck.checked ? currentDirectory : null,
    stopOnClose: elements.stopOnCloseCheck.checked
  };
  await window.electronAPI.saveConfig(config);
  
  if (elements.stopOnCloseCheck.checked) {
    appendOutput('✓ Containers will stop when app closes', 'success');
  } else {
    appendOutput('✓ Containers will keep running when app closes', 'info');
  }
});

function appendOutput(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  const className = type === 'error' ? 'error-msg' : type === 'success' ? 'success-msg' : '';
  
  const line = `[${timestamp}] ${prefix} ${message}\n`;
  const span = document.createElement('span');
  span.className = className;
  span.textContent = line;
  
  elements.output.appendChild(span);
  elements.output.scrollTop = elements.output.scrollHeight;
}

function clearOutput() {
  elements.output.innerHTML = '';
}

function setButtonsDisabled(disabled) {
  elements.upBtn.disabled = disabled;
  elements.downBtn.disabled = disabled;
  elements.restartBtn.disabled = disabled;
  elements.pullBtn.disabled = disabled;
  elements.statusBtn.disabled = disabled;
  elements.logsBtn.disabled = disabled;
}

async function loadServices() {
  if (!currentDirectory) return;
  
  const result = await window.electronAPI.getServices(currentDirectory);
  if (result.success && result.services) {
    services = result.services;
    elements.serviceSelect.innerHTML = '<option value="">All Services</option>';
    services.forEach(service => {
      const option = document.createElement('option');
      option.value = service;
      option.textContent = service;
      elements.serviceSelect.appendChild(option);
    });
    elements.serviceSelector.style.display = 'block';
  }
}

elements.selectDirBtn.addEventListener('click', async () => {
  const result = await window.electronAPI.selectDirectory();
  
  if (result.success) {
    currentDirectory = result.path;
    elements.currentPath.textContent = currentDirectory;
    elements.controls.style.display = 'grid';
    elements.fixDirectoryCheck.checked = true;
    appendOutput(`Directory selected: ${currentDirectory}`, 'success');
    
    // Load services
    await loadServices();
    
    // Auto-check status
    checkStatus();
  } else if (result.error) {
    appendOutput(result.error, 'error');
  }
});

elements.upBtn.addEventListener('click', async () => {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  appendOutput('Starting containers...');
  
  const result = await window.electronAPI.dockerUp(currentDirectory);
  
  if (result.success) {
    appendOutput('Containers started successfully!', 'success');
    appendOutput(result.output);
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
});

elements.downBtn.addEventListener('click', async () => {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  appendOutput('Stopping containers...');
  
  const result = await window.electronAPI.dockerDown(currentDirectory);
  
  if (result.success) {
    appendOutput('Containers stopped successfully!', 'success');
    appendOutput(result.output);
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
});

elements.restartBtn.addEventListener('click', async () => {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  appendOutput('Restarting containers...');
  
  const result = await window.electronAPI.dockerRestart(currentDirectory);
  
  if (result.success) {
    appendOutput('Containers restarted successfully!', 'success');
    appendOutput(result.output);
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
});

elements.pullBtn.addEventListener('click', async () => {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  appendOutput('Pulling latest images...');
  
  const result = await window.electronAPI.dockerPull(currentDirectory);
  
  if (result.success) {
    appendOutput('Images pulled successfully!', 'success');
    appendOutput(result.output);
    appendOutput('💡 Tip: Restart containers to use the new images', 'info');
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
});

elements.statusBtn.addEventListener('click', checkStatus);

async function checkStatus() {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  appendOutput('Checking container status...');
  
  const result = await window.electronAPI.dockerStatus(currentDirectory);
  
  if (result.success) {
    appendOutput('Status retrieved:', 'success');
    appendOutput(result.output);
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
}

elements.logsBtn.addEventListener('click', async () => {
  if (!currentDirectory) return;
  
  setButtonsDisabled(true);
  const service = elements.serviceSelect.value;
  const serviceText = service ? ` for ${service}` : '';
  appendOutput(`Fetching logs${serviceText}...`);
  
  const result = await window.electronAPI.dockerLogs(currentDirectory, service);
  
  if (result.success) {
    appendOutput(`Logs${serviceText}:`, 'success');
    appendOutput(result.output);
  } else {
    appendOutput(`Error: ${result.error}`, 'error');
  }
  
  setButtonsDisabled(false);
});

elements.clearBtn.addEventListener('click', () => {
  clearOutput();
  appendOutput('Output cleared.');
});

// Initial message
appendOutput('Services initialized.');
appendOutput('Select a directory to get started.');

// Load saved configuration
loadSavedConfig();