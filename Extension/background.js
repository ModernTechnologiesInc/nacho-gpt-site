// ============================================================================
// NachoGPT Background Service Worker
// ============================================================================

// Default data
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
// Command Handlers
// ============================================================================

chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle-master-prompts') {
        chrome.action.openPopup().catch(err => {
            console.error('Failed to open popup:', err);
        });
    }
});

// ============================================================================
// Message Handlers
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.action.openPopup()
            .then(() => sendResponse({ success: true }))
            .catch(err => {
                console.error('Failed to open popup:', err);
                sendResponse({ success: false, error: err.message });
            });
        return true; // Keep message channel open for async response
    }
    return false;
});

// ============================================================================
// Installation & Updates
// ============================================================================

chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🌮 NachoGPT service worker installed/updated', details.reason);
    
    if (details.reason === 'install') {
        await initializeDefaultData();
    } else if (details.reason === 'update') {
        await handleUpdate(details.previousVersion);
    }
});

async function initializeDefaultData() {
    try {
        // Check if data already exists
        const existingData = await chrome.storage.sync.get(['masterPrompts', 'prompts', 'barColors']);
        
        // Only set defaults if not already present
        const dataToSet = {};
        
        if (!existingData.masterPrompts) {
            dataToSet.masterPrompts = defaultMasterPrompts;
        }
        
        if (!existingData.prompts) {
            dataToSet.prompts = [];
        }
        
        if (!existingData.barColors) {
            dataToSet.barColors = defaultColors;
        }
        
        if (Object.keys(dataToSet).length > 0) {
            await chrome.storage.sync.set(dataToSet);
            console.log('🌮 Default data initialized');
        }
        
        // Set default storage mode
        await chrome.storage.local.set({ storageMode: 'sync' });
        
    } catch (error) {
        console.error('Error initializing default data:', error);
        
        // Fallback to local storage if sync fails
        try {
            await chrome.storage.local.set({
                masterPrompts: defaultMasterPrompts,
                prompts: [],
                barColors: defaultColors,
                storageMode: 'local'
            });
            console.log('🌮 Default data initialized in local storage (fallback)');
        } catch (localError) {
            console.error('Failed to initialize data in local storage:', localError);
        }
    }
}

async function handleUpdate(previousVersion) {
    console.log('🌮 Updating from version', previousVersion);
    
    try {
        // Migration logic for future updates
        // Example: if (previousVersion < '0.3.0') { ... }
        
        // Ensure storage mode is set
        const storageCheck = await chrome.storage.local.get('storageMode');
        if (!storageCheck.storageMode) {
            await chrome.storage.local.set({ storageMode: 'sync' });
        }
        
        console.log('🌮 Update complete');
    } catch (error) {
        console.error('Error during update:', error);
    }
}

// ============================================================================
// Startup
// ============================================================================

chrome.runtime.onStartup.addListener(() => {
    console.log('🌮 NachoGPT service worker started');
});

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (event) => {
    console.error('🌮 Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('🌮 Service worker unhandled rejection:', event.reason);
});

console.log('🌮 NachoGPT background service worker ready');