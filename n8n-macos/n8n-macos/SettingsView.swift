import SwiftUI
import OSLog

struct SettingsView: View {
    @EnvironmentObject var workflowManager: WorkflowManager
    @State private var selectedTab: SettingsTab = .general
    @State private var serverPort = "5678"
    @State private var enableNotifications = true
    @State private var enableAutoStart = false
    @State private var enableStatusBarItem = false
    @State private var theme: AppTheme = .system
    @State private var logLevel: LogLevel = .info
    @State private var maxWorkflowHistory = 50
    @State private var autoSaveInterval = 30
    @State private var enableTelemetry = false
    
    private let logger = Logger(subsystem: "io.n8n.macos", category: "SettingsView")
    
    var body: some View {
        NavigationView {
            // Sidebar
            VStack(alignment: .leading, spacing: 0) {
                List(SettingsTab.allCases, id: \.self, selection: $selectedTab) { tab in
                    SettingsTabRow(tab: tab)
                }
                .listStyle(.sidebar)
                .frame(minWidth: 200)
            }
            
            // Detail view
            Group {
                switch selectedTab {
                case .general:
                    GeneralSettingsView(
                        serverPort: $serverPort,
                        enableNotifications: $enableNotifications,
                        enableAutoStart: $enableAutoStart,
                        enableStatusBarItem: $enableStatusBarItem,
                        theme: $theme
                    )
                case .workflows:
                    WorkflowSettingsView(
                        maxWorkflowHistory: $maxWorkflowHistory,
                        autoSaveInterval: $autoSaveInterval
                    )
                case .advanced:
                    AdvancedSettingsView(
                        logLevel: $logLevel,
                        enableTelemetry: $enableTelemetry
                    )
                case .about:
                    AboutView()
                }
            }
            .frame(minWidth: 500, minHeight: 400)
        }
        .navigationTitle("Settings")
        .frame(width: 750, height: 550)
        .onAppear {
            loadSettings()
        }
        .onChange(of: selectedTab) { _ in
            saveSettings()
        }
    }
    
    private func loadSettings() {
        let defaults = UserDefaults.standard
        serverPort = defaults.string(forKey: "serverPort") ?? "5678"
        enableNotifications = defaults.bool(forKey: "enableNotifications")
        enableAutoStart = defaults.bool(forKey: "enableAutoStart")
        enableStatusBarItem = defaults.bool(forKey: "enableStatusBarItem")
        theme = AppTheme(rawValue: defaults.string(forKey: "theme") ?? "system") ?? .system
        logLevel = LogLevel(rawValue: defaults.string(forKey: "logLevel") ?? "info") ?? .info
        maxWorkflowHistory = defaults.integer(forKey: "maxWorkflowHistory")
        autoSaveInterval = defaults.integer(forKey: "autoSaveInterval")
        enableTelemetry = defaults.bool(forKey: "enableTelemetry")
        
        // Set defaults if not previously set
        if maxWorkflowHistory == 0 { maxWorkflowHistory = 50 }
        if autoSaveInterval == 0 { autoSaveInterval = 30 }
    }
    
    private func saveSettings() {
        let defaults = UserDefaults.standard
        defaults.set(serverPort, forKey: "serverPort")
        defaults.set(enableNotifications, forKey: "enableNotifications")
        defaults.set(enableAutoStart, forKey: "enableAutoStart")
        defaults.set(enableStatusBarItem, forKey: "enableStatusBarItem")
        defaults.set(theme.rawValue, forKey: "theme")
        defaults.set(logLevel.rawValue, forKey: "logLevel")
        defaults.set(maxWorkflowHistory, forKey: "maxWorkflowHistory")
        defaults.set(autoSaveInterval, forKey: "autoSaveInterval")
        defaults.set(enableTelemetry, forKey: "enableTelemetry")
        
        logger.info("Settings saved")
    }
}

// MARK: - Settings Tab

enum SettingsTab: String, CaseIterable {
    case general = "General"
    case workflows = "Workflows"
    case advanced = "Advanced"
    case about = "About"
    
    var icon: String {
        switch self {
        case .general: return "gearshape"
        case .workflows: return "flowchart"
        case .advanced: return "terminal"
        case .about: return "info.circle"
        }
    }
}

struct SettingsTabRow: View {
    let tab: SettingsTab
    
    var body: some View {
        Label(tab.rawValue, systemImage: tab.icon)
            .tag(tab)
    }
}

// MARK: - General Settings

struct GeneralSettingsView: View {
    @Binding var serverPort: String
    @Binding var enableNotifications: Bool
    @Binding var enableAutoStart: Bool
    @Binding var enableStatusBarItem: Bool
    @Binding var theme: AppTheme
    
    var body: some View {
        Form {
            Section("Server") {
                HStack {
                    Text("Port:")
                        .frame(width: 100, alignment: .leading)
                    TextField("5678", text: $serverPort)
                        .textFieldStyle(.roundedBorder)
                        .frame(width: 100)
                    
                    Text("Port number for the n8n server (requires restart)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Toggle("Start server automatically on launch", isOn: $enableAutoStart)
                    .help("Automatically start the n8n server when the app launches")
            }
            
            Section("Interface") {
                HStack {
                    Text("Theme:")
                        .frame(width: 100, alignment: .leading)
                    Picker("Theme", selection: $theme) {
                        ForEach(AppTheme.allCases, id: \.self) { theme in
                            Text(theme.displayName).tag(theme)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(width: 200)
                }
                
                Toggle("Show in menu bar", isOn: $enableStatusBarItem)
                    .help("Show a status item in the menu bar for quick access")
                
                Toggle("Enable notifications", isOn: $enableNotifications)
                    .help("Show system notifications for workflow events")
            }
            
            Section("Quick Actions") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Create shortcuts for common tasks:")
                        .font(.headline)
                    
                    HStack {
                        Button("Open n8n Documentation") {
                            if let url = URL(string: "https://docs.n8n.io") {
                                NSWorkspace.shared.open(url)
                            }
                        }
                        .buttonStyle(.bordered)
                        
                        Button("Browse Templates") {
                            if let url = URL(string: "https://n8n.io/workflows") {
                                NSWorkspace.shared.open(url)
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    HStack {
                        Button("Community Forum") {
                            if let url = URL(string: "https://community.n8n.io") {
                                NSWorkspace.shared.open(url)
                            }
                        }
                        .buttonStyle(.bordered)
                        
                        Button("Video Tutorials") {
                            if let url = URL(string: "https://www.youtube.com/@n8nio") {
                                NSWorkspace.shared.open(url)
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("General")
    }
}

// MARK: - Workflow Settings

struct WorkflowSettingsView: View {
    @Binding var maxWorkflowHistory: Int
    @Binding var autoSaveInterval: Int
    
    var body: some View {
        Form {
            Section("History") {
                HStack {
                    Text("Maximum workflow history:")
                        .frame(width: 200, alignment: .leading)
                    Stepper("\(maxWorkflowHistory) items", value: $maxWorkflowHistory, in: 10...500, step: 10)
                        .frame(width: 150)
                }
                .help("Number of workflow execution records to keep")
                
                Button("Clear All History") {
                    // TODO: Implement history clearing
                }
                .buttonStyle(.bordered)
            }
            
            Section("Auto-Save") {
                HStack {
                    Text("Auto-save interval:")
                        .frame(width: 200, alignment: .leading)
                    Stepper("\(autoSaveInterval) seconds", value: $autoSaveInterval, in: 10...300, step: 10)
                        .frame(width: 150)
                }
                .help("How often to automatically save workflow changes")
            }
            
            Section("Templates") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Get started with pre-built workflows:")
                        .font(.headline)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 12) {
                        TemplateCard(
                            title: "Email Automation",
                            description: "Send emails based on triggers",
                            icon: "envelope"
                        )
                        
                        TemplateCard(
                            title: "Data Sync",
                            description: "Sync data between services",
                            icon: "arrow.triangle.2.circlepath"
                        )
                        
                        TemplateCard(
                            title: "Social Media",
                            description: "Automate social media posts",
                            icon: "bubble.left.and.bubble.right"
                        )
                        
                        TemplateCard(
                            title: "File Processing",
                            description: "Process and organize files",
                            icon: "folder"
                        )
                    }
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Workflows")
    }
}

struct TemplateCard: View {
    let title: String
    let description: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.accentColor)
                    .font(.title2)
                
                Spacer()
            }
            
            Text(title)
                .font(.headline)
            
            Text(description)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
            
            Button("Use Template") {
                // TODO: Implement template loading
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(8)
    }
}

// MARK: - Advanced Settings

struct AdvancedSettingsView: View {
    @Binding var logLevel: LogLevel
    @Binding var enableTelemetry: Bool
    
    var body: some View {
        Form {
            Section("Logging") {
                HStack {
                    Text("Log level:")
                        .frame(width: 100, alignment: .leading)
                    Picker("Log Level", selection: $logLevel) {
                        ForEach(LogLevel.allCases, id: \.self) { level in
                            Text(level.displayName).tag(level)
                        }
                    }
                    .pickerStyle(.menu)
                    .frame(width: 120)
                }
                
                Button("Open Log Folder") {
                    let urls = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
                    let logURL = urls[0].appendingPathComponent("n8n-macos/logs")
                    NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: logURL.path)
                }
                .buttonStyle(.bordered)
            }
            
            Section("Privacy") {
                Toggle("Enable anonymous telemetry", isOn: $enableTelemetry)
                    .help("Help improve n8n by sending anonymous usage data")
                
                Text("Telemetry data includes app usage statistics and crash reports. No personal data or workflow content is collected.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Section("Data") {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Manage your n8n data:")
                        .font(.headline)
                    
                    HStack {
                        Button("Open Data Folder") {
                            let urls = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)
                            let dataURL = urls[0].appendingPathComponent("n8n-macos")
                            NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: dataURL.path)
                        }
                        .buttonStyle(.bordered)
                        
                        Button("Export All Workflows") {
                            // TODO: Implement bulk export
                        }
                        .buttonStyle(.bordered)
                    }
                    
                    Button("Reset to Defaults") {
                        resetToDefaults()
                    }
                    .buttonStyle(.bordered)
                    .foregroundColor(.red)
                }
            }
        }
        .formStyle(.grouped)
        .navigationTitle("Advanced")
    }
    
    private func resetToDefaults() {
        let alert = NSAlert()
        alert.messageText = "Reset Settings"
        alert.informativeText = "This will reset all settings to their default values. This action cannot be undone."
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Reset")
        alert.addButton(withTitle: "Cancel")
        
        if alert.runModal() == .alertFirstButtonReturn {
            UserDefaults.standard.removePersistentDomain(forName: Bundle.main.bundleIdentifier!)
            NSApp.terminate(nil)
        }
    }
}

// MARK: - About View

struct AboutView: View {
    var body: some View {
        VStack(spacing: 20) {
            // App Icon
            if let appIcon = NSImage(named: "AppIcon") {
                Image(nsImage: appIcon)
                    .resizable()
                    .frame(width: 128, height: 128)
            }
            
            VStack(spacing: 8) {
                Text("n8n Workflow Automation")
                    .font(.title)
                    .fontWeight(.bold)
                
                Text("Version 1.0.0")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                Text("Build 2024.1.0")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Text("A native macOS application for n8n workflow automation.\nOptimized for Apple Silicon and seamless macOS integration.")
                .multilineTextAlignment(.center)
                .padding(.horizontal)
            
            VStack(spacing: 12) {
                HStack(spacing: 16) {
                    Button("Visit n8n.io") {
                        if let url = URL(string: "https://n8n.io") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    
                    Button("Documentation") {
                        if let url = URL(string: "https://docs.n8n.io") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.bordered)
                }
                
                HStack(spacing: 16) {
                    Button("Community") {
                        if let url = URL(string: "https://community.n8n.io") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.bordered)
                    
                    Button("GitHub") {
                        if let url = URL(string: "https://github.com/n8n-io/n8n") {
                            NSWorkspace.shared.open(url)
                        }
                    }
                    .buttonStyle(.bordered)
                }
            }
            
            Spacer()
            
            Text("© 2024 n8n.io. All rights reserved.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .navigationTitle("About")
    }
}

// MARK: - Supporting Types

enum AppTheme: String, CaseIterable {
    case light = "light"
    case dark = "dark"
    case system = "system"
    
    var displayName: String {
        switch self {
        case .light: return "Light"
        case .dark: return "Dark"
        case .system: return "System"
        }
    }
}

enum LogLevel: String, CaseIterable {
    case debug = "debug"
    case info = "info"
    case warning = "warning"
    case error = "error"
    
    var displayName: String {
        switch self {
        case .debug: return "Debug"
        case .info: return "Info"
        case .warning: return "Warning"
        case .error: return "Error"
        }
    }
}

#Preview {
    SettingsView()
        .environmentObject(WorkflowManager())
}