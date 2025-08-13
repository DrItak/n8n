import SwiftUI
import Cocoa
import OSLog

@MainActor
class MenuController: ObservableObject {
    private let logger = Logger(subsystem: "io.n8n.macos", category: "MenuController")
    
    @Published var recentWorkflows: [Workflow] = []
    @Published var isServerRunning = false
    
    init() {
        setupMenuBarItems()
        setupTouchBarSupport()
        observeNotifications()
    }
    
    private func setupMenuBarItems() {
        // This will be called when the app launches
        DispatchQueue.main.async {
            self.configureMainMenu()
        }
    }
    
    private func configureMainMenu() {
        guard let mainMenu = NSApp.mainMenu else { return }
        
        // Add n8n-specific menu items
        addN8NMenu(to: mainMenu)
        addWorkflowMenu(to: mainMenu)
        addToolsMenu(to: mainMenu)
        configureViewMenu(in: mainMenu)
        configureWindowMenu(in: mainMenu)
    }
    
    private func addN8NMenu(to mainMenu: NSMenu) {
        // Create n8n menu (first menu after Apple menu)
        let n8nMenu = NSMenu(title: "n8n")
        let n8nMenuItem = NSMenuItem(title: "n8n", action: nil, keyEquivalent: "")
        n8nMenuItem.submenu = n8nMenu
        
        // About n8n
        let aboutItem = NSMenuItem(
            title: "About n8n",
            action: #selector(showAbout),
            keyEquivalent: ""
        )
        aboutItem.target = self
        n8nMenu.addItem(aboutItem)
        
        n8nMenu.addItem(NSMenuItem.separator())
        
        // Preferences
        let preferencesItem = NSMenuItem(
            title: "Preferences...",
            action: #selector(showPreferences),
            keyEquivalent: ","
        )
        preferencesItem.target = self
        n8nMenu.addItem(preferencesItem)
        
        n8nMenu.addItem(NSMenuItem.separator())
        
        // Server controls
        let startServerItem = NSMenuItem(
            title: "Start Server",
            action: #selector(toggleServer),
            keyEquivalent: "r"
        )
        startServerItem.target = self
        startServerItem.tag = 1001 // Tag for identification
        n8nMenu.addItem(startServerItem)
        
        let stopServerItem = NSMenuItem(
            title: "Stop Server",
            action: #selector(toggleServer),
            keyEquivalent: "t"
        )
        stopServerItem.target = self
        stopServerItem.tag = 1002
        n8nMenu.addItem(stopServerItem)
        
        n8nMenu.addItem(NSMenuItem.separator())
        
        // Services
        n8nMenu.addItem(NSMenuItem(title: "Services", action: nil, keyEquivalent: ""))
        
        n8nMenu.addItem(NSMenuItem.separator())
        
        // Hide/Show
        let hideItem = NSMenuItem(
            title: "Hide n8n",
            action: #selector(NSApplication.hide(_:)),
            keyEquivalent: "h"
        )
        n8nMenu.addItem(hideItem)
        
        let hideOthersItem = NSMenuItem(
            title: "Hide Others",
            action: #selector(NSApplication.hideOtherApplications(_:)),
            keyEquivalent: "h"
        )
        hideOthersItem.keyEquivalentModifierMask = [.command, .option]
        n8nMenu.addItem(hideOthersItem)
        
        let showAllItem = NSMenuItem(
            title: "Show All",
            action: #selector(NSApplication.unhideAllApplications(_:)),
            keyEquivalent: ""
        )
        n8nMenu.addItem(showAllItem)
        
        n8nMenu.addItem(NSMenuItem.separator())
        
        // Quit
        let quitItem = NSMenuItem(
            title: "Quit n8n",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        )
        n8nMenu.addItem(quitItem)
        
        // Insert at position 1 (after Apple menu)
        mainMenu.insertItem(n8nMenuItem, at: 1)
    }
    
    private func addWorkflowMenu(to mainMenu: NSMenu) {
        let workflowMenu = NSMenu(title: "Workflow")
        let workflowMenuItem = NSMenuItem(title: "Workflow", action: nil, keyEquivalent: "")
        workflowMenuItem.submenu = workflowMenu
        
        // New Workflow
        let newWorkflowItem = NSMenuItem(
            title: "New Workflow",
            action: #selector(newWorkflow),
            keyEquivalent: "n"
        )
        newWorkflowItem.target = self
        workflowMenu.addItem(newWorkflowItem)
        
        // Open Recent submenu
        let openRecentMenu = NSMenu(title: "Open Recent")
        let openRecentItem = NSMenuItem(title: "Open Recent", action: nil, keyEquivalent: "")
        openRecentItem.submenu = openRecentMenu
        workflowMenu.addItem(openRecentItem)
        
        // Clear Recent
        let clearRecentItem = NSMenuItem(
            title: "Clear Recent",
            action: #selector(clearRecentWorkflows),
            keyEquivalent: ""
        )
        clearRecentItem.target = self
        openRecentMenu.addItem(clearRecentItem)
        
        workflowMenu.addItem(NSMenuItem.separator())
        
        // Import/Export
        let importItem = NSMenuItem(
            title: "Import Workflow...",
            action: #selector(importWorkflow),
            keyEquivalent: "i"
        )
        importItem.target = self
        workflowMenu.addItem(importItem)
        
        let exportItem = NSMenuItem(
            title: "Export Workflow...",
            action: #selector(exportWorkflow),
            keyEquivalent: "e"
        )
        exportItem.target = self
        workflowMenu.addItem(exportItem)
        
        workflowMenu.addItem(NSMenuItem.separator())
        
        // Execute
        let executeItem = NSMenuItem(
            title: "Execute Workflow",
            action: #selector(executeCurrentWorkflow),
            keyEquivalent: Return
        )
        executeItem.keyEquivalentModifierMask = [.command]
        executeItem.target = self
        workflowMenu.addItem(executeItem)
        
        // Stop execution
        let stopItem = NSMenuItem(
            title: "Stop Execution",
            action: #selector(stopExecution),
            keyEquivalent: "."
        )
        stopItem.target = self
        workflowMenu.addItem(stopItem)
        
        workflowMenu.addItem(NSMenuItem.separator())
        
        // Activate/Deactivate
        let activateItem = NSMenuItem(
            title: "Activate Workflow",
            action: #selector(toggleWorkflowActivation),
            keyEquivalent: "a"
        )
        activateItem.keyEquivalentModifierMask = [.command, .shift]
        activateItem.target = self
        workflowMenu.addItem(activateItem)
        
        mainMenu.addItem(workflowMenuItem)
        updateRecentWorkflowsMenu(openRecentMenu)
    }
    
    private func addToolsMenu(to mainMenu: NSMenu) {
        let toolsMenu = NSMenu(title: "Tools")
        let toolsMenuItem = NSMenuItem(title: "Tools", action: nil, keyEquivalent: "")
        toolsMenuItem.submenu = toolsMenu
        
        // Node Library
        let nodeLibraryItem = NSMenuItem(
            title: "Node Library",
            action: #selector(showNodeLibrary),
            keyEquivalent: "l"
        )
        nodeLibraryItem.keyEquivalentModifierMask = [.command, .shift]
        nodeLibraryItem.target = self
        toolsMenu.addItem(nodeLibraryItem)
        
        // Credentials
        let credentialsItem = NSMenuItem(
            title: "Credentials",
            action: #selector(showCredentials),
            keyEquivalent: "k"
        )
        credentialsItem.keyEquivalentModifierMask = [.command, .shift]
        credentialsItem.target = self
        toolsMenu.addItem(credentialsItem)
        
        toolsMenu.addItem(NSMenuItem.separator())
        
        // Templates
        let templatesItem = NSMenuItem(
            title: "Browse Templates",
            action: #selector(showTemplates),
            keyEquivalent: "t"
        )
        templatesItem.keyEquivalentModifierMask = [.command, .shift]
        templatesItem.target = self
        toolsMenu.addItem(templatesItem)
        
        toolsMenu.addItem(NSMenuItem.separator())
        
        // Developer Tools
        let devToolsItem = NSMenuItem(
            title: "Developer Tools",
            action: #selector(showDeveloperTools),
            keyEquivalent: "d"
        )
        devToolsItem.keyEquivalentModifierMask = [.command, .option]
        devToolsItem.target = self
        toolsMenu.addItem(devToolsItem)
        
        // Console
        let consoleItem = NSMenuItem(
            title: "Console",
            action: #selector(showConsole),
            keyEquivalent: "j"
        )
        consoleItem.keyEquivalentModifierMask = [.command, .option]
        consoleItem.target = self
        toolsMenu.addItem(consoleItem)
        
        mainMenu.addItem(toolsMenuItem)
    }
    
    private func configureViewMenu(in mainMenu: NSMenu) {
        // Find existing View menu or create one
        var viewMenu: NSMenu?
        
        for item in mainMenu.items {
            if item.title == "View" {
                viewMenu = item.submenu
                break
            }
        }
        
        if viewMenu == nil {
            viewMenu = NSMenu(title: "View")
            let viewMenuItem = NSMenuItem(title: "View", action: nil, keyEquivalent: "")
            viewMenuItem.submenu = viewMenu
            mainMenu.addItem(viewMenuItem)
        }
        
        guard let menu = viewMenu else { return }
        
        // Add n8n-specific view options
        menu.addItem(NSMenuItem.separator())
        
        let showSidebarItem = NSMenuItem(
            title: "Show Sidebar",
            action: #selector(toggleSidebar),
            keyEquivalent: "s"
        )
        showSidebarItem.keyEquivalentModifierMask = [.command, .control]
        showSidebarItem.target = self
        menu.addItem(showSidebarItem)
        
        let showMiniMapItem = NSMenuItem(
            title: "Show Mini Map",
            action: #selector(toggleMiniMap),
            keyEquivalent: "m"
        )
        showMiniMapItem.keyEquivalentModifierMask = [.command, .shift]
        showMiniMapItem.target = self
        menu.addItem(showMiniMapItem)
        
        let fullScreenItem = NSMenuItem(
            title: "Enter Full Screen",
            action: #selector(toggleFullScreen),
            keyEquivalent: "f"
        )
        fullScreenItem.keyEquivalentModifierMask = [.command, .control]
        fullScreenItem.target = self
        menu.addItem(fullScreenItem)
    }
    
    private func configureWindowMenu(in mainMenu: NSMenu) {
        // macOS automatically handles most window menu items
        // We can add custom items if needed
    }
    
    // MARK: - Touch Bar Support
    
    private func setupTouchBarSupport() {
        if #available(macOS 10.12.2, *) {
            // Touch Bar will be configured when the main window becomes key
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(windowDidBecomeKey),
                name: NSWindow.didBecomeKeyNotification,
                object: nil
            )
        }
    }
    
    @available(macOS 10.12.2, *)
    @objc private func windowDidBecomeKey() {
        configureTouchBar()
    }
    
    @available(macOS 10.12.2, *)
    private func configureTouchBar() {
        guard let window = NSApp.keyWindow else { return }
        
        let touchBar = NSTouchBar()
        touchBar.delegate = self
        touchBar.defaultItemIdentifiers = [
            .newWorkflow,
            .executeWorkflow,
            .flexibleSpace,
            .serverStatus,
            .flexibleSpace,
            .preferences
        ]
        
        window.touchBar = touchBar
    }
    
    // MARK: - Menu Actions
    
    @objc private func showAbout() {
        let aboutPanel = NSAlert()
        aboutPanel.messageText = "n8n Workflow Automation"
        aboutPanel.informativeText = """
        Version 1.0.0
        
        A native macOS application for n8n workflow automation.
        Optimized for Apple Silicon and macOS integration.
        
        © 2024 n8n.io
        """
        aboutPanel.alertStyle = .informational
        aboutPanel.addButton(withTitle: "OK")
        aboutPanel.addButton(withTitle: "Visit n8n.io")
        
        let response = aboutPanel.runModal()
        if response == .alertSecondButtonReturn {
            if let url = URL(string: "https://n8n.io") {
                NSWorkspace.shared.open(url)
            }
        }
    }
    
    @objc private func showPreferences() {
        NotificationCenter.default.post(name: .showPreferences, object: nil)
    }
    
    @objc private func toggleServer() {
        NotificationCenter.default.post(name: .toggleServer, object: nil)
    }
    
    @objc private func newWorkflow() {
        NotificationCenter.default.post(name: .newWorkflow, object: nil)
    }
    
    @objc private func importWorkflow() {
        NotificationCenter.default.post(name: .importWorkflow, object: nil)
    }
    
    @objc private func exportWorkflow() {
        NotificationCenter.default.post(name: .exportWorkflow, object: nil)
    }
    
    @objc private func executeCurrentWorkflow() {
        NotificationCenter.default.post(name: .executeWorkflow, object: nil)
    }
    
    @objc private func stopExecution() {
        NotificationCenter.default.post(name: .stopExecution, object: nil)
    }
    
    @objc private func toggleWorkflowActivation() {
        NotificationCenter.default.post(name: .toggleWorkflowActivation, object: nil)
    }
    
    @objc private func showNodeLibrary() {
        NotificationCenter.default.post(name: .showNodeLibrary, object: nil)
    }
    
    @objc private func showCredentials() {
        NotificationCenter.default.post(name: .showCredentials, object: nil)
    }
    
    @objc private func showTemplates() {
        NotificationCenter.default.post(name: .showTemplates, object: nil)
    }
    
    @objc private func showDeveloperTools() {
        NotificationCenter.default.post(name: .showDeveloperTools, object: nil)
    }
    
    @objc private func showConsole() {
        NotificationCenter.default.post(name: .showConsole, object: nil)
    }
    
    @objc private func toggleSidebar() {
        NotificationCenter.default.post(name: .toggleSidebar, object: nil)
    }
    
    @objc private func toggleMiniMap() {
        NotificationCenter.default.post(name: .toggleMiniMap, object: nil)
    }
    
    @objc private func toggleFullScreen() {
        if let window = NSApp.keyWindow {
            window.toggleFullScreen(nil)
        }
    }
    
    @objc private func clearRecentWorkflows() {
        recentWorkflows.removeAll()
        updateRecentWorkflowsMenu()
    }
    
    // MARK: - Recent Workflows
    
    private func updateRecentWorkflowsMenu(_ menu: NSMenu? = nil) {
        guard let workflowMenu = menu ?? findWorkflowMenu() else { return }
        
        // Clear existing recent items (keep "Clear Recent" at the end)
        let itemsToRemove = workflowMenu.items.filter { $0.tag >= 2000 && $0.tag < 3000 }
        itemsToRemove.forEach { workflowMenu.removeItem($0) }
        
        // Add recent workflows
        for (index, workflow) in recentWorkflows.prefix(10).enumerated() {
            let item = NSMenuItem(
                title: workflow.name,
                action: #selector(openRecentWorkflow(_:)),
                keyEquivalent: ""
            )
            item.target = self
            item.tag = 2000 + index
            item.representedObject = workflow
            
            // Insert before "Clear Recent" item
            let insertIndex = max(0, workflowMenu.items.count - 1)
            workflowMenu.insertItem(item, at: insertIndex)
        }
    }
    
    @objc private func openRecentWorkflow(_ sender: NSMenuItem) {
        guard let workflow = sender.representedObject as? Workflow else { return }
        
        NotificationCenter.default.post(
            name: .openWorkflow,
            object: nil,
            userInfo: ["workflow": workflow]
        )
    }
    
    private func findWorkflowMenu() -> NSMenu? {
        guard let mainMenu = NSApp.mainMenu else { return nil }
        
        for item in mainMenu.items {
            if item.title == "Workflow" {
                return item.submenu?.items.first { $0.title == "Open Recent" }?.submenu
            }
        }
        return nil
    }
    
    // MARK: - Notifications
    
    private func observeNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(serverStatusChanged),
            name: .serverStatusChanged,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(workflowOpened),
            name: .workflowOpened,
            object: nil
        )
    }
    
    @objc private func serverStatusChanged(_ notification: Notification) {
        if let isRunning = notification.userInfo?["isRunning"] as? Bool {
            isServerRunning = isRunning
            updateServerMenuItems()
        }
    }
    
    @objc private func workflowOpened(_ notification: Notification) {
        if let workflow = notification.userInfo?["workflow"] as? Workflow {
            addToRecentWorkflows(workflow)
        }
    }
    
    private func updateServerMenuItems() {
        guard let mainMenu = NSApp.mainMenu else { return }
        
        for item in mainMenu.items {
            if item.title == "n8n", let submenu = item.submenu {
                for menuItem in submenu.items {
                    if menuItem.tag == 1001 { // Start Server
                        menuItem.isEnabled = !isServerRunning
                    } else if menuItem.tag == 1002 { // Stop Server
                        menuItem.isEnabled = isServerRunning
                    }
                }
                break
            }
        }
    }
    
    private func addToRecentWorkflows(_ workflow: Workflow) {
        // Remove if already exists
        recentWorkflows.removeAll { $0.id == workflow.id }
        
        // Add to beginning
        recentWorkflows.insert(workflow, at: 0)
        
        // Keep only 10 most recent
        if recentWorkflows.count > 10 {
            recentWorkflows = Array(recentWorkflows.prefix(10))
        }
        
        updateRecentWorkflowsMenu()
    }
}

// MARK: - Touch Bar Support

@available(macOS 10.12.2, *)
extension MenuController: NSTouchBarDelegate {
    func touchBar(_ touchBar: NSTouchBar, makeItemForIdentifier identifier: NSTouchBarItem.Identifier) -> NSTouchBarItem? {
        switch identifier {
        case .newWorkflow:
            let item = NSCustomTouchBarItem(identifier: identifier)
            let button = NSButton(title: "New", target: self, action: #selector(newWorkflow))
            button.bezelColor = NSColor.systemBlue
            item.view = button
            return item
            
        case .executeWorkflow:
            let item = NSCustomTouchBarItem(identifier: identifier)
            let button = NSButton(title: "Execute", target: self, action: #selector(executeCurrentWorkflow))
            button.bezelColor = NSColor.systemGreen
            item.view = button
            return item
            
        case .serverStatus:
            let item = NSCustomTouchBarItem(identifier: identifier)
            let button = NSButton(
                title: isServerRunning ? "Stop Server" : "Start Server",
                target: self,
                action: #selector(toggleServer)
            )
            button.bezelColor = isServerRunning ? NSColor.systemRed : NSColor.systemGreen
            item.view = button
            return item
            
        case .preferences:
            let item = NSCustomTouchBarItem(identifier: identifier)
            let button = NSButton(title: "Settings", target: self, action: #selector(showPreferences))
            item.view = button
            return item
            
        default:
            return nil
        }
    }
}

// MARK: - Touch Bar Identifiers

@available(macOS 10.12.2, *)
extension NSTouchBarItem.Identifier {
    static let newWorkflow = NSTouchBarItem.Identifier("io.n8n.macos.newWorkflow")
    static let executeWorkflow = NSTouchBarItem.Identifier("io.n8n.macos.executeWorkflow")
    static let serverStatus = NSTouchBarItem.Identifier("io.n8n.macos.serverStatus")
    static let preferences = NSTouchBarItem.Identifier("io.n8n.macos.preferences")
}

// MARK: - Additional Notification Names

extension Notification.Name {
    static let showPreferences = Notification.Name("showPreferences")
    static let toggleServer = Notification.Name("toggleServer")
    static let executeWorkflow = Notification.Name("executeWorkflow")
    static let stopExecution = Notification.Name("stopExecution")
    static let toggleWorkflowActivation = Notification.Name("toggleWorkflowActivation")
    static let showNodeLibrary = Notification.Name("showNodeLibrary")
    static let showCredentials = Notification.Name("showCredentials")
    static let showTemplates = Notification.Name("showTemplates")
    static let showDeveloperTools = Notification.Name("showDeveloperTools")
    static let showConsole = Notification.Name("showConsole")
    static let toggleSidebar = Notification.Name("toggleSidebar")
    static let toggleMiniMap = Notification.Name("toggleMiniMap")
    static let openWorkflow = Notification.Name("openWorkflow")
    static let serverStatusChanged = Notification.Name("serverStatusChanged")
    static let workflowOpened = Notification.Name("workflowOpened")
}