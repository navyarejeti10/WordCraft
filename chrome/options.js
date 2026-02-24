const browserAPI = (typeof browser !== 'undefined' ? browser : chrome);

// Saves options to browserAPI.storage
async function saveOptions() {
  try {
    const options = {
      apiKey: document.getElementById('apiKey').value,
      llmModel: document.getElementById('llmModel').value,
    };

    await new Promise((resolve, reject) => {
      browserAPI.storage.sync.set(options, () => {
        if (browserAPI.runtime.lastError) {
          reject(browserAPI.runtime.lastError);
        } else {
          resolve();
        }
      });
    });

    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    status.style.color = '#4CAF50';
    setTimeout(() => {
      status.textContent = '';
    }, 750);
  } catch (error) {
    console.error('Error saving options:', error);
    const status = document.getElementById('status');
    status.textContent = 'Error saving options.';
    status.style.color = '#f44336';
  }
}

async function restoreOptions() {
  try {
    const defaults = {
      apiKey: '',
      llmModel: 'llama3-8b-8192',
    };

    const items = await new Promise(resolve => {
      browserAPI.storage.sync.get(defaults, resolve);
    });

    const elementIds = ['apiKey', 'llmModel'];

    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.value = items[id] || defaults[id];
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    });

    // UI is fixed to Groq by design; no provider-specific UI update needed
  } catch (error) {
    console.error('Error restoring options:', error);
    showErrorMessage('Error restoring options. Please try reloading the page.');
  }
}

async function fetchAvailableModels() {
  const apiKey = document.getElementById('apiKey').value;
  const fetchButton = document.getElementById('fetchModels');
  const fetchText = document.getElementById('fetchModelsText');
  const fetchSpinner = document.getElementById('fetchModelsSpinner');
  const availableModelsSelect = document.getElementById('availableModels');

  // Show loading state
  fetchButton.disabled = true;
  if (fetchText) fetchText.classList.add('hidden');
  if (fetchSpinner) fetchSpinner.classList.remove('hidden');

  try {
    let endpoint = 'https://api.groq.com/openai/v1/models';
    let headers = {};
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await fetch(endpoint, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    let models = [];

    // Groq-compatible format (OpenAI-style)
    models = data.data ? data.data.map(m => ({ id: m.id, name: m.id })) : [];

    // Populate dropdown
    availableModelsSelect.innerHTML = '<option value="">Select a model...</option>';
    models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      option.textContent = model.name;
      availableModelsSelect.appendChild(option);
    });

    availableModelsSelect.classList.remove('hidden');
    showSuccessMessage(`Found ${models.length} models`);

  } catch (error) {
    console.error('Error fetching models:', error);
    showErrorMessage(`Failed to fetch models: ${error.message}`);
  } finally {
    // Reset loading state
    fetchButton.disabled = false;
    if (fetchText) fetchText.classList.remove('hidden');
    if (fetchSpinner) fetchSpinner.classList.add('hidden');
  }
}

function showErrorMessage(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = '#f44336';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
  }
}

function showSuccessMessage(message) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    status.style.color = '#4CAF50';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired');
  restoreOptions();

  const saveButton = document.getElementById('save');
  const fetchModelsButton = document.getElementById('fetchModels');
  const availableModelsSelect = document.getElementById('availableModels');

  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }

  if (fetchModelsButton) {
    fetchModelsButton.addEventListener('click', fetchAvailableModels);
  }

  if (availableModelsSelect) {
    availableModelsSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        document.getElementById('llmModel').value = e.target.value;
      }
    });
  }
});
