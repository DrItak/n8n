import Cocoa
import SwiftUI
import UserNotifications
import OSLog

class AppDelegate: NSObject, NSApplicationDelegate {
    private let logger = Logger(subsystem: "io.n8n.macos", category: "AppDelegate")
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        logger.info("n8n macOS application launched")
        
        // Configure app appearance
        configureAppearance()
        
        // Setup notification handling
        setupNotifications()
        
        // Register for system events
        setupSystemEventHandlers()
        
        // Configure dock and menu bar
        configureDockAndMenuBar()
        
        // Setup URL scheme handling
        setupURLSchemeHandling()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        logger.info("n8n macOS application terminating")
        
        // Cleanup operations
        NotificationCenter.default.post(name: .applicationWillTerminate, object: nil)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Keep app running in background for workflow automation
        return false
    }
    
    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if !flag {
            // Reopen main window if no windows are visible
            if let window = NSApp.windows.first {
                window.makeKeyAndOrderFront(nil)
            }
        }
        return true
    }
    
    // MARK: - Configuration
    
    private func configureAppearance() {
        // Set app icon in dock
        if let appIconImage = NSImage(named: "AppIcon") {
            NSApp.applicationIconImage = appIconImage
        }
        
        // Configure window appearance
        NSApp.appearance = NSAppearance(named: .aqua)
        
        // Enable automatic dark mode switching
        if #available(macOS 10.14, *) {
            NSApp.appearance = nil // Use system appearance
        }
    }
    
    private func setupNotifications() {
        // Request notification permissions
        UNUserNotificationCenter.current().delegate = self
        
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                self.logger.error("Failed to request notification permissions: \(error)")
            } else if granted {
                self.logger.info("Notification permissions granted")
            }
        }
    }
    
    private func setupSystemEventHandlers() {
        // Handle system sleep/wake
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(systemWillSleep),
            name: NSWorkspace.willSleepNotification,
            object: nil
        )
        
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(systemDidWake),
            name: NSWorkspace.didWakeNotification,
            object: nil
        )
        
        // Handle network changes
        NSWorkspace.shared.notificationCenter.addObserver(
            self,
            selector: #selector(networkDidChange),
            name: .NSWorkspaceDidChangeNetworkNotification,
            object: nil
        )
    }
    
    private func configureDockAndMenuBar() {
        // Configure dock menu
        let dockMenu = NSMenu()
        
        let newWorkflowItem = NSMenuItem(
            title: "New Workflow",
            action: #selector(createNewWorkflow),
            keyEquivalent: ""
        )
        newWorkflowItem.target = self
        dockMenu.addItem(newWorkflowItem)
        
        let showWorkflowsItem = NSMenuItem(
            title: "Show Workflows",
            action: #selector(showWorkflows),
            keyEquivalent: ""
        )
        showWorkflowsItem.target = self
        dockMenu.addItem(showWorkflowsItem)
        
        NSApp.dockMenu = dockMenu
        
        // Add status bar item (optional)
        setupStatusBarItem()
    }
    
    private func setupStatusBarItem() {
        // Optional: Create a status bar item for quick access
        // This can be toggled via preferences
        
        /*
        let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "gear", accessibilityDescription: "n8n")
            button.action = #selector(statusItemClicked)
            button.target = self
        }
        
        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Show n8n", action: #selector(showMainWindow), keyEquivalent: ""))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        
        statusItem.menu = menu
        */
    }
    
    private func setupURLSchemeHandling() {
        // Register for n8n:// URL scheme
        NSAppleEventManager.shared().setEventHandler(
            self,
            andSelector: #selector(handleURLEvent(_:withReplyEvent:)),
            forEventClass: AEEventClass(kInternetEventClass),
            andEventID: AEEventID(kAEGetURL)
        )
    }
    
    // MARK: - Event Handlers
    
    @objc private func systemWillSleep() {
        logger.info("System going to sleep")
        NotificationCenter.default.post(name: .systemWillSleep, object: nil)
    }
    
    @objc private func systemDidWake() {
        logger.info("System waking up")
        NotificationCenter.default.post(name: .systemDidWake, object: nil)
    }
    
    @objc private func networkDidChange() {
        logger.info("Network configuration changed")
        NotificationCenter.default.post(name: .networkDidChange, object: nil)
    }
    
    @objc private func createNewWorkflow() {
        NotificationCenter.default.post(name: .newWorkflow, object: nil)
    }
    
    @objc private func showWorkflows() {
        // Bring main window to front
        if let window = NSApp.windows.first {
            window.makeKeyAndOrderFront(nil)
        }
    }
    
    @objc private func showMainWindow() {
        NSApp.activate(ignoringOtherApps: true)
        if let window = NSApp.windows.first {
            window.makeKeyAndOrderFront(nil)
        }
    }
    
    @objc private func statusItemClicked() {
        showMainWindow()
    }
    
    @objc private func handleURLEvent(_ event: NSAppleEventDescriptor, withReplyEvent replyEvent: NSAppleEventDescriptor) {
        guard let urlString = event.paramDescriptor(forKeyword: keyDirectObject)?.stringValue,
              let url = URL(string: urlString) else {
            return
        }
        
        logger.info("Handling URL: \(urlString)")
        
        // Handle different n8n URL schemes
        switch url.host {
        case "workflow":
            // n8n://workflow/import?data=...
            handleWorkflowURL(url)
        case "open":
            // n8n://open
            showMainWindow()
        default:
            logger.warning("Unknown URL scheme: \(urlString)")
        }
    }
    
    private func handleWorkflowURL(_ url: URL) {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return
        }
        
        switch url.pathComponents.last {
        case "import":
            if let dataQuery = components.queryItems?.first(where: { $0.name == "data" })?.value {
                // Handle workflow import
                NotificationCenter.default.post(
                    name: .importWorkflowFromURL,
                    object: nil,
                    userInfo: ["data": dataQuery]
                )
            }
        default:
            break
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        // Show notification even when app is in foreground
        completionHandler([.banner, .sound])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        // Handle notification tap
        let identifier = response.notification.request.identifier
        logger.info("User tapped notification: \(identifier)")
        
        // Bring app to foreground
        showMainWindow()
        
        completionHandler()
    }
}

// MARK: - Notification Names

extension Notification.Name {
    static let applicationWillTerminate = Notification.Name("applicationWillTerminate")
    static let systemWillSleep = Notification.Name("systemWillSleep")
    static let systemDidWake = Notification.Name("systemDidWake")
    static let networkDidChange = Notification.Name("networkDidChange")
    static let importWorkflowFromURL = Notification.Name("importWorkflowFromURL")
    static let NSWorkspaceDidChangeNetworkNotification = Notification.Name("NSWorkspaceDidChangeNetworkNotification")
}