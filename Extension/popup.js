// ============================================================================
// NachoGPT Popup Logic v0.3.1 - Fixed & Optimized
// ============================================================================

let currentEdit = null;
let currentMasterEdit = null;
let currentChipEdit = null;
let currentChipPromptEdit = null;
let currentStorageMode = 'sync'; // 'sync' or 'local'
let colorChangeTimeout = null;

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Initialize default data
const defaultMasterPrompts = {
    '1': { title: 'Code Review', content: 'Please review the following code for best practices, potential bugs, and improvements:\n\n', emoji: '🔍' },
    '2': { title: 'Explain Like I\'m 5', content: 'Explain the following concept in simple terms:\n\n', emoji: '👶' },
    '3': { title: 'Debug Helper', content: 'Help me debug this code. Here\'s the error:\n\n', emoji: '🐛' },
    '4': { title: 'Documentation', content: 'Write comprehensive documentation for:\n\n', emoji: '📝' },
    '5': { title: 'Refactor Code', content: 'Refactor this code to be more efficient and maintainable:\n\n', emoji: '♻️' },
    '6': { title: 'Test Generator', content: 'Generate unit tests for:\n\n', emoji: '✅' },
    '7': { title: 'API Designer', content: 'Design a RESTful API for:\n\n', emoji: '🔌' },
    '8': { title: 'Security Audit', content: 'Perform a security audit on:\n\n', emoji: '🔒' },
    '9': { title: 'Performance', content: 'Analyze and suggest performance optimizations for:\n\n', emoji: '⚡' },
    '10': { title: 'Architecture', content: 'Review this architecture and provide feedback:\n\n', emoji: '🏗️' }
};

const defaultColors = { color1: '#082080', color2: '#6090FF' };

// ============================================================================
// Utility Functions
// ============================================================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// Import Validation
// ============================================================================

function validateChip(chip) {
    // Validate chip name
    if (typeof chip.name !== 'string' || chip.name.length === 0 || chip.name.length > 100) {
        throw new Error('Invalid chip name: must be 1-100 characters');
    }
    
    // Validate prompts array
    if (!Array.isArray(chip.prompts)) {
        throw new Error('Invalid chip: prompts must be an array');
    }
    
    if (chip.prompts.length > 500) {
        throw new Error('Too many prompts: maximum 500 per chip');
    }
    
    // Sanitize optional fields
    chip.emoji = typeof chip.emoji === 'string' && chip.emoji.length <= 2 ? chip.emoji : '🌮';
    chip.description = typeof chip.description === 'string' && chip.description.length <= 200 
        ? chip.description.substring(0, 200) 
        : '';
    
    // Validate and sanitize each prompt
    chip.prompts = chip.prompts.map((p, index) => {
        if (!p || typeof p !== 'object') {
            throw new Error(`Invalid prompt at index ${index}`);
        }
        
        if (typeof p.title !== 'string' || !p.title || p.title.length > 200) {
            throw new Error(`Invalid prompt title at index ${index}: must be 1-200 characters`);
        }
        
        if (typeof p.content !== 'string' || !p.content || p.content.length > 10000) {
            throw new Error(`Invalid prompt content at index ${index}: must be 1-10000 characters`);
        }
        
        // Return sanitized prompt with new ID to prevent collisions
        return {
            id: Date.now() + Math.random() + index,
            title: p.title.substring(0, 200),
            content: p.content.substring(0, 10000)
        };
    });
    
    return chip;
}

// ============================================================================
// Storage Abstraction Layer
// ============================================================================

function getStorage() {
    return currentStorageMode === 'sync' ? browserAPI.storage.sync : browserAPI.storage.local;
}

async function loadStorageMode() {
    try {
        const result = await browserAPI.storage.local.get('storageMode');
        currentStorageMode = result.storageMode || 'sync';
        return currentStorageMode;
    } catch (error) {
        console.error('Error loading storage mode:', error);
        return 'sync';
    }
}

async function saveStorageMode(mode) {
    try {
        currentStorageMode = mode;
        await browserAPI.storage.local.set({ storageMode: mode });
        updateStorageIndicator();
    } catch (error) {
        console.error('Error saving storage mode:', error);
        throw error;
    }
}

function updateStorageIndicator() {
    const indicator = document.getElementById('storageIndicator');
    if (indicator) {
        if (currentStorageMode === 'sync') {
            indicator.textContent = '☁️ Sync Storage (100KB limit)';
            indicator.style.color = '#fff';
        } else {
            indicator.textContent = '💾 Local Storage (Unlimited)';
            indicator.style.color = '#90EE90';
        }
    }
}

// ============================================================================
// Storage Functions with Error Handling
// ============================================================================

async function loadMasterPrompts() {
    try {
        const storage = getStorage();
        const result = await storage.get('masterPrompts');
        return result.masterPrompts || defaultMasterPrompts;
    } catch (error) {
        console.error('Error loading master prompts:', error);
        return defaultMasterPrompts;
    }
}

async function saveMasterPrompts(prompts) {
    try {
        const storage = getStorage();
        await storage.set({ masterPrompts: prompts });
    } catch (error) {
        console.error('Error saving master prompts:', error);
        if (error.message && error.message.includes('QUOTA')) {
            alert('Storage quota exceeded! Switch to Local Storage in Settings.');
        }
        throw error;
    }
}

async function loadPrompts() {
    try {
        const storage = getStorage();
        
        const indexResult = await storage.get(['prompts', 'chipIndex']);
        const prompts = indexResult.prompts || [];
        const chipIndex = indexResult.chipIndex || [];
        
        const chipKeys = chipIndex.map(id => `chip_${id}`);
        const chipsResult = chipKeys.length > 0 ? await storage.get(chipKeys) : {};
        
        const chips = chipIndex.map(id => chipsResult[`chip_${id}`]).filter(Boolean);
        
        return { prompts, chips };
    } catch (error) {
        console.error('Error loading prompts:', error);
        return { prompts: [], chips: [] };
    }
}

async function savePrompts(prompts) {
    try {
        const storage = getStorage();
        await storage.set({ prompts: prompts });
    } catch (error) {
        console.error('Error saving prompts:', error);
        // Check for quota error more reliably
        const errorMsg = error?.message?.toUpperCase() || '';
        if (errorMsg.includes('QUOTA') || errorMsg.includes('STORAGE')) {
            alert('Storage quota exceeded! Switch to Local Storage in Settings.');
        }
        throw error;
    }
}

async function saveChips(chips) {
    try {
        const storage = getStorage();
        
        const chipIndex = chips.map(chip => chip.id);
        await storage.set({ chipIndex });
        
        const chipData = {};
        chips.forEach(chip => {
            chipData[`chip_${chip.id}`] = chip;
        });
        
        await storage.set(chipData);
    } catch (error) {
        console.error('Error saving chips:', error);
        // Check for quota error more reliably
        const errorMsg = error?.message?.toUpperCase() || '';
        if (errorMsg.includes('QUOTA') || errorMsg.includes('STORAGE')) {
            alert('Storage quota exceeded! Switch to Local Storage in Settings.');
        }
        throw error;
    }
}

async function loadColors() {
    try {
        const storage = getStorage();
        const result = await storage.get('barColors');
        return result.barColors || defaultColors;
    } catch (error) {
        console.error('Error loading colors:', error);
        return defaultColors;
    }
}

async function saveColors(colors) {
    try {
        const storage = getStorage();
        await storage.set({ barColors: colors });
    } catch (error) {
        console.error('Error saving colors:', error);
        throw error;
    }
}

function applyColors(colors) {
    document.body.style.setProperty('--color1', colors.color1);
    document.body.style.setProperty('--color2', colors.color2);
    document.body.style.background = `linear-gradient(135deg, ${colors.color1} 0%, ${colors.color2} 100%)`;
}

// ============================================================================
// Storage Migration with Better Error Handling
// ============================================================================

async function migrateData(fromMode, toMode) {
    try {
        const fromStorage = fromMode === 'sync' ? browserAPI.storage.sync : browserAPI.storage.local;
        const toStorage = toMode === 'sync' ? browserAPI.storage.sync : browserAPI.storage.local;
        
        const allData = await fromStorage.get(null);
        
        if (Object.keys(allData).length === 0) {
            return;
        }
        
        // For sync storage, check size before migrating
        if (toMode === 'sync') {
            const dataSize = JSON.stringify(allData).length;
            if (dataSize > 100000) { // 100KB limit
                throw new Error('Data too large for sync storage (exceeds 100KB limit)');
            }
        }
        
        await toStorage.set(allData);
        console.log(`Migrated data from ${fromMode} to ${toMode}`);
    } catch (error) {
        console.error('Migration error:', error);
        throw error;
    }
}

// ============================================================================
// Render Functions with Proper Escaping
// ============================================================================

async function renderMasterPrompts() {
    const container = document.getElementById('masterPrompts');
    const prompts = await loadMasterPrompts();
    
    container.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const prompt = prompts[i.toString()];
        const btn = document.createElement('button');
        btn.className = 'master-btn';
        btn.type = 'button';
        
        const displayText = prompt?.emoji || (i === 10 ? '0' : i.toString());
        btn.textContent = displayText;
        btn.title = prompt?.title || `Quick Pick Prompt ${i}`;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (prompt && prompt.content) {
                insertPrompt(prompt);
            } else {
                alert('This Quick Pick prompt is empty. Click the ⚙️ button to edit it.');
            }
        });
        
        container.appendChild(btn);
    }
}

async function renderPrompts() {
    const container = document.getElementById('promptList');
    const data = await loadPrompts();
    const prompts = data.prompts;
    const chips = data.chips;
    
    container.innerHTML = '';
    
    // Render chips first
    chips.forEach((chip, chipIndex) => {
        const chipGroup = document.createElement('div');
        chipGroup.className = 'chip-group';
        
        const chipHeader = document.createElement('div');
        chipHeader.className = 'chip-header';
        
        const chipTitle = document.createElement('div');
        chipTitle.className = 'chip-title';
        
        const emojiSpan = document.createElement('span');
        emojiSpan.style.fontSize = '20px';
        emojiSpan.textContent = chip.emoji || '🌮';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = chip.name;
        
        const countSpan = document.createElement('span');
        countSpan.className = 'chip-count';
        countSpan.textContent = `(${chip.prompts.length})`;
        
        chipTitle.appendChild(emojiSpan);
        chipTitle.appendChild(nameSpan);
        chipTitle.appendChild(countSpan);
        
        const chipActions = document.createElement('div');
        chipActions.className = 'chip-actions';
        
        const addToChipBtn = createButton('btn-icon', '+', 'Add prompt to chip', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addPromptToChip(chipIndex);
        });
        
        const exportChipBtn = createButton('btn-icon', '📤', 'Export this chip', (e) => {
            e.preventDefault();
            e.stopPropagation();
            exportChip(chip);
        });
        
        const deleteChipBtn = createButton('btn-icon', '×', 'Delete chip', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteChip(chipIndex);
        });
        
        chipActions.appendChild(addToChipBtn);
        chipActions.appendChild(exportChipBtn);
        chipActions.appendChild(deleteChipBtn);
        
        chipHeader.appendChild(chipTitle);
        chipHeader.appendChild(chipActions);
        
        const chipPrompts = document.createElement('div');
        chipPrompts.className = 'chip-prompts';
        chipPrompts.id = `chip-prompts-${chipIndex}`;
        
        chip.prompts.forEach((prompt, promptIndex) => {
            const item = createPromptItem(prompt, () => insertPrompt(prompt), [
                { text: '✏️', handler: () => editChipPrompt(chipIndex, promptIndex) },
                { text: '×', handler: () => deleteChipPrompt(chipIndex, promptIndex) }
            ]);
            item.classList.add('chip-prompt-item');
            item.classList.remove('prompt-item');
            chipPrompts.appendChild(item);
        });
        
        chipTitle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            chipPrompts.classList.toggle('collapsed');
        });
        
        chipGroup.appendChild(chipHeader);
        chipGroup.appendChild(chipPrompts);
        container.appendChild(chipGroup);
    });
    
    // Render standalone prompts
    if (prompts.length > 0) {
        const standaloneHeader = document.createElement('div');
        standaloneHeader.style.cssText = 'font-weight: bold; margin: 15px 0 10px 0; opacity: 0.8; font-size: 14px;';
        standaloneHeader.textContent = '📋 Standalone Prompts';
        container.appendChild(standaloneHeader);
        
        prompts.forEach((prompt, index) => {
            const item = createPromptItem(prompt, () => insertPrompt(prompt), [
                { text: '🌮', title: 'Move to chip', handler: () => movePromptToChip(index) },
                { text: '✏️', handler: () => editPrompt(index) },
                { text: '×', handler: () => deletePrompt(index) }
            ]);
            container.appendChild(item);
        });
    }
    
    if (chips.length === 0 && prompts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="emoji">🌮</div>
            <div>No chips or prompts yet!</div>
            <div style="font-size: 12px; margin-top: 5px;">Create a Chip to organize prompts by project</div>
        `;
        container.appendChild(emptyState);
    }
}

// Helper function to create buttons
function createButton(className, text, title, clickHandler) {
    const btn = document.createElement('button');
    btn.className = className;
    btn.type = 'button';
    btn.textContent = text;
    if (title) btn.title = title;
    btn.addEventListener('click', clickHandler);
    return btn;
}

// Helper function to create prompt items
function createPromptItem(prompt, clickHandler, actions) {
    const item = document.createElement('div');
    item.className = 'prompt-item';
    
    const title = document.createElement('div');
    title.className = 'prompt-title';
    title.textContent = prompt.title;
    title.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        clickHandler();
    });
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'prompt-actions';
    
    actions.forEach(action => {
        const btn = createButton('btn-icon', action.text, action.title || '', (e) => {
            e.preventDefault();
            e.stopPropagation();
            action.handler();
        });
        actionsDiv.appendChild(btn);
    });
    
    item.appendChild(title);
    item.appendChild(actionsDiv);
    return item;
}

// ============================================================================
// Action Functions
// ============================================================================

function editMasterPrompt(num) {
    currentMasterEdit = num;
    currentEdit = null;
    currentChipEdit = null;
    
    loadMasterPrompts().then(prompts => {
        const prompt = prompts[num] || { title: '', content: '', emoji: '' };
        
        document.getElementById('modalTitle').textContent = `Edit Quick Pick Prompt ${num}`;
        document.getElementById('promptTitle').value = prompt.title;
        document.getElementById('promptContent').value = prompt.content;
        document.getElementById('promptEmoji').value = prompt.emoji || (num === '10' ? '0' : num);
        document.getElementById('promptEmoji').style.display = 'block';
        document.getElementById('editModal').classList.add('active');
    });
}

function editPrompt(index) {
    currentEdit = index;
    currentMasterEdit = null;
    currentChipEdit = null;
    
    loadPrompts().then(data => {
        const prompt = data.prompts[index];
        
        document.getElementById('modalTitle').textContent = 'Edit Prompt';
        document.getElementById('promptTitle').value = prompt.title;
        document.getElementById('promptContent').value = prompt.content;
        document.getElementById('promptEmoji').style.display = 'none';
        document.getElementById('editModal').classList.add('active');
    });
}

function addNewPrompt() {
    currentEdit = -1;
    currentMasterEdit = null;
    currentChipEdit = null;
    
    document.getElementById('modalTitle').textContent = 'Add New Prompt';
    document.getElementById('promptTitle').value = '';
    document.getElementById('promptContent').value = '';
    document.getElementById('promptEmoji').style.display = 'none';
    document.getElementById('editModal').classList.add('active');
}

async function savePrompt() {
    const title = document.getElementById('promptTitle').value.trim();
    const content = document.getElementById('promptContent').value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }
    
    try {
        if (currentMasterEdit !== null) {
            const emoji = document.getElementById('promptEmoji').value.trim();
            const prompts = await loadMasterPrompts();
            prompts[currentMasterEdit] = { title, content, emoji };
            await saveMasterPrompts(prompts);
            await renderMasterPrompts();
            
            browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    browserAPI.tabs.sendMessage(tabs[0].id, { 
                        action: 'updateMasterPrompts',
                        prompts: prompts
                    }).catch(() => {});
                }
            });
        } else if (currentChipEdit !== null) {
            const data = await loadPrompts();
            const chips = data.chips;
            
            if (currentChipPromptEdit === -1) {
                chips[currentChipEdit].prompts.push({ 
                    title, 
                    content, 
                    id: Date.now() 
                });
            } else {
                chips[currentChipEdit].prompts[currentChipPromptEdit] = {
                    ...chips[currentChipEdit].prompts[currentChipPromptEdit],
                    title,
                    content
                };
            }
            
            await saveChips(chips);
            await renderPrompts();
        } else {
            const data = await loadPrompts();
            const prompts = data.prompts;
            
            if (currentEdit === -1) {
                prompts.push({ title, content, id: Date.now() });
            } else {
                prompts[currentEdit] = { ...prompts[currentEdit], title, content };
            }
            
            await savePrompts(prompts);
            await renderPrompts();
        }
        
        closeModal();
    } catch (error) {
        console.error('Error saving prompt:', error);
        alert('Failed to save prompt. Please try again.');
    }
}

async function deletePrompt(index) {
    if (!confirm('Delete this prompt?')) return;
    
    try {
        const data = await loadPrompts();
        const prompts = data.prompts;
        prompts.splice(index, 1);
        await savePrompts(prompts);
        await renderPrompts();
    } catch (error) {
        console.error('Error deleting prompt:', error);
        alert('Failed to delete prompt.');
    }
}

async function insertPrompt(prompt) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            browserAPI.tabs.sendMessage(tabs[0].id, { 
                action: 'insertPrompt',
                content: prompt.content
            }).then((response) => {
                if (response && response.success) {
                    window.close();
                } else {
                    // Show visual feedback
                    showNotSupported();
                }
            }).catch((err) => {
                console.error('Error inserting prompt:', err);
                // Show visual feedback that site isn't supported
                showNotSupported();
            });
        }
    });
}

function showNotSupported() {
    // Add red border to body
    document.body.style.border = '4px solid #ff4444';
    document.body.style.boxShadow = '0 0 20px rgba(255, 68, 68, 0.5)';
    
    // Show message at top of popup
    const existingWarning = document.getElementById('site-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    const warning = document.createElement('div');
    warning.id = 'site-warning';
    warning.style.cssText = `
        background: #ff4444;
        color: white;
        padding: 12px 20px;
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        animation: slideDown 0.3s ease;
    `;
    warning.textContent = '⚠️ Not on a supported AI chat site';
    
    const header = document.querySelector('.header');
    if (header) {
        header.parentNode.insertBefore(warning, header.nextSibling);
    }
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        warning.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            warning.remove();
            document.body.style.border = '';
            document.body.style.boxShadow = '';
        }, 300);
    }, 3000);
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEdit = null;
    currentMasterEdit = null;
    currentChipEdit = null;
    currentChipPromptEdit = null;
}

// ============================================================================
// Chip Management Functions
// ============================================================================

function createNewChip() {
    currentChipEdit = -1;
    
    document.getElementById('chipModalTitle').textContent = 'Create New Chip';
    document.getElementById('chipName').value = '';
    document.getElementById('chipEmoji').value = '🌮';
    document.getElementById('chipDescription').value = '';
    document.getElementById('chipModal').classList.add('active');
}

async function saveChip() {
    const name = document.getElementById('chipName').value.trim();
    const emoji = document.getElementById('chipEmoji').value.trim();
    const description = document.getElementById('chipDescription').value.trim();
    
    if (!name) {
        alert('Please enter a chip name');
        return;
    }
    
    try {
        const data = await loadPrompts();
        const chips = data.chips;
        
        if (currentChipEdit === -1) {
            chips.push({
                id: Date.now(),
                name,
                emoji: emoji || '🌮',
                description,
                prompts: []
            });
        } else {
            chips[currentChipEdit].name = name;
            chips[currentChipEdit].emoji = emoji || '🌮';
            chips[currentChipEdit].description = description;
        }
        
        await saveChips(chips);
        await renderPrompts();
        closeChipModal();
    } catch (error) {
        console.error('Error saving chip:', error);
        alert('Failed to save chip.');
    }
}

function closeChipModal() {
    document.getElementById('chipModal').classList.remove('active');
    currentChipEdit = null;
}

// ============================================================================
// Quick Pick Edit Modal Functions
// ============================================================================

async function openQuickPickEditModal() {
    const prompts = await loadMasterPrompts();
    const quickPickList = document.getElementById('quickPickList');
    
    quickPickList.innerHTML = '';
    
    for (let i = 1; i <= 10; i++) {
        const prompt = prompts[i.toString()];
        const displayText = prompt?.emoji || (i === 10 ? '0' : i.toString());
        const title = prompt?.title || 'Empty Prompt';
        
        const btn = document.createElement('button');
        btn.className = 'quick-pick-edit-btn';
        
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = displayText;
        
        const details = document.createElement('div');
        details.className = 'details';
        
        const numberSpan = document.createElement('span');
        numberSpan.className = 'number';
        numberSpan.textContent = `Quick Pick ${i === 10 ? '0' : i}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'title';
        titleSpan.textContent = title;
        
        details.appendChild(numberSpan);
        details.appendChild(titleSpan);
        
        btn.appendChild(emojiSpan);
        btn.appendChild(details);
        
        btn.addEventListener('click', () => {
            closeQuickPickModal();
            editMasterPrompt(i.toString());
        });
        
        quickPickList.appendChild(btn);
    }
    
    document.getElementById('quickPickModal').classList.add('active');
}

function closeQuickPickModal() {
    document.getElementById('quickPickModal').classList.remove('active');
}

async function deleteChip(chipIndex) {
    if (!confirm('Delete this chip and all its prompts?')) return;
    
    try {
        const data = await loadPrompts();
        const chips = data.chips;
        const chipToDelete = chips[chipIndex];
        
        chips.splice(chipIndex, 1);
        
        await saveChips(chips);
        
        const storage = getStorage();
        await storage.remove(`chip_${chipToDelete.id}`);
        
        await renderPrompts();
    } catch (error) {
        console.error('Error deleting chip:', error);
        alert('Failed to delete chip.');
    }
}

async function addPromptToChip(chipIndex) {
    currentChipEdit = chipIndex;
    currentChipPromptEdit = -1;
    
    document.getElementById('modalTitle').textContent = 'Add Prompt to Chip';
    document.getElementById('promptTitle').value = '';
    document.getElementById('promptContent').value = '';
    document.getElementById('promptEmoji').style.display = 'none';
    document.getElementById('editModal').classList.add('active');
}

async function editChipPrompt(chipIndex, promptIndex) {
    currentChipEdit = chipIndex;
    currentChipPromptEdit = promptIndex;
    
    const data = await loadPrompts();
    const prompt = data.chips[chipIndex].prompts[promptIndex];
    
    document.getElementById('modalTitle').textContent = 'Edit Chip Prompt';
    document.getElementById('promptTitle').value = prompt.title;
    document.getElementById('promptContent').value = prompt.content;
    document.getElementById('promptEmoji').style.display = 'none';
    document.getElementById('editModal').classList.add('active');
}

async function deleteChipPrompt(chipIndex, promptIndex) {
    if (!confirm('Delete this prompt from the chip?')) return;
    
    try {
        const data = await loadPrompts();
        const chips = data.chips;
        chips[chipIndex].prompts.splice(promptIndex, 1);
        await saveChips(chips);
        await renderPrompts();
    } catch (error) {
        console.error('Error deleting chip prompt:', error);
        alert('Failed to delete prompt.');
    }
}

async function movePromptToChip(promptIndex) {
    const data = await loadPrompts();
    const chips = data.chips;
    
    if (chips.length === 0) {
        alert('No chips available. Create a chip first!');
        return;
    }
    
    const chipNames = chips.map((chip, idx) => `${idx + 1}. ${chip.emoji || '🌮'} ${chip.name}`).join('\n');
    const selection = prompt(`Select chip number (1-${chips.length}):\n\n${chipNames}`);
    
    if (!selection) return;
    
    const chipIndex = parseInt(selection) - 1;
    
    if (isNaN(chipIndex) || chipIndex < 0 || chipIndex >= chips.length) {
        alert('Invalid selection');
        return;
    }
    
    try {
        const prompts = data.prompts;
        const promptToMove = prompts[promptIndex];
        
        chips[chipIndex].prompts.push({
            ...promptToMove,
            id: Date.now()
        });
        
        prompts.splice(promptIndex, 1);
        
        await saveChips(chips);
        await savePrompts(prompts);
        await renderPrompts();
    } catch (error) {
        console.error('Error moving prompt:', error);
        alert('Failed to move prompt.');
    }
}

// ============================================================================
// Export/Import Functions with Validation
// ============================================================================

async function exportAllChips() {
    const data = await loadPrompts();
    
    if (data.chips.length === 0) {
        alert('No chips to export. Create some chips first!');
        return;
    }
    
    const exportData = {
        version: '1.0',
        exported: new Date().toISOString(),
        chips: data.chips
    };
    
    downloadJSON(exportData, 'nachogpt-all-chips.chip');
}

function exportChip(chip) {
    const exportData = {
        version: '1.0',
        exported: new Date().toISOString(),
        chip: chip
    };
    
    // Sanitize filename: remove special chars and limit length
    const sanitizedName = chip.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 80);
    
    const filename = `${sanitizedName}.chip`;
    downloadJSON(exportData, filename);
}

function downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
}

async function importChips(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File too large (max 10MB)');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Validate version
            if (!importData.version || importData.version !== '1.0') {
                alert('Invalid or unsupported chip file version');
                return;
            }
            
            const data = await loadPrompts();
            const chips = data.chips;
            
            // Validate chip count limit
            const totalChipsAfterImport = chips.length + (importData.chips ? importData.chips.length : 1);
            if (totalChipsAfterImport > 50) {
                alert('Maximum 50 chips allowed. Please delete some chips before importing.');
                return;
            }
            
            if (importData.chip) {
                // Single chip import - validate before importing
                const validatedChip = validateChip(importData.chip);
                await importSingleChip(validatedChip, chips);
            } else if (importData.chips && Array.isArray(importData.chips)) {
                if (!confirm(`Import ${importData.chips.length} chip(s)?`)) {
                    event.target.value = '';
                    return;
                }
                // Validate all chips before importing any
                const validatedChips = importData.chips.map(chip => validateChip(chip));
                for (const validatedChip of validatedChips) {
                    await importSingleChip(validatedChip, chips);
                }
            } else {
                alert('Invalid chip file format: no valid chip data found');
                return;
            }
            
            await saveChips(chips);
            await renderPrompts();
            alert('Chips imported successfully! 🌮');
        } catch (error) {
            console.error('Import error:', error);
            alert('Error importing chips: ' + error.message);
        }
        
        event.target.value = '';
    };
    
    reader.onerror = () => {
        alert('Error reading file');
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

async function importSingleChip(importChip, chips) {
    // Note: importChip should already be validated by validateChip()
    
    const existingChip = chips.find(c => c.name === importChip.name);
    
    if (existingChip) {
        const choice = prompt(
            `A chip named "${importChip.name}" already exists.\n\n` +
            `Choose an option:\n` +
            `1. Merge prompts into existing chip\n` +
            `2. Create new chip with different name\n` +
            `3. Skip this chip\n\n` +
            `Enter 1, 2, or 3:`
        );
        
        if (choice === '1') {
            existingChip.prompts = [...existingChip.prompts, ...importChip.prompts];
        } else if (choice === '2') {
            const newName = prompt(`Enter new name for chip:`, `${importChip.name} (imported)`);
            if (newName && newName.length > 0 && newName.length <= 100) {
                chips.push({
                    ...importChip,
                    name: newName,
                    id: Date.now() + Math.random()
                });
            }
        }
    } else {
        chips.push({
            ...importChip,
            id: Date.now() + Math.random()
        });
    }
}

// ============================================================================
// Storage Mode Switching
// ============================================================================

async function applyStorageChange() {
    const syncRadio = document.getElementById('storageSyncRadio');
    const localRadio = document.getElementById('storageLocalRadio');
    
    const selectedMode = syncRadio.checked ? 'sync' : 'local';
    
    if (selectedMode === currentStorageMode) {
        alert('Already using this storage mode!');
        return;
    }
    
    const confirmMsg = selectedMode === 'local' 
        ? 'Switch to Local Storage?\n\n✅ Unlimited size\n❌ Won\'t sync across devices\n\nMigrate existing data?'
        : 'Switch to Sync Storage?\n\n✅ Syncs across devices\n❌ 100KB limit (may fail if too much data)\n\nMigrate existing data?';
    
    const migrate = confirm(confirmMsg);
    
    if (!migrate) {
        if (currentStorageMode === 'sync') {
            syncRadio.checked = true;
            localRadio.checked = false;
        } else {
            syncRadio.checked = false;
            localRadio.checked = true;
        }
        return;
    }
    
    try {
        await migrateData(currentStorageMode, selectedMode);
        await saveStorageMode(selectedMode);
        await renderMasterPrompts();
        await renderPrompts();
        alert(`Switched to ${selectedMode} storage and migrated data! 🌮`);
    } catch (error) {
        alert(`Error: ${error.message}\n\nStorage mode changed but data not migrated.`);
        await saveStorageMode(selectedMode);
        await renderMasterPrompts();
        await renderPrompts();
    }
}

// ============================================================================
// Tab Switching
// ============================================================================

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    const activeSection = document.getElementById(`${tabName}-section`);
    if (activeSection) activeSection.classList.add('active');
}

// ============================================================================
// Event Listeners with Debouncing
// ============================================================================

const debouncedColorSave = debounce(async (colors) => {
    await saveColors(colors);
}, 500);

document.addEventListener('DOMContentLoaded', async () => {
    await loadStorageMode();
    updateStorageIndicator();
    
    const syncRadio = document.getElementById('storageSyncRadio');
    const localRadio = document.getElementById('storageLocalRadio');
    if (currentStorageMode === 'sync') {
        syncRadio.checked = true;
    } else {
        localRadio.checked = true;
    }
    
    const colors = await loadColors();
    document.getElementById('color1Picker').value = colors.color1;
    document.getElementById('color2Picker').value = colors.color2;
    applyColors(colors);
    
    await renderMasterPrompts();
    await renderPrompts();
    
    // Setup event listeners
    setupEventListeners();
});

function setupEventListeners() {
    const elements = {
        quickPickSettingsBtn: () => openQuickPickEditModal(),
        quickPickCloseBtn: () => closeQuickPickModal(),
        applyStorageBtn: () => applyStorageChange(),
        addPromptBtn: () => addNewPrompt(),
        addChipBtn: () => createNewChip(),
        exportChipsBtn: () => exportAllChips(),
        importChipsBtn: () => document.getElementById('importFileInput').click(),
        saveBtn: () => savePrompt(),
        cancelBtn: () => closeModal(),
        chipSaveBtn: () => saveChip(),
        chipCancelBtn: () => closeChipModal(),
        resetColorsBtn: async () => {
            document.getElementById('color1Picker').value = defaultColors.color1;
            document.getElementById('color2Picker').value = defaultColors.color2;
            await saveColors(defaultColors);
            applyColors(defaultColors);
        }
    };
    
    for (const [id, handler] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                handler();
            });
        }
    }
    
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(tab.dataset.tab);
        });
    });
    
    // File input
    const importFileInput = document.getElementById('importFileInput');
    if (importFileInput) {
        importFileInput.addEventListener('change', importChips);
    }
    
    // Modal close on outside click
    ['editModal', 'chipModal', 'quickPickModal'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === modalId) {
                    if (modalId === 'editModal') closeModal();
                    else if (modalId === 'chipModal') closeChipModal();
                    else closeQuickPickModal();
                }
            });
        }
    });
    
    // Color pickers with debouncing
    const color1Picker = document.getElementById('color1Picker');
    const color2Picker = document.getElementById('color2Picker');
    
    if (color1Picker) {
        color1Picker.addEventListener('input', (e) => {
            const colors = { 
                color1: e.target.value, 
                color2: color2Picker.value 
            };
            applyColors(colors);
            debouncedColorSave(colors);
        });
    }
    
    if (color2Picker) {
        color2Picker.addEventListener('input', (e) => {
            const colors = { 
                color1: color1Picker.value,
                color2: e.target.value
            };
            applyColors(colors);
            debouncedColorSave(colors);
        });
    }
}