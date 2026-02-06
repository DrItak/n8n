import SwiftUI
import Combine
import WebKit
import UserNotifications

@main
struct N8NApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var workflowManager = WorkflowManager()
    @StateObject private var menuController = MenuController()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(workflowManager)
                .environmentObject(menuController)
                .frame(minWidth: 1200, minHeight: 800)
                .onAppear {
                    setupApp()
                }
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .commands {
            N8NMenuCommands()
        }
        
        // Settings window
        Settings {
            SettingsView()
                .environmentObject(workflowManager)
        }
    }
    
    private func setupApp() {
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if granted {
                print("Notification permissions granted")
            }
        }
        
        // Configure for M3 Pro optimization
        configurePerformanceSettings()
    }
    
    private func configurePerformanceSettings() {
        // Enable Metal rendering for better performance on Apple Silicon
        UserDefaults.standard.set(true, forKey: "WebKitMetalRenderingEnabled")
        
        // Optimize for high refresh rate displays
        UserDefaults.standard.set(true, forKey: "WebKitDisplayP3ColorSpace")
        
        // Enable GPU acceleration
        UserDefaults.standard.set(true, forKey: "WebKitAcceleratedCompositingEnabled")
    }
}

// MARK: - Menu Commands
struct N8NMenuCommands: Commands {
    var body: some Commands {
        CommandGroup(after: .newItem) {
            Button("New Workflow") {
                NotificationCenter.default.post(name: .newWorkflow, object: nil)
            }
            .keyboardShortcut("n", modifiers: [.command])
            
            Button("Import Workflow") {
                NotificationCenter.default.post(name: .importWorkflow, object: nil)
            }
            .keyboardShortcut("i", modifiers: [.command])
            
            Divider()
        }
        
        CommandGroup(after: .saveItem) {
            Button("Export Workflow") {
                NotificationCenter.default.post(name: .exportWorkflow, object: nil)
            }
            .keyboardShortcut("e", modifiers: [.command])
        }
        
        CommandGroup(replacing: .help) {
            Button("n8n Documentation") {
                if let url = URL(string: "https://docs.n8n.io") {
                    NSWorkspace.shared.open(url)
                }
            }
            
            Button("Community Forum") {
                if let url = URL(string: "https://community.n8n.io") {
                    NSWorkspace.shared.open(url)
                }
            }
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let newWorkflow = Notification.Name("newWorkflow")
    static let importWorkflow = Notification.Name("importWorkflow")
    static let exportWorkflow = Notification.Name("exportWorkflow")
    static let workflowExecuted = Notification.Name("workflowExecuted")
}