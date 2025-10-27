// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "n8n-macos",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "n8n-macos",
            targets: ["n8n-macos"]
        ),
    ],
    dependencies: [
        // Apple Silicon Performance Optimizations
        .package(url: "https://github.com/apple/swift-log.git", from: "1.0.0"),
        .package(url: "https://github.com/apple/swift-metrics.git", from: "2.0.0"),
        
        // WebKit Enhancements
        .package(url: "https://github.com/sindresorhus/Preferences", from: "3.0.0"),
        
        // System Integration
        .package(url: "https://github.com/sindresorhus/LaunchAtLogin", from: "5.0.0"),
        .package(url: "https://github.com/sindresorhus/KeyboardShortcuts", from: "2.0.0"),
        
        // Performance Monitoring
        .package(url: "https://github.com/apple/swift-system", from: "1.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "n8n-macos",
            dependencies: [
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Metrics", package: "swift-metrics"),
                .product(name: "Preferences", package: "Preferences"),
                .product(name: "LaunchAtLogin", package: "LaunchAtLogin"),
                .product(name: "KeyboardShortcuts", package: "KeyboardShortcuts"),
                .product(name: "SystemPackage", package: "swift-system"),
            ],
            swiftSettings: [
                // Enable whole module optimization for release builds
                .unsafeFlags(["-whole-module-optimization"], .when(configuration: .release)),
                
                // Apple Silicon specific optimizations
                .unsafeFlags(["-target", "arm64-apple-macos14.0"], .when(platforms: [.macOS])),
                
                // Enable strict concurrency checking
                .enableExperimentalFeature("StrictConcurrency"),
                
                // Performance optimizations
                .unsafeFlags(["-O"], .when(configuration: .release)),
                .unsafeFlags(["-Osize"], .when(configuration: .release)),
            ],
            linkerSettings: [
                // Link against Metal framework for GPU acceleration
                .linkedFramework("Metal"),
                .linkedFramework("MetalKit"),
                .linkedFramework("MetalPerformanceShaders"),
                
                // Core Animation for smooth animations
                .linkedFramework("QuartzCore"),
                
                // Core Spotlight for search integration
                .linkedFramework("CoreSpotlight"),
                
                // User Notifications
                .linkedFramework("UserNotifications"),
                
                // WebKit optimizations
                .linkedFramework("WebKit"),
                
                // System frameworks
                .linkedFramework("SystemConfiguration"),
                .linkedFramework("IOKit"),
                
                // Accelerate framework for mathematical operations
                .linkedFramework("Accelerate"),
                
                // Core ML for potential AI features
                .linkedFramework("CoreML"),
                
                // Vision framework for image processing
                .linkedFramework("Vision"),
            ]
        ),
        .testTarget(
            name: "n8n-macosTests",
            dependencies: ["n8n-macos"]
        ),
    ]
)

// Compiler optimizations for Apple Silicon
#if arch(arm64)
package.targets.forEach { target in
    if target.type == .executable || target.type == .regular {
        target.swiftSettings = (target.swiftSettings ?? []) + [
            // Enable ARM64 specific optimizations
            .define("APPLE_SILICON"),
            .define("ARM64_OPTIMIZED"),
            
            // Enable NEON SIMD instructions
            .unsafeFlags(["-mcpu=apple-m3"]),
            
            // Optimize for M3 Pro specific features
            .unsafeFlags(["-mtune=apple-m3"]),
        ]
    }
}
#endif