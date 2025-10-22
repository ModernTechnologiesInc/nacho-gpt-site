// ============================================================================
// NachoGPT Content Script - Injects into AI sites v2.0
// ============================================================================

let currentColors = { color1: '#082080', color2: '#6090FF' };
let isExtensionActive = true;
let messageListener = null;
let keyboardListener = null;
let lastFoundInput = null; // Cache the last found input

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Default colors
const defaultColors = { color1: '#082080', color2: '#6090FF' };

// ============================================================================
// Storage helper to check both sync and local
// ============================================================================

async function loadColorsFromBothStorages() {
    try {
        let result = await browserAPI.storage.sync.get('barColors');
        if (result.barColors) {
            return result.barColors;
        }
        
        result = await browserAPI.storage.local.get('barColors');
        if (result.barColors) {
            return result.barColors;
        }
        
        return defaultColors;
    } catch (error) {
        console.error('🌮 Error loading colors:', error);
        return defaultColors;
    }
}

// ============================================================================
// Detect if this is an AI chat site
// ============================================================================

function detectSite() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
        return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
        return 'claude';
    } else if (hostname.includes('gemini.google.com')) {
        return 'gemini';
    } else if (hostname.includes('grok.com') || hostname.includes('x.com')) {
        return 'grok';
    } else if (hostname.includes('copilot.microsoft.com')) {
        return 'copilot';
    } else if (hostname.includes('you.com')) {
        return 'you';
    } else if (hostname.includes('poe.com')) {
        return 'poe';
    }
    
    if (isLikelyAIChatSite()) {
        return 'generic-ai';
    }
    
    return null;
}

function isLikelyAIChatSite() {
    const indicators = [
        'textarea[placeholder*="message"]',
        'textarea[placeholder*="ask"]',
        'textarea[placeholder*="chat"]',
        '[contenteditable="true"][placeholder*="message"]',
        '[contenteditable="true"][placeholder*="ask"]',
        '[role="textbox"]',
        '[aria-label*="message"]',
        '[aria-label*="chat"]',
        '[class*="chat-input"]',
        '[class*="message-input"]'
    ];
    
    for (const selector of indicators) {
        if (document.querySelector(selector)) {
            console.log('🌮 NachoGPT: Detected AI chat interface via selector:', selector);
            return true;
        }
    }
    
    return false;
}

// ============================================================================
// Find the input field for each AI site - ENHANCED VERSION
// ============================================================================

function getInputField() {
    // If we have a cached input and it's still valid, return it
    if (lastFoundInput && document.body.contains(lastFoundInput) && isVisibleInput(lastFoundInput)) {
        return lastFoundInput;
    }
    
    const site = detectSite();
    let input = null;
    
    if (site === 'chatgpt') {
        input = document.querySelector('#prompt-textarea') || 
                document.querySelector('textarea[data-id]') ||
                document.querySelector('[contenteditable="true"]');
    } else if (site === 'claude') {
        input = document.querySelector('[contenteditable="true"]') ||
                document.querySelector('div[role="textbox"]');
    } else if (site === 'gemini') {
        const selectors = [
            'rich-textarea textarea',
            'textarea[aria-label*="prompt"]',
            'textarea[placeholder*="Enter"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]',
            'textarea.ql-editor',
            'textarea',
            '[role="textbox"]'
        ];
        
        for (const selector of selectors) {
            input = document.querySelector(selector);
            if (input && isVisibleInput(input)) {
                console.log('🌮 Gemini: Found input via', selector);
                break;
            }
        }
    } else if (site === 'grok') {
        // ENHANCED GROK DETECTION - Multiple strategies
        console.log('🌮 Grok: Starting comprehensive input search...');
        
        // Strategy 1: Look for common patterns first
        const commonSelectors = [
            // Modern grok.com interface
            'textarea[placeholder*="Ask"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Type"]',
            'textarea[aria-label*="input"]',
            'textarea[aria-label*="message"]',
            'textarea[name="message"]',
            'textarea[id*="input"]',
            'textarea[id*="message"]',
            // ContentEditable variants
            'div[contenteditable="true"][aria-label*="Message"]',
            'div[contenteditable="true"][aria-label*="input"]',
            'div[contenteditable="true"][placeholder*="Ask"]',
            'div[contenteditable="true"][role="textbox"]',
            // X.com integration
            'div[contenteditable="true"][data-testid*="tweetTextarea"]',
            // Generic but common
            '[contenteditable="true"]',
            'div[role="textbox"]',
            'textarea'
        ];
        
        for (const selector of commonSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
                if (isVisibleInput(element)) {
                    console.log('🌮 Grok: Found input via selector:', selector);
                    input = element;
                    break;
                }
            }
            if (input) break;
        }
        
        // Strategy 2: If not found, look for ANY visible textarea or contenteditable
        if (!input) {
            console.log('🌮 Grok: Trying fallback - searching all textareas...');
            const allTextareas = document.querySelectorAll('textarea');
            for (const ta of allTextareas) {
                if (isVisibleInput(ta)) {
                    console.log('🌮 Grok: Found textarea via fallback search');
                    input = ta;
                    break;
                }
            }
        }
        
        // Strategy 3: Look for ANY visible contenteditable
        if (!input) {
            console.log('🌮 Grok: Trying fallback - searching all contenteditable...');
            const allEditable = document.querySelectorAll('[contenteditable="true"]');
            for (const el of allEditable) {
                if (isVisibleInput(el)) {
                    // Make sure it's not a tiny element (like an emoji picker)
                    const rect = el.getBoundingClientRect();
                    if (rect.width > 100 && rect.height > 30) {
                        console.log('🌮 Grok: Found contenteditable via fallback search');
                        input = el;
                        break;
                    }
                }
            }
        }
        
        if (!input) {
            console.warn('🌮 Grok: Could not find input field with any strategy');
        }
        
    } else if (site === 'copilot') {
        input = document.querySelector('textarea[class*="input"]') ||
                document.querySelector('textarea[id*="userInput"]') ||
                document.querySelector('textarea[placeholder]') ||
                document.querySelector('[contenteditable="true"]') ||
                document.querySelector('div[role="textbox"]');
    } else if (site === 'you') {
        input = document.querySelector('textarea[placeholder*="Ask"]') ||
                document.querySelector('textarea') ||
                document.querySelector('[contenteditable="true"]');
    } else if (site === 'poe') {
        input = document.querySelector('textarea[class*="GrowingTextArea"]') ||
                document.querySelector('textarea[placeholder*="Talk"]') ||
                document.querySelector('textarea');
    } else {
        // Generic fallback
        const genericSelectors = [
            'textarea[placeholder*="message"]',
            'textarea[placeholder*="ask"]',
            'textarea[placeholder*="chat"]',
            '[contenteditable="true"][role="textbox"]',
            '[role="textbox"]',
            'textarea',
            '[contenteditable="true"]'
        ];
        
        for (const selector of genericSelectors) {
            input = document.querySelector(selector);
            if (input && isVisibleInput(input)) {
                console.log('🌮 Generic: Found input via selector:', selector);
                break;
            }
        }
    }
    
    // Cache the found input
    if (input && isVisibleInput(input)) {
        lastFoundInput = input;
        return input;
    }
    
    return null;
}

function isVisibleInput(element) {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0'
    );
}

// ============================================================================
// Insert text into input field - ULTRA-ENHANCED for React/Modern frameworks
// ============================================================================

function insertText(text) {
    if (!text || typeof text !== 'string') {
        console.error('NachoGPT: Invalid text provided');
        return false;
    }

    const input = getInputField();
    
    if (!input) {
        console.error('NachoGPT: Could not find input field');
        return false;
    }
    
    console.log('🌮 Inserting text into:', input.tagName, input.className);
    
    try {
        const site = detectSite();
        
        // Handle contenteditable divs
        if (input.contentEditable === 'true') {
            input.focus();
            
            // Method 1: execCommand (best for React)
            if (document.queryCommandSupported('insertText')) {
                console.log('🌮 Using execCommand method');
                document.execCommand('insertText', false, text);
            } else {
                // Method 2: Range insertion
                console.log('🌮 Using range insertion method');
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                    range.collapse(false);
                } else {
                    // Fallback: direct text insertion
                    const currentText = input.innerText || input.textContent || '';
                    input.innerText = currentText + text;
                }
            }
            
            // Trigger essential events only for React/Vue/Angular
            const events = [
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true })
            ];
            
            events.forEach(event => {
                try {
                    input.dispatchEvent(event);
                } catch (e) {
                    console.warn('Event dispatch failed:', e);
                }
            });
            
            // Move cursor to end
            setTimeout(() => {
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(input);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }, 10);
            
        } else {
            // Handle regular textareas
            input.focus();
            
            const start = input.selectionStart || 0;
            const end = input.selectionEnd || 0;
            const currentValue = input.value || '';
            const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
            
            // Method 1: Native setter (bypasses React)
            console.log('🌮 Using native setter for textarea');
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                'value'
            ).set;
            nativeInputValueSetter.call(input, newValue);
            
            // Method 2: Also set directly as backup
            input.value = newValue;
            
            // Trigger essential events
            const events = [
                new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: text }),
                new Event('change', { bubbles: true, cancelable: true })
            ];
            
            events.forEach(event => {
                try {
                    input.dispatchEvent(event);
                } catch (e) {
                    console.warn('Event dispatch failed:', e);
                }
            });
            
            // Move cursor to end
            const newPosition = start + text.length;
            input.setSelectionRange(newPosition, newPosition);
        }
        
        // Final focus
        input.focus();
        
        // Force framework re-render with blur/focus trick
        setTimeout(() => {
            input.blur();
            setTimeout(() => {
                input.focus();
            }, 50);
        }, 100);
        
        console.log('🌮 Successfully inserted text on', site);
        return true;
    } catch (error) {
        console.error('NachoGPT: Error inserting text:', error);
        return false;
    }
}

// ============================================================================
// Message Listener
// ============================================================================

function setupMessageListener() {
    if (messageListener) {
        browserAPI.runtime.onMessage.removeListener(messageListener);
    }

    messageListener = (request, sender, sendResponse) => {
        if (!isExtensionActive) {
            sendResponse({ success: false, error: 'Extension inactive' });
            return true;
        }

        if (request.action === 'insertPrompt') {
            const success = insertText(request.content);
            sendResponse({ success });
        }
        
        return true;
    };

    try {
        browserAPI.runtime.onMessage.addListener(messageListener);
    } catch (error) {
        console.error('🌮 NachoGPT: Failed to setup message listener:', error);
        isExtensionActive = false;
    }
}

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

function setupKeyboardShortcuts() {
    if (keyboardListener) {
        document.removeEventListener('keydown', keyboardListener);
    }

    keyboardListener = async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'M') {
            e.preventDefault();
            try {
                await browserAPI.runtime.sendMessage({ action: 'openPopup' });
            } catch (error) {
                console.error('🌮 NachoGPT: Failed to open popup:', error);
            }
        }
    };

    document.addEventListener('keydown', keyboardListener);
}

// ============================================================================
// Cleanup function
// ============================================================================

function cleanup() {
    isExtensionActive = false;
    
    if (messageListener) {
        try {
            browserAPI.runtime.onMessage.removeListener(messageListener);
        } catch (error) {
            // Extension context may already be invalid
        }
        messageListener = null;
    }
    
    if (keyboardListener) {
        document.removeEventListener('keydown', keyboardListener);
        keyboardListener = null;
    }
    
    // Disconnect mutation observer
    if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
    }
}

window.addEventListener('beforeunload', cleanup);

// ============================================================================
// Initialize
// ============================================================================

function initializeExtension() {
    const site = detectSite();
    
    if (!site) {
        console.log('🌮 NachoGPT: Not an AI chat site, extension inactive');
        return;
    }
    
    console.log('🌮 NachoGPT loaded on', site);
    
    setupMessageListener();
    setupKeyboardShortcuts();
    
    // Test if we can find the input
    const input = getInputField();
    if (!input) {
        console.warn('🌮 NachoGPT: Could not find input field yet, will retry...');
        setTimeout(() => {
            const retryInput = getInputField();
            if (retryInput) {
                console.log('🌮 NachoGPT: Input field found on retry!');
            } else {
                console.error('🌮 NachoGPT: Still cannot find input field.');
            }
        }, 3000);
    } else {
        console.log('🌮 NachoGPT: Input field found!', input.tagName, input.className);
    }
}

// Initialize with longer delays for SPAs
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeExtension, 2000);
    });
} else {
    setTimeout(initializeExtension, 2000);
}

// More aggressive MutationObserver for Grok
let observerTimeout = null;
let mutationObserver = null;

mutationObserver = new MutationObserver(() => {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
        const site = detectSite();
        if (site === 'grok' && !lastFoundInput) {
            console.log('🌮 Grok: DOM changed, re-checking for input...');
            const newInput = getInputField();
            if (newInput) {
                console.log('🌮 Grok: Input field discovered after DOM change!');
            }
        }
    }, 1000);
});

mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
});