import SwiftUI
import Cocoa
import OSLog
import CoreSpotlight
import MobileCoreServices

@MainActor
class SystemIntegration: NSObject, ObservableObject {
    private let logger = Logger(subsystem: "io.n8n.macos", category: "SystemIntegration")
    
    override init() {
        super.init()
        setupSystemIntegrations()
    }
    
    private func setupSystemIntegrations() {
        setupSpotlightIndexing()
        setupQuickLookSupport()
        setupServicesProvider()
        setupDockIntegration()
    }
    
    // MARK: - Spotlight Integration
    
    private func setupSpotlightIndexing() {
        // Enable Spotlight indexing for workflows
        logger.info("Setting up Spotlight integration")
    }
    
    func indexWorkflow(_ workflow: Workflow) {
        let searchableItem = CSSearchableItem(
            uniqueIdentifier: workflow.id,
            domainIdentifier: "io.n8n.workflows",
            attributeSet: createSearchableAttributes(for: workflow)
        )
        
        CSSearchableIndex.default().indexSearchableItems([searchableItem]) { error in
            if let error = error {
                self.logger.error("Failed to index workflow: \(error)")
            } else {
                self.logger.info("Successfully indexed workflow: \(workflow.name)")
            }
        }
    }
    
    private func createSearchableAttributes(for workflow: Workflow) -> CSSearchableItemAttributeSet {
        let attributeSet = CSSearchableItemAttributeSet(itemContentType: kUTTypeData as String)
        
        attributeSet.title = workflow.name
        attributeSet.contentDescription = workflow.description
        attributeSet.keywords = ["workflow", "automation", "n8n"]
        attributeSet.creator = "n8n"
        attributeSet.contentCreationDate = workflow.createdAt
        attributeSet.contentModificationDate = workflow.updatedAt
        
        // Add custom attributes
        attributeSet.setValue(workflow.active, forCustomKey: CSCustomAttributeKey(keyName: "active")!)
        attributeSet.setValue(workflow.nodes.count, forCustomKey: CSCustomAttributeKey(keyName: "nodeCount")!)
        
        return attributeSet
    }
    
    func removeWorkflowFromSpotlight(_ workflowId: String) {
        CSSearchableIndex.default().deleteSearchableItems(withIdentifiers: [workflowId]) { error in
            if let error = error {
                self.logger.error("Failed to remove workflow from Spotlight: \(error)")
            }
        }
    }
    
    // MARK: - Quick Look Support
    
    private func setupQuickLookSupport() {
        // Register for Quick Look preview generation
        logger.info("Setting up Quick Look support")
    }
    
    // MARK: - Services Provider
    
    private func setupServicesProvider() {
        // Register as a services provider
        NSApp.servicesProvider = self
        NSUpdateDynamicServices()
        logger.info("Registered as services provider")
    }
    
    @objc func openWithN8N(_ pasteboard: NSPasteboard, userData: String, error: AutoreleasingUnsafeMutablePointer<NSString>) {
        guard let types = pasteboard.types else { return }
        
        if types.contains(.fileURL) {
            handleFileService(pasteboard)
        } else if types.contains(.string) {
            handleTextService(pasteboard)
        }
    }
    
    private func handleFileService(_ pasteboard: NSPasteboard) {
        guard let urls = pasteboard.readObjects(forClasses: [NSURL.self]) as? [URL] else { return }
        
        for url in urls {
            if url.pathExtension.lowercased() == "json" {
                // Attempt to import as workflow
                importWorkflowFromURL(url)
            }
        }
    }
    
    private func handleTextService(_ pasteboard: NSPasteboard) {
        guard let text = pasteboard.string(forType: .string) else { return }
        
        // Try to parse as JSON workflow
        if let data = text.data(using: .utf8) {
            do {
                let json = try JSONSerialization.jsonObject(with: data)
                if let workflow = json as? [String: Any],
                   workflow["nodes"] != nil {
                    // This looks like a workflow, import it
                    NotificationCenter.default.post(
                        name: .importWorkflowFromText,
                        object: nil,
                        userInfo: ["text": text]
                    )
                }
            } catch {
                logger.error("Failed to parse text as workflow: \(error)")
            }
        }
    }
    
    private func importWorkflowFromURL(_ url: URL) {
        NotificationCenter.default.post(
            name: .importWorkflowFromURL,
            object: nil,
            userInfo: ["url": url]
        )
        
        // Bring app to front
        NSApp.activate(ignoringOtherApps: true)
    }
    
    // MARK: - Dock Integration
    
    private func setupDockIntegration() {
        // Configure dock badge and progress
        logger.info("Setting up dock integration")
    }
    
    func updateDockBadge(count: Int) {
        DispatchQueue.main.async {
            NSApp.dockTile.badgeLabel = count > 0 ? "\(count)" : nil
        }
    }
    
    func setDockProgress(_ progress: Double) {
        DispatchQueue.main.async {
            if progress >= 1.0 {
                NSApp.dockTile.display()
            } else {
                // Custom dock tile with progress
                let dockTile = NSApp.dockTile
                let contentView = NSView(frame: NSRect(x: 0, y: 0, width: 128, height: 128))
                
                // Draw progress indicator
                let progressView = NSProgressIndicator(frame: NSRect(x: 32, y: 32, width: 64, height: 64))
                progressView.style = .spinning
                progressView.isIndeterminate = false
                progressView.doubleValue = progress * 100
                
                contentView.addSubview(progressView)
                dockTile.contentView = contentView
                dockTile.display()
            }
        }
    }
    
    // MARK: - Finder Integration
    
    func showInFinder(_ url: URL) {
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }
    
    func revealInFinder(_ path: String) {
        let url = URL(fileURLWithPath: path)
        showInFinder(url)
    }
    
    // MARK: - Share Extension Support
    
    func shareWorkflow(_ workflow: Workflow) {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(workflow)
            
            let tempURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("\(workflow.name).n8n")
            
            try data.write(to: tempURL)
            
            let sharingService = NSSharingService(named: .sendViaAirDrop)
            sharingService?.perform(withItems: [tempURL])
            
        } catch {
            logger.error("Failed to share workflow: \(error)")
        }
    }
    
    // MARK: - URL Handling
    
    func handleURL(_ url: URL) -> Bool {
        guard url.scheme == "n8n" else { return false }
        
        switch url.host {
        case "workflow":
            return handleWorkflowURL(url)
        case "open":
            // Just bring app to front
            NSApp.activate(ignoringOtherApps: true)
            return true
        default:
            return false
        }
    }
    
    private func handleWorkflowURL(_ url: URL) -> Bool {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
            return false
        }
        
        switch url.pathComponents.last {
        case "import":
            if let dataQuery = components.queryItems?.first(where: { $0.name == "data" })?.value {
                NotificationCenter.default.post(
                    name: .importWorkflowFromURL,
                    object: nil,
                    userInfo: ["data": dataQuery]
                )
                return true
            }
        case "create":
            NotificationCenter.default.post(name: .newWorkflow, object: nil)
            return true
        default:
            break
        }
        
        return false
    }
    
    // MARK: - System Events
    
    func handleSystemSleep() {
        logger.info("System going to sleep - pausing workflows")
        NotificationCenter.default.post(name: .pauseAllWorkflows, object: nil)
    }
    
    func handleSystemWake() {
        logger.info("System waking up - resuming workflows")
        NotificationCenter.default.post(name: .resumeAllWorkflows, object: nil)
    }
    
    func handleNetworkChange() {
        logger.info("Network configuration changed - checking connectivity")
        NotificationCenter.default.post(name: .checkNetworkConnectivity, object: nil)
    }
    
    // MARK: - Accessibility
    
    func configureAccessibility() {
        // Configure accessibility features
        NSApp.accessibilitySetOverrideValue(true, forAttribute: .accessibilityEnabled)
    }
    
    // MARK: - Touch Bar Integration
    
    @available(macOS 10.12.2, *)
    func configureTouchBar(for window: NSWindow) {
        let touchBar = NSTouchBar()
        touchBar.defaultItemIdentifiers = [
            .n8nNewWorkflow,
            .n8nExecuteWorkflow,
            .flexibleSpace,
            .n8nServerStatus
        ]
        
        window.touchBar = touchBar
    }
}

// MARK: - Touch Bar Items

@available(macOS 10.12.2, *)
extension NSTouchBarItem.Identifier {
    static let n8nNewWorkflow = NSTouchBarItem.Identifier("io.n8n.macos.touchbar.newWorkflow")
    static let n8nExecuteWorkflow = NSTouchBarItem.Identifier("io.n8n.macos.touchbar.executeWorkflow")
    static let n8nServerStatus = NSTouchBarItem.Identifier("io.n8n.macos.touchbar.serverStatus")
}

// MARK: - Additional Notification Names

extension Notification.Name {
    static let importWorkflowFromText = Notification.Name("importWorkflowFromText")
    static let pauseAllWorkflows = Notification.Name("pauseAllWorkflows")
    static let resumeAllWorkflows = Notification.Name("resumeAllWorkflows")
    static let checkNetworkConnectivity = Notification.Name("checkNetworkConnectivity")
}

// MARK: - Spotlight Custom Attributes

extension CSCustomAttributeKey {
    static let workflowActive = CSCustomAttributeKey(keyName: "active", searchable: true, searchableByDefault: true, unique: false, multiValued: false)
    static let workflowNodeCount = CSCustomAttributeKey(keyName: "nodeCount", searchable: true, searchableByDefault: false, unique: false, multiValued: false)
}