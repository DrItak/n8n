import SwiftUI
import Combine
import Foundation
import OSLog

// MARK: - Workflow Model
struct Workflow: Identifiable, Codable, Hashable {
    let id: String
    var name: String
    var description: String?
    var active: Bool
    var nodes: [WorkflowNode]
    var connections: [WorkflowConnection]
    var createdAt: Date
    var updatedAt: Date
    
    init(id: String = UUID().uuidString, name: String, description: String? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.active = false
        self.nodes = []
        self.connections = []
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

struct WorkflowNode: Identifiable, Codable, Hashable {
    let id: String
    let type: String
    var name: String
    var parameters: [String: AnyCodable]
    var position: CGPoint
    
    init(id: String = UUID().uuidString, type: String, name: String, position: CGPoint = .zero) {
        self.id = id
        self.type = type
        self.name = name
        self.parameters = [:]
        self.position = position
    }
}

struct WorkflowConnection: Identifiable, Codable, Hashable {
    let id: String
    let sourceNodeId: String
    let targetNodeId: String
    let sourceOutput: String?
    let targetInput: String?
    
    init(id: String = UUID().uuidString, sourceNodeId: String, targetNodeId: String, sourceOutput: String? = nil, targetInput: String? = nil) {
        self.id = id
        self.sourceNodeId = sourceNodeId
        self.targetNodeId = targetNodeId
        self.sourceOutput = sourceOutput
        self.targetInput = targetInput
    }
}

// MARK: - AnyCodable Helper
struct AnyCodable: Codable, Hashable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            throw DecodingError.dataCorrupted(.init(codingPath: decoder.codingPath, debugDescription: "Unsupported type"))
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map(AnyCodable.init))
        case let dict as [String: Any]:
            try container.encode(dict.mapValues(AnyCodable.init))
        default:
            throw EncodingError.invalidValue(value, .init(codingPath: encoder.codingPath, debugDescription: "Unsupported type"))
        }
    }
    
    func hash(into hasher: inout Hasher) {
        switch value {
        case let bool as Bool:
            hasher.combine(bool)
        case let int as Int:
            hasher.combine(int)
        case let double as Double:
            hasher.combine(double)
        case let string as String:
            hasher.combine(string)
        default:
            hasher.combine(0)
        }
    }
    
    static func == (lhs: AnyCodable, rhs: AnyCodable) -> Bool {
        switch (lhs.value, rhs.value) {
        case (let l as Bool, let r as Bool):
            return l == r
        case (let l as Int, let r as Int):
            return l == r
        case (let l as Double, let r as Double):
            return l == r
        case (let l as String, let r as String):
            return l == r
        default:
            return false
        }
    }
}

// MARK: - WorkflowManager
@MainActor
class WorkflowManager: ObservableObject {
    @Published var workflows: [Workflow] = []
    @Published var isServerRunning = false
    @Published var serverPort = 5678
    @Published var serverProcess: Process?
    
    private let logger = Logger(subsystem: "io.n8n.macos", category: "WorkflowManager")
    private var cancellables = Set<AnyCancellable>()
    private let fileManager = FileManager.default
    
    // Paths
    private var applicationSupportURL: URL {
        let urls = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)
        let appSupportURL = urls[0].appendingPathComponent("n8n-macos", isDirectory: true)
        
        // Create directory if it doesn't exist
        if !fileManager.fileExists(atPath: appSupportURL.path) {
            try? fileManager.createDirectory(at: appSupportURL, withIntermediateDirectories: true)
        }
        
        return appSupportURL
    }
    
    private var workflowsURL: URL {
        applicationSupportURL.appendingPathComponent("workflows", isDirectory: true)
    }
    
    private var n8nDataURL: URL {
        applicationSupportURL.appendingPathComponent("n8n-data", isDirectory: true)
    }
    
    init() {
        setupDirectories()
        loadWorkflows()
        setupServerMonitoring()
    }
    
    deinit {
        stopServer()
    }
    
    private func setupDirectories() {
        // Create necessary directories
        [workflowsURL, n8nDataURL].forEach { url in
            if !fileManager.fileExists(atPath: url.path) {
                try? fileManager.createDirectory(at: url, withIntermediateDirectories: true)
            }
        }
    }
    
    private func setupServerMonitoring() {
        // Monitor server process
        Timer.publish(every: 5.0, on: .main, in: .common)
            .autoconnect()
            .sink { [weak self] _ in
                self?.checkServerStatus()
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Server Management
    func startServer(port: Int = 5678) async throws {
        guard !isServerRunning else { return }
        
        self.serverPort = port
        
        // Check if n8n is installed globally
        let n8nPath = await findN8NExecutable()
        guard !n8nPath.isEmpty else {
            throw WorkflowManagerError.n8nNotFound
        }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: n8nPath)
        process.arguments = [
            "start",
            "--port", String(port),
            "--host", "127.0.0.1",
            "--userFolder", n8nDataURL.path
        ]
        
        // Set environment variables
        var environment = ProcessInfo.processInfo.environment
        environment["N8N_USER_FOLDER"] = n8nDataURL.path
        environment["N8N_CONFIG_FILES"] = n8nDataURL.appendingPathComponent("config").path
        environment["N8N_DISABLE_UI"] = "false"
        environment["N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN"] = "true"
        process.environment = environment
        
        // Setup pipes for output
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        process.standardOutput = outputPipe
        process.standardError = errorPipe
        
        // Monitor output
        outputPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if !data.isEmpty, let output = String(data: data, encoding: .utf8) {
                self?.logger.info("n8n output: \(output)")
            }
        }
        
        errorPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if !data.isEmpty, let output = String(data: data, encoding: .utf8) {
                self?.logger.error("n8n error: \(output)")
            }
        }
        
        try process.run()
        self.serverProcess = process
        self.isServerRunning = true
        
        logger.info("n8n server started on port \(port)")
        
        // Wait for server to be ready
        try await waitForServerReady(port: port)
    }
    
    func stopServer() {
        guard let process = serverProcess, isServerRunning else { return }
        
        process.terminate()
        process.waitUntilExit()
        
        serverProcess = nil
        isServerRunning = false
        
        logger.info("n8n server stopped")
    }
    
    private func findN8NExecutable() async -> String {
        // Try common locations for n8n
        let possiblePaths = [
            "/usr/local/bin/n8n",
            "/opt/homebrew/bin/n8n",
            Bundle.main.path(forResource: "n8n", ofType: nil) ?? "",
            Bundle.main.resourcePath?.appending("/n8n") ?? ""
        ]
        
        for path in possiblePaths {
            if fileManager.isExecutableFile(atPath: path) {
                return path
            }
        }
        
        // Try to find via which command
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        process.arguments = ["n8n"]
        
        let pipe = Pipe()
        process.standardOutput = pipe
        
        do {
            try process.run()
            process.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readToEndOfFile()
            if let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines),
               !path.isEmpty {
                return path
            }
        } catch {
            logger.error("Failed to find n8n executable: \(error)")
        }
        
        return ""
    }
    
    private func waitForServerReady(port: Int, timeout: TimeInterval = 30) async throws {
        let startTime = Date()
        
        while Date().timeIntervalSince(startTime) < timeout {
            do {
                let url = URL(string: "http://localhost:\(port)/healthz")!
                let (_, response) = try await URLSession.shared.data(from: url)
                
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    logger.info("n8n server is ready")
                    return
                }
            } catch {
                // Server not ready yet, continue waiting
            }
            
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
        }
        
        throw WorkflowManagerError.serverStartupTimeout
    }
    
    private func checkServerStatus() {
        guard let process = serverProcess else {
            isServerRunning = false
            return
        }
        
        isServerRunning = process.isRunning
    }
    
    // MARK: - Workflow Management
    func loadWorkflows() {
        guard fileManager.fileExists(atPath: workflowsURL.path) else {
            workflows = createSampleWorkflows()
            saveWorkflows()
            return
        }
        
        do {
            let workflowFiles = try fileManager.contentsOfDirectory(at: workflowsURL, includingPropertiesForKeys: nil)
            let jsonFiles = workflowFiles.filter { $0.pathExtension == "json" }
            
            var loadedWorkflows: [Workflow] = []
            
            for file in jsonFiles {
                do {
                    let data = try Data(contentsOf: file)
                    let workflow = try JSONDecoder().decode(Workflow.self, from: data)
                    loadedWorkflows.append(workflow)
                } catch {
                    logger.error("Failed to load workflow from \(file.lastPathComponent): \(error)")
                }
            }
            
            workflows = loadedWorkflows.sorted { $0.updatedAt > $1.updatedAt }
            
        } catch {
            logger.error("Failed to load workflows: \(error)")
            workflows = createSampleWorkflows()
        }
    }
    
    func saveWorkflows() {
        for workflow in workflows {
            saveWorkflow(workflow)
        }
    }
    
    func saveWorkflow(_ workflow: Workflow) {
        let fileURL = workflowsURL.appendingPathComponent("\(workflow.id).json")
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = .prettyPrinted
            
            let data = try encoder.encode(workflow)
            try data.write(to: fileURL)
            
            logger.info("Saved workflow: \(workflow.name)")
        } catch {
            logger.error("Failed to save workflow \(workflow.name): \(error)")
        }
    }
    
    func deleteWorkflow(_ workflow: Workflow) {
        let fileURL = workflowsURL.appendingPathComponent("\(workflow.id).json")
        
        do {
            try fileManager.removeItem(at: fileURL)
            workflows.removeAll { $0.id == workflow.id }
            logger.info("Deleted workflow: \(workflow.name)")
        } catch {
            logger.error("Failed to delete workflow \(workflow.name): \(error)")
        }
    }
    
    func createWorkflow(name: String, description: String? = nil) -> Workflow {
        var workflow = Workflow(name: name, description: description)
        workflow.updatedAt = Date()
        
        workflows.insert(workflow, at: 0)
        saveWorkflow(workflow)
        
        return workflow
    }
    
    private func createSampleWorkflows() -> [Workflow] {
        let welcomeWorkflow = Workflow(
            name: "Welcome to n8n",
            description: "A sample workflow to get you started with automation"
        )
        
        let emailWorkflow = Workflow(
            name: "Email Notification System",
            description: "Automatically send email notifications based on triggers"
        )
        
        return [welcomeWorkflow, emailWorkflow]
    }
}

// MARK: - Errors
enum WorkflowManagerError: LocalizedError {
    case n8nNotFound
    case serverStartupTimeout
    case serverAlreadyRunning
    
    var errorDescription: String? {
        switch self {
        case .n8nNotFound:
            return "n8n executable not found. Please install n8n using 'npm install -g n8n' or download from n8n.io"
        case .serverStartupTimeout:
            return "n8n server failed to start within the timeout period"
        case .serverAlreadyRunning:
            return "n8n server is already running"
        }
    }
    
    var recoverySuggestion: String? {
        switch self {
        case .n8nNotFound:
            return "Install n8n globally using npm or download the standalone version"
        case .serverStartupTimeout:
            return "Check the logs for more information about why the server failed to start"
        case .serverAlreadyRunning:
            return "Stop the existing server before starting a new one"
        }
    }
}