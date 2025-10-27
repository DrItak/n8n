import SwiftUI
import WebKit
import Combine
import UserNotifications

class WebViewBridge: NSObject, ObservableObject {
    private var webView: WKWebView?
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        super.init()
        setupWebView()
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        
        // Enable developer tools in debug builds
        #if DEBUG
        configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        #endif
        
        // Configure for better performance on Apple Silicon
        configuration.preferences.javaScriptEnabled = true
        configuration.allowsAirPlayForMediaPlayback = false
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Add message handlers for native integration
        let contentController = WKUserContentController()
        contentController.add(self, name: "nativeHandler")
        contentController.add(self, name: "notificationHandler")
        contentController.add(self, name: "fileSystemHandler")
        configuration.userContentController = contentController
        
        // Inject custom JavaScript for native integration
        let script = WKUserScript(
            source: nativeIntegrationScript,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        contentController.addUserScript(script)
        
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView?.navigationDelegate = self
        webView?.uiDelegate = self
        
        // Enable right-click context menu
        webView?.allowsMagnification = true
        webView?.allowsBackForwardNavigationGestures = true
    }
    
    func loadN8NEditor(port: Int) {
        guard let webView = webView else { return }
        
        let urlString = "http://localhost:\(port)"
        if let url = URL(string: urlString) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    func executeJavaScript(_ script: String, completion: ((Any?) -> Void)? = nil) {
        webView?.evaluateJavaScript(script) { result, error in
            if let error = error {
                print("JavaScript execution error: \(error)")
            }
            completion?(result)
        }
    }
    
    private var nativeIntegrationScript: String {
        """
        // Native macOS integration for n8n
        window.n8nNative = {
            // Workflow operations
            createNewWorkflow: function() {
                // Trigger n8n's new workflow creation
                if (window.n8n && window.n8n.createNewWorkflow) {
                    window.n8n.createNewWorkflow();
                }
            },
            
            importWorkflow: function(workflowData) {
                try {
                    const workflow = JSON.parse(workflowData);
                    if (window.n8n && window.n8n.importWorkflow) {
                        window.n8n.importWorkflow(workflow);
                    }
                } catch (error) {
                    console.error('Failed to import workflow:', error);
                }
            },
            
            exportCurrentWorkflow: function() {
                if (window.n8n && window.n8n.getCurrentWorkflow) {
                    return JSON.stringify(window.n8n.getCurrentWorkflow());
                }
                return null;
            },
            
            // Native notifications
            showNotification: function(title, body, type = 'info') {
                window.webkit.messageHandlers.notificationHandler.postMessage({
                    action: 'show',
                    title: title,
                    body: body,
                    type: type
                });
            },
            
            // File system operations
            saveFile: function(filename, content, contentType = 'application/json') {
                window.webkit.messageHandlers.fileSystemHandler.postMessage({
                    action: 'save',
                    filename: filename,
                    content: content,
                    contentType: contentType
                });
            },
            
            openFile: function(allowedTypes = ['json']) {
                window.webkit.messageHandlers.fileSystemHandler.postMessage({
                    action: 'open',
                    allowedTypes: allowedTypes
                });
            },
            
            // System integration
            openURL: function(url) {
                window.webkit.messageHandlers.nativeHandler.postMessage({
                    action: 'openURL',
                    url: url
                });
            },
            
            copyToClipboard: function(text) {
                window.webkit.messageHandlers.nativeHandler.postMessage({
                    action: 'copyToClipboard',
                    text: text
                });
            },
            
            showInFinder: function(path) {
                window.webkit.messageHandlers.nativeHandler.postMessage({
                    action: 'showInFinder',
                    path: path
                });
            }
        };
        
        // Override console methods to show native notifications for errors
        const originalConsoleError = console.error;
        console.error = function(...args) {
            originalConsoleError.apply(console, args);
            window.n8nNative.showNotification(
                'n8n Error',
                args.join(' '),
                'error'
            );
        };
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Cmd+N for new workflow
            if (event.metaKey && event.key === 'n' && !event.shiftKey) {
                event.preventDefault();
                window.n8nNative.createNewWorkflow();
            }
            
            // Cmd+S for save (export)
            if (event.metaKey && event.key === 's') {
                event.preventDefault();
                const workflow = window.n8nNative.exportCurrentWorkflow();
                if (workflow) {
                    window.n8nNative.saveFile('workflow.json', workflow);
                }
            }
            
            // Cmd+O for open (import)
            if (event.metaKey && event.key === 'o') {
                event.preventDefault();
                window.n8nNative.openFile(['json']);
            }
        });
        
        // Notify native app when page is ready
        window.addEventListener('load', function() {
            window.webkit.messageHandlers.nativeHandler.postMessage({
                action: 'pageLoaded'
            });
        });
        
        // Monitor workflow execution
        if (window.n8n) {
            const originalExecute = window.n8n.executeWorkflow;
            window.n8n.executeWorkflow = function(...args) {
                const result = originalExecute.apply(this, args);
                window.webkit.messageHandlers.nativeHandler.postMessage({
                    action: 'workflowExecuted',
                    workflowId: args[0]?.id || 'unknown'
                });
                return result;
            };
        }
        """
    }
}

// MARK: - WKNavigationDelegate
extension WebViewBridge: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("n8n editor loaded successfully")
        
        // Inject additional styling for native look
        let cssInjection = """
        var style = document.createElement('style');
        style.textContent = `
            /* Native macOS styling */
            body {
                -webkit-font-smoothing: antialiased;
                font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
            }
            
            /* Hide web scrollbars in favor of native ones */
            ::-webkit-scrollbar {
                width: 0px;
                background: transparent;
            }
            
            /* Improve button styling */
            button, .button {
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            
            /* Native focus rings */
            button:focus, input:focus, textarea:focus, select:focus {
                outline: 2px solid #007AFF;
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
        """
        
        webView.evaluateJavaScript(cssInjection) { _, error in
            if let error = error {
                print("CSS injection error: \(error)")
            }
        }
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("Failed to load n8n editor: \(error)")
    }
}

// MARK: - WKUIDelegate
extension WebViewBridge: WKUIDelegate {
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // Open links in default browser
        if let url = navigationAction.request.url {
            NSWorkspace.shared.open(url)
        }
        return nil
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "n8n"
        alert.informativeText = message
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.runModal()
        completionHandler()
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "n8n"
        alert.informativeText = message
        alert.alertStyle = .informational
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        let response = alert.runModal()
        completionHandler(response == .alertFirstButtonReturn)
    }
}

// MARK: - WKScriptMessageHandler
extension WebViewBridge: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any] else { return }
        
        switch message.name {
        case "nativeHandler":
            handleNativeMessage(body)
        case "notificationHandler":
            handleNotificationMessage(body)
        case "fileSystemHandler":
            handleFileSystemMessage(body)
        default:
            break
        }
    }
    
    private func handleNativeMessage(_ body: [String: Any]) {
        guard let action = body["action"] as? String else { return }
        
        switch action {
        case "pageLoaded":
            print("n8n page loaded and ready")
            
        case "workflowExecuted":
            let workflowId = body["workflowId"] as? String ?? "unknown"
            showNotification(title: "Workflow Executed", body: "Workflow \(workflowId) completed successfully")
            
        case "openURL":
            if let urlString = body["url"] as? String, let url = URL(string: urlString) {
                NSWorkspace.shared.open(url)
            }
            
        case "copyToClipboard":
            if let text = body["text"] as? String {
                let pasteboard = NSPasteboard.general
                pasteboard.clearContents()
                pasteboard.setString(text, forType: .string)
            }
            
        case "showInFinder":
            if let path = body["path"] as? String {
                let url = URL(fileURLWithPath: path)
                NSWorkspace.shared.activateFileViewerSelecting([url])
            }
            
        default:
            break
        }
    }
    
    private func handleNotificationMessage(_ body: [String: Any]) {
        guard let action = body["action"] as? String, action == "show",
              let title = body["title"] as? String,
              let bodyText = body["body"] as? String else { return }
        
        let type = body["type"] as? String ?? "info"
        showNotification(title: title, body: bodyText, type: type)
    }
    
    private func handleFileSystemMessage(_ body: [String: Any]) {
        guard let action = body["action"] as? String else { return }
        
        switch action {
        case "save":
            if let filename = body["filename"] as? String,
               let content = body["content"] as? String {
                saveFileDialog(filename: filename, content: content)
            }
            
        case "open":
            let allowedTypes = body["allowedTypes"] as? [String] ?? ["json"]
            openFileDialog(allowedTypes: allowedTypes)
            
        default:
            break
        }
    }
    
    private func showNotification(title: String, body: String, type: String = "info") {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: nil
        )
        
        UNUserNotificationCenter.current().add(request)
    }
    
    private func saveFileDialog(filename: String, content: String) {
        DispatchQueue.main.async {
            let panel = NSSavePanel()
            panel.nameFieldStringValue = filename
            panel.allowedContentTypes = [.json]
            
            if panel.runModal() == .OK, let url = panel.url {
                do {
                    try content.write(to: url, atomically: true, encoding: .utf8)
                    self.showNotification(title: "File Saved", body: "Workflow saved successfully")
                } catch {
                    self.showNotification(title: "Save Failed", body: error.localizedDescription, type: "error")
                }
            }
        }
    }
    
    private func openFileDialog(allowedTypes: [String]) {
        DispatchQueue.main.async {
            let panel = NSOpenPanel()
            panel.allowsMultipleSelection = false
            panel.canChooseDirectories = false
            panel.allowedContentTypes = allowedTypes.map { .init(filenameExtension: $0) }.compactMap { $0 }
            
            if panel.runModal() == .OK, let url = panel.url {
                do {
                    let content = try String(contentsOf: url)
                    self.executeJavaScript("window.n8nNative.importWorkflow('\(content.replacingOccurrences(of: "'", with: "\\'"))')")
                } catch {
                    self.showNotification(title: "Import Failed", body: error.localizedDescription, type: "error")
                }
            }
        }
    }
}

// MARK: - WebView Container
struct WebViewContainer: NSViewRepresentable {
    let bridge: WebViewBridge
    
    func makeNSView(context: Context) -> WKWebView {
        return bridge.webView ?? WKWebView()
    }
    
    func updateNSView(_ nsView: WKWebView, context: Context) {
        // Updates handled by bridge
    }
}