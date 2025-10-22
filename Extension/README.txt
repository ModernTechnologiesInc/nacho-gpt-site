# 🌮 NachoGPT

**Spice up your AI chats with quick prompts!**

NachoGPT is a lightweight browser extension that supercharges your AI chat experience with instant prompt injection, customizable quick-pick buttons, and shareable prompt collections called "Chips."

[![Version](https://img.shields.io/badge/version-0.3.1-blue.svg)](https://github.com/yourusername/nachogpt)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome](https://img.shields.io/badge/chrome-compatible-brightgreen.svg)](https://www.google.com/chrome/)
[![Firefox](https://img.shields.io/badge/firefox-compatible-orange.svg)](https://www.mozilla.org/firefox/)

---

## ✨ Features

### ⚡ Quick Pick Prompts
- **10 customizable hotkey buttons** - Access your most-used prompts instantly
- **One-click insertion** - Click a button and the prompt appears in your chat
- **Customizable emojis** - Personalize each button with emojis or numbers

### 🌮 Chips - Shareable Prompt Collections
- **Organize by project** - Group related prompts into Chips
- **Team collaboration** - Export and share `.chip` files with teammates
- **Import instantly** - One-click import of shared Chips
- **Unlimited storage** - Create as many Chips as you need

### 🎨 Customization
- **Color themes** - Customize the extension's gradient colors
- **Storage options** - Choose between cloud sync (100KB limit) or local storage (unlimited)
- **Flexible organization** - Standalone prompts or organized in Chips

### 🌍 Universal Compatibility
Works seamlessly on all major AI chat platforms:
- ✅ **ChatGPT** (chat.openai.com, chatgpt.com)
- ✅ **Claude** (claude.ai)
- ✅ **Google Gemini** (gemini.google.com)
- ✅ **Grok** (grok.com, x.com)
- ✅ **Microsoft Copilot** (copilot.microsoft.com)
- ✅ **You.com**
- ✅ **Poe** (poe.com)
- ✅ **And more!** Generic AI chat detection

---

## 🚀 Installation

### Chrome / Edge / Brave

#### From Source (Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `nachogpt` folder
6. The taco icon 🌮 should appear in your toolbar!

#### From Chrome Web Store
*Coming soon!*

### Firefox

#### From Source (Development)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file from the `nachogpt` folder
5. The extension is now active!

#### From Firefox Add-ons
*Coming soon!*

---

## 📖 How to Use

### Basic Usage

1. **Open any AI chat site** (ChatGPT, Claude, Gemini, etc.)
2. **Press `Ctrl+Shift+M`** (or `Cmd+Shift+M` on Mac) to open NachoGPT
3. **Click any prompt** to insert it into the chat input field
4. **Customize your prompts** in the extension popup

### Quick Pick Setup

1. Open the extension popup
2. Go to the **⚡ Quick Pick** tab
3. Click the **⚙️ Settings** button
4. Click any numbered button (1-10) to edit
5. Set the title, emoji, and prompt content
6. Click **Save**

**Default Quick Pick Prompts:**
- 🔍 Code Review
- 👶 Explain Like I'm 5
- 🐛 Debug Helper
- 📝 Documentation
- ♻️ Refactor Code
- ✅ Test Generator
- 🔌 API Designer
- 🔒 Security Audit
- ⚡ Performance
- 🏗️ Architecture

### Creating Chips

1. Open the extension popup
2. Go to the **🌮 Chips** tab
3. Click **🌮 New Chip**
4. Enter a name (e.g., "Marketing Team")
5. Choose an emoji
6. Add a description (optional)
7. Click **Create**
8. Add prompts to your Chip by clicking the **+** button

### Sharing Chips

**Export:**
1. Click the **📤** button next to a Chip
2. Download the `.chip` file
3. Share with teammates via email, Slack, etc.

**Import:**
1. Receive a `.chip` file from a teammate
2. Click **📥 Import** in the extension
3. Select the `.chip` file
4. Choose to merge or create a new Chip

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+M` (Windows/Linux) | Open NachoGPT extension |
| `Cmd+Shift+M` (Mac) | Open NachoGPT extension |

*You can customize shortcuts at `chrome://extensions/shortcuts`*

---

## 🎨 Customization

### Color Themes

1. Open the extension popup
2. Go to the **⚙️ About** tab
3. Scroll to **🎨 Customize Colors**
4. Choose **Bar Color 1** and **Bar Color 2**
5. Colors apply instantly!
6. Click **Reset to Default** to restore original theme

### Storage Options

**☁️ Sync Storage** (Default)
- **Pros:** Syncs across all your devices
- **Cons:** Limited to 100KB (≈200 prompts)
- **Best for:** Personal use, basic prompt collections

**💾 Local Storage**
- **Pros:** Unlimited storage space
- **Cons:** Only available on current device
- **Best for:** Large prompt libraries, team collections

**Switching Storage:**
1. Go to **⚙️ About** tab
2. Select your preferred storage mode
3. Click **Apply & Migrate**
4. Your data automatically migrates!

---

## 🛠️ Technical Details

### Built With
- **Manifest V3** - Modern Chrome extension API
- **Vanilla JavaScript** - No frameworks, no dependencies
- **Pure CSS** - Responsive, accessible design
- **Cross-browser** - Works on Chrome, Firefox, Edge, Brave, Opera

### Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome | 88+ | ✅ Fully supported |
| Edge | 88+ | ✅ Fully supported |
| Firefox | 109+ | ✅ Fully supported |
| Brave | 1.30+ | ✅ Fully supported |
| Opera | 74+ | ✅ Fully supported |

### Permissions

NachoGPT requests minimal permissions:
- **storage** - Save your prompts and settings locally

### Host Permissions

NachoGPT only runs on specific AI chat sites:
- chat.openai.com, chatgpt.com
- claude.ai
- gemini.google.com
- grok.com, x.com
- copilot.microsoft.com
- you.com
- poe.com

**Visual Feedback:** If you try to use the extension on an unsupported site, you'll see a red border and warning message.

---

## 🤝 Contributing

We love contributions! Here's how you can help:

### Reporting Bugs
1. Check if the issue already exists
2. Open a new issue with:
   - Browser version
   - Extension version
   - Steps to reproduce
   - Expected vs actual behavior

### Suggesting Features
1. Open an issue with the "enhancement" label
2. Describe the feature and its use case
3. Explain why it would benefit users

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly on multiple AI sites
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/nachogpt.git

# Navigate to directory
cd nachogpt

# No build step needed! Just load the extension in Chrome
```

---

## 📝 File Structure

```
nachogpt/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Content script (injected into sites)
├── content.css            # Injected styles
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

---

## 🐛 Troubleshooting

### Extension not working on a site?
1. Refresh the page after installing the extension
2. Check browser console (F12) for error messages
3. Make sure you're on a supported AI chat site
4. Try pressing `Ctrl+Shift+M` to verify the extension loads

### Prompts not inserting?
1. Make sure the chat input field is visible
2. Try clicking directly on the input field first
3. Check if the site updated (some sites change their HTML structure)
4. Report the issue with the site URL

### Keyboard shortcut not working?
1. Check `chrome://extensions/shortcuts` to verify the shortcut
2. Some shortcuts may conflict with browser defaults
3. Try customizing the shortcut to something else

### Import/Export not working?
1. Make sure file is a valid `.chip` or `.json` file
2. File size should be under 10MB
3. Check browser console for error messages

---

## 🗺️ Roadmap

### v0.4.0 (Planned)
- [ ] Prompt variables/placeholders
- [ ] Prompt templates
- [ ] Search/filter prompts
- [ ] Prompt categories/tags
- [ ] Keyboard shortcuts for Quick Pick buttons

### v0.5.0 (Planned)
- [ ] Prompt history
- [ ] Favorite prompts
- [ ] Prompt statistics
- [ ] Cloud backup option
- [ ] Team sync features

### Future Ideas
- [ ] AI-powered prompt suggestions
- [ ] Prompt marketplace
- [ ] Multi-language support
- [ ] Voice input for prompts
- [ ] Mobile app companion

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by the need for better prompt management in AI workflows
- Built for the AI community by prompt enthusiasts
- Special thanks to all contributors and testers

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/nachogpt/issues)
- **Twitter:** [@NachoGPT](https://x.com/NachoGPT)
- **Email:** support@nachogpt.com

---

## ⭐ Show Your Support

If you find NachoGPT helpful, please consider:
- ⭐ Starring the repository
- 🐦 Following us on Twitter
- 📢 Sharing with your team
- 🐛 Reporting bugs
- 💡 Suggesting features
- 🤝 Contributing code

---

<div align="center">

**Made with 🌮 and ❤️ by the NachoGPT Team**

*Share a Chip, Get a Chip!*

[Website](https://nacho-gpt.com) • [Twitter](https://x.com/NachoGPT) • [GitHub](https://github.com/yourusername/nachogpt)

</div>