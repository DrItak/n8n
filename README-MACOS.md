# n8n Native macOS Application

A native macOS application for n8n workflow automation, optimized for Apple Silicon M3 Pro and designed with an intuitive interface for non-developer users.

![n8n macOS Screenshot](assets/n8n-macos-screenshot.png)

## ✨ Features

### 🚀 Native macOS Experience
- **SwiftUI Interface**: Modern, native macOS UI that follows Apple's Human Interface Guidelines
- **Apple Silicon Optimized**: Built specifically for M3 Pro with ARM64 binaries and Metal acceleration
- **System Integration**: Deep integration with macOS features like Spotlight, Finder, and Notifications
- **Touch Bar Support**: Quick actions on MacBook Pro with Touch Bar
- **Native Menus**: Full keyboard shortcuts and native menu system

### 🎯 User-Friendly Design
- **Intuitive for Non-Developers**: Simplified interface with guided workflow creation
- **Template Library**: Pre-built workflow templates for common automation tasks
- **Visual Workflow Builder**: Drag-and-drop interface powered by the n8n web editor
- **Smart Notifications**: Native macOS notifications for workflow events
- **Quick Actions**: Easy access to common tasks through menu bar and dock

### ⚡ Performance Optimizations
- **Metal Rendering**: GPU-accelerated rendering for smooth performance
- **WebKit Integration**: Optimized WebView with native JavaScript bridge
- **Memory Efficient**: Optimized for Apple Silicon with minimal memory footprint
- **Fast Startup**: Bundled n8n server for quick application launch
- **Background Processing**: Efficient workflow execution without blocking UI

### 🔧 System Integrations
- **Spotlight Search**: Find workflows directly from Spotlight
- **Finder Integration**: Open workflow files with n8n
- **URL Scheme**: `n8n://` URL scheme for deep linking
- **Services Menu**: Import workflows from other applications
- **AirDrop Support**: Share workflows via AirDrop
- **Keychain Integration**: Secure credential storage

## 📋 Requirements

- **macOS**: 14.0 (Sonoma) or later
- **Hardware**: Apple Silicon Mac (M1, M2, M3) recommended
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB available space
- **Network**: Internet connection for node integrations

## 🛠 Installation

### Option 1: Download Release (Recommended)
1. Download the latest `n8n-macos-arm64.dmg` from [Releases](https://github.com/n8n-io/n8n/releases)
2. Open the DMG file
3. Drag "n8n Workflow Automation" to Applications folder
4. Launch from Applications or Spotlight

### Option 2: Build from Source
```bash
# Clone the repository
git clone https://github.com/n8n-io/n8n.git
cd n8n

# Make build script executable
chmod +x build-native-n8n.sh

# Build the native macOS app
./build-native-n8n.sh
```

## 🚀 Quick Start

1. **Launch n8n**: Open from Applications or press `⌘+Space` and type "n8n"
2. **Server Startup**: The app will automatically start the n8n server
3. **Create Workflow**: Click "New Workflow" or press `⌘+N`
4. **Add Nodes**: Use the visual editor to add and connect nodes
5. **Execute**: Press `⌘+Return` to test your workflow

## 📖 User Guide

### Creating Your First Workflow

1. **Start with Templates**:
   - Go to `Workflow` → `Browse Templates`
   - Choose from pre-built automation templates
   - Customize for your needs

2. **Manual Creation**:
   - Click "New Workflow" in the sidebar
   - Add trigger nodes (HTTP, Schedule, etc.)
   - Connect action nodes (Email, Database, etc.)
   - Configure node parameters
   - Test and activate

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Workflow | `⌘+N` |
| Import Workflow | `⌘+I` |
| Export Workflow | `⌘+E` |
| Execute Workflow | `⌘+Return` |
| Save Workflow | `⌘+S` |
| Open Preferences | `⌘+,` |
| Toggle Sidebar | `⌘+⌃+S` |
| Full Screen | `⌘+⌃+F` |

### Settings & Configuration

Access settings via `n8n` → `Preferences` or `⌘+,`:

- **General**: Server port, theme, notifications
- **Workflows**: Auto-save, history settings
- **Advanced**: Logging, performance options
- **About**: Version info and links

## 🔧 Development

### Prerequisites
- Xcode 15.0+
- Node.js 22.16.0+
- pnpm 10.2.1+
- Swift 5.9+

### Project Structure
```
n8n-macos/
├── n8n-macos/               # Native macOS app source
│   ├── N8NApp.swift        # Main app entry point
│   ├── ContentView.swift   # Main UI view
│   ├── WebViewBridge.swift # JavaScript ↔ Native bridge
│   ├── WorkflowManager.swift # Workflow management
│   ├── MenuController.swift # Native menu system
│   ├── SettingsView.swift  # Settings interface
│   └── SystemIntegration.swift # macOS integrations
├── Resources/              # App bundle resources
│   ├── n8n/               # Bundled n8n server
│   ├── www/               # Frontend assets
│   └── Scripts/           # Helper scripts
└── build-native-n8n.sh   # Build script
```

### Building for Development
```bash
# Install dependencies
pnpm install

# Build n8n packages
pnpm build

# Open Xcode project
open n8n-macos/n8n-macos.xcodeproj

# Build and run in Xcode
```

### Performance Profiling
The app includes built-in performance monitoring:
- Metal GPU usage tracking
- Memory usage optimization
- WebKit performance metrics
- Native Swift performance analysis

## 🏪 App Store Distribution

### Preparing for App Store
1. **Update Entitlements**: Remove development exceptions from `n8n_macos.entitlements`
2. **Code Signing**: Configure proper certificates and provisioning profiles
3. **Sandboxing**: Ensure all features work within App Store sandbox
4. **Review Guidelines**: Follow App Store Review Guidelines

### Build for Distribution
```bash
# Build with App Store configuration
./build-native-n8n.sh --app-store

# Archive for distribution
xcodebuild archive \
  -project n8n-macos/n8n-macos.xcodeproj \
  -scheme n8n-macos \
  -archivePath n8n-macos.xcarchive

# Export for App Store
xcodebuild -exportArchive \
  -archivePath n8n-macos.xcarchive \
  -exportPath dist/ \
  -exportOptionsPlist ExportOptions.plist
```

## 🐛 Troubleshooting

### Common Issues

**App won't start**:
- Check macOS version (14.0+ required)
- Verify Apple Silicon compatibility
- Check Console app for error logs

**Server connection failed**:
- Ensure port 5678 is available
- Check firewall settings
- Restart the app

**Workflow import failed**:
- Verify JSON format is valid
- Check file permissions
- Try importing via menu: `Workflow` → `Import Workflow`

**Performance issues**:
- Close unnecessary applications
- Check Activity Monitor for resource usage
- Enable Metal acceleration in settings

### Getting Help
- 📚 [n8n Documentation](https://docs.n8n.io)
- 💬 [Community Forum](https://community.n8n.io)
- 🐛 [GitHub Issues](https://github.com/n8n-io/n8n/issues)
- 📧 Email: support@n8n.io

## 🤝 Contributing

We welcome contributions to the native macOS app! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas for Contribution
- UI/UX improvements
- Performance optimizations
- System integrations
- Accessibility features
- Localization
- Bug fixes

## 📄 License

This project is licensed under the [Sustainable Use License](LICENSE.md) and [n8n Enterprise License](LICENSE_EE.md).

- **Source Available**: Code is always visible
- **Self-Hostable**: Deploy anywhere
- **Extensible**: Add custom nodes and features

## 🙏 Acknowledgments

- **n8n Team**: For creating the amazing workflow automation platform
- **Apple**: For providing excellent development tools and frameworks
- **Community**: For feedback, testing, and contributions
- **Open Source**: Built on top of many fantastic open source projects

---

**Made with ❤️ for the macOS community**

For more information about n8n, visit [n8n.io](https://n8n.io)