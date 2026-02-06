import SwiftUI
import WebKit
import Combine

struct ContentView: View {
    @EnvironmentObject var workflowManager: WorkflowManager
    @EnvironmentObject var menuController: MenuController
    @StateObject private var webViewBridge = WebViewBridge()
    @State private var showingSidebar = true
    @State private var showingSettings = false
    @State private var selectedWorkflow: Workflow?
    @State private var isServerRunning = false
    @State private var serverPort = 5678
    
    var body: some View {
        NavigationSplitView {
            // Sidebar
            SidebarView(selectedWorkflow: $selectedWorkflow)
                .frame(minWidth: 250, maxWidth: 350)
        } detail: {
            // Main content area
            VStack(spacing: 0) {
                // Toolbar
                ToolbarView(
                    isServerRunning: $isServerRunning,
                    serverPort: serverPort,
                    onNewWorkflow: { createNewWorkflow() },
                    onImportWorkflow: { importWorkflow() },
                    onExportWorkflow: { exportWorkflow() }
                )
                
                // WebView container
                WebViewContainer(bridge: webViewBridge)
                    .onAppear {
                        startN8NServer()
                    }
            }
        }
        .navigationSplitViewStyle(.balanced)
        .onReceive(NotificationCenter.default.publisher(for: .newWorkflow)) { _ in
            createNewWorkflow()
        }
        .onReceive(NotificationCenter.default.publisher(for: .importWorkflow)) { _ in
            importWorkflow()
        }
        .onReceive(NotificationCenter.default.publisher(for: .exportWorkflow)) { _ in
            exportWorkflow()
        }
        .sheet(isPresented: $showingSettings) {
            SettingsView()
                .environmentObject(workflowManager)
        }
    }
    
    private func startN8NServer() {
        Task {
            do {
                try await workflowManager.startServer(port: serverPort)
                await MainActor.run {
                    isServerRunning = true
                    webViewBridge.loadN8NEditor(port: serverPort)
                }
            } catch {
                print("Failed to start n8n server: \(error)")
            }
        }
    }
    
    private func createNewWorkflow() {
        webViewBridge.executeJavaScript("window.n8n?.createNewWorkflow?.()")
    }
    
    private func importWorkflow() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.json]
        panel.allowsMultipleSelection = false
        panel.canChooseDirectories = false
        
        if panel.runModal() == .OK, let url = panel.url {
            do {
                let data = try Data(contentsOf: url)
                let json = String(data: data, encoding: .utf8) ?? ""
                webViewBridge.executeJavaScript("window.n8n?.importWorkflow?.('\(json)')")
            } catch {
                print("Failed to import workflow: \(error)")
            }
        }
    }
    
    private func exportWorkflow() {
        webViewBridge.executeJavaScript("window.n8n?.exportCurrentWorkflow?.()") { result in
            guard let workflowData = result as? String else { return }
            
            DispatchQueue.main.async {
                let panel = NSSavePanel()
                panel.allowedContentTypes = [.json]
                panel.nameFieldStringValue = "workflow.json"
                
                if panel.runModal() == .OK, let url = panel.url {
                    do {
                        try workflowData.write(to: url, atomically: true, encoding: .utf8)
                    } catch {
                        print("Failed to export workflow: \(error)")
                    }
                }
            }
        }
    }
}

// MARK: - Sidebar View
struct SidebarView: View {
    @EnvironmentObject var workflowManager: WorkflowManager
    @Binding var selectedWorkflow: Workflow?
    @State private var searchText = ""
    
    var filteredWorkflows: [Workflow] {
        if searchText.isEmpty {
            return workflowManager.workflows
        } else {
            return workflowManager.workflows.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Search bar
            SearchField(text: $searchText)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
            
            Divider()
            
            // Workflows list
            List(filteredWorkflows, selection: $selectedWorkflow) { workflow in
                WorkflowRowView(workflow: workflow)
                    .tag(workflow)
            }
            .listStyle(.sidebar)
            
            Divider()
            
            // Bottom toolbar
            HStack {
                Button(action: {
                    NotificationCenter.default.post(name: .newWorkflow, object: nil)
                }) {
                    Image(systemName: "plus")
                }
                .buttonStyle(.borderless)
                
                Spacer()
                
                Button(action: {
                    // Show workflow templates
                }) {
                    Image(systemName: "doc.text.image")
                }
                .buttonStyle(.borderless)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .navigationTitle("Workflows")
    }
}

// MARK: - Workflow Row View
struct WorkflowRowView: View {
    let workflow: Workflow
    @State private var isHovered = false
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(workflow.name)
                    .font(.headline)
                    .foregroundColor(.primary)
                
                Text(workflow.description ?? "No description")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            
            Spacer()
            
            VStack(alignment: .trailing, spacing: 2) {
                if workflow.active {
                    Image(systemName: "play.circle.fill")
                        .foregroundColor(.green)
                        .font(.caption)
                }
                
                Text(workflow.updatedAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
        .background(isHovered ? Color.accentColor.opacity(0.1) : Color.clear)
        .onHover { hovering in
            withAnimation(.easeInOut(duration: 0.1)) {
                isHovered = hovering
            }
        }
    }
}

// MARK: - Toolbar View
struct ToolbarView: View {
    @Binding var isServerRunning: Bool
    let serverPort: Int
    let onNewWorkflow: () -> Void
    let onImportWorkflow: () -> Void
    let onExportWorkflow: () -> Void
    
    var body: some View {
        HStack {
            // Server status
            HStack(spacing: 4) {
                Circle()
                    .fill(isServerRunning ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                
                Text(isServerRunning ? "Server Running" : "Server Stopped")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if isServerRunning {
                    Text(":\(serverPort)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
            
            // Action buttons
            HStack(spacing: 8) {
                Button("New", action: onNewWorkflow)
                    .keyboardShortcut("n", modifiers: [.command])
                
                Button("Import", action: onImportWorkflow)
                    .keyboardShortcut("i", modifiers: [.command])
                
                Button("Export", action: onExportWorkflow)
                    .keyboardShortcut("e", modifiers: [.command])
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color(NSColor.controlBackgroundColor))
        .overlay(
            Divider(),
            alignment: .bottom
        )
    }
}

// MARK: - Search Field
struct SearchField: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search workflows", text: $text)
                .textFieldStyle(.plain)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(6)
    }
}

#Preview {
    ContentView()
        .environmentObject(WorkflowManager())
        .environmentObject(MenuController())
}