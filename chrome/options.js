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

function snakeCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
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

    // Clear existing prompts before restoring
    const promptsContainer = document.getElementById('prompts-container');
    while (promptsContainer.firstChild) {
      promptsContainer.removeChild(promptsContainer.firstChild);
    }

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

function addPromptToUI(title = '', prompt = '', id = '') {
  try {
    const promptsContainer = document.getElementById('prompts-container');
    const template = document.getElementById('prompt-template');
    
    if (!promptsContainer || !template) {
      throw new Error('Required elements not found');
    }

    const promptElement = template.content.cloneNode(true);

    const titleInput = promptElement.querySelector('.prompt-title');
    const textInput = promptElement.querySelector('.prompt-text');
    
    if (titleInput && textInput) {
      titleInput.value = title;
      textInput.value = prompt;
    }

    // Add a hidden input for the ID
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.className = 'prompt-id';
    idInput.value = id || snakeCase(title);
    
    const container = promptElement.querySelector('.prompt-container');
    if (container) {
      container.appendChild(idInput);
      
      const deleteButton = container.querySelector('.delete-prompt');
      if (deleteButton) {
        deleteButton.addEventListener('click', function() {
          container.remove();
          saveOptions(); // Auto-save when removing a prompt
        });
      }
    }

    promptsContainer.appendChild(promptElement);
  } catch (error) {
    console.error('Error adding prompt to UI:', error);
    showErrorMessage('Error adding new prompt.');
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
  const addPromptButton = document.getElementById('add-prompt');
  const fetchModelsButton = document.getElementById('fetchModels');
  const availableModelsSelect = document.getElementById('availableModels');

  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
  }

  if (addPromptButton) {
    addPromptButton.addEventListener('click', () => addPromptToUI());
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
