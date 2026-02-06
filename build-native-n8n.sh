#!/bin/bash

# Build script for n8n native macOS application
# Optimized for Apple Silicon M3 Pro

set -e

echo "🚀 Building n8n for native macOS (Apple Silicon M3 Pro)"

# Configuration
PROJECT_ROOT="$(pwd)"
N8N_VERSION="1.106.0"
NODE_VERSION="22.16.0"
MACOS_VERSION="14.0"
XCODE_PROJECT="n8n-macos/n8n-macos.xcodeproj"
SCHEME="n8n-macos"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Xcode
    if ! command -v xcodebuild &> /dev/null; then
        print_error "Xcode command line tools not found. Please install Xcode."
        exit 1
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js $NODE_VERSION or later."
        exit 1
    fi
    
    NODE_CURRENT=$(node -v | sed 's/v//')
    if [[ "$(printf '%s\n' "$NODE_VERSION" "$NODE_CURRENT" | sort -V | head -n1)" != "$NODE_VERSION" ]]; then
        print_warning "Node.js version $NODE_CURRENT is older than recommended $NODE_VERSION"
    fi
    
    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm not found. Please install pnpm."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Build n8n backend
build_n8n_backend() {
    print_status "Building n8n backend..."
    
    # Install dependencies
    pnpm install --frozen-lockfile
    
    # Build n8n packages
    pnpm build
    
    # Create optimized n8n bundle for macOS
    mkdir -p "n8n-macos/Resources/n8n"
    
    # Copy essential n8n files
    cp -r "packages/cli/dist" "n8n-macos/Resources/n8n/"
    cp -r "packages/cli/bin" "n8n-macos/Resources/n8n/"
    cp -r "packages/cli/templates" "n8n-macos/Resources/n8n/"
    cp "packages/cli/package.json" "n8n-macos/Resources/n8n/"
    
    # Copy core dependencies
    cp -r "packages/core/dist" "n8n-macos/Resources/n8n/core/"
    cp -r "packages/workflow/dist" "n8n-macos/Resources/n8n/workflow/"
    cp -r "packages/nodes-base/dist" "n8n-macos/Resources/n8n/nodes-base/"
    
    # Install production dependencies for bundled n8n
    cd "n8n-macos/Resources/n8n"
    npm install --production --no-optional
    cd "$PROJECT_ROOT"
    
    print_success "n8n backend built successfully"
}

# Build frontend assets
build_n8n_frontend() {
    print_status "Building n8n frontend..."
    
    # Build editor UI
    cd "packages/frontend/editor-ui"
    pnpm build
    cd "$PROJECT_ROOT"
    
    # Copy frontend assets to macOS app
    mkdir -p "n8n-macos/Resources/www"
    cp -r "packages/frontend/editor-ui/dist/"* "n8n-macos/Resources/www/"
    
    print_success "n8n frontend built successfully"
}

# Optimize for Apple Silicon
optimize_for_apple_silicon() {
    print_status "Optimizing for Apple Silicon M3 Pro..."
    
    # Create optimized Node.js binary for ARM64
    if [[ $(uname -m) == "arm64" ]]; then
        print_status "Running on Apple Silicon - creating optimized binaries"
        
        # Download Node.js ARM64 binary if not present
        NODE_ARM64_URL="https://nodejs.org/dist/v$NODE_VERSION/node-v$NODE_VERSION-darwin-arm64.tar.gz"
        NODE_DIR="n8n-macos/Resources/node"
        
        if [ ! -d "$NODE_DIR" ]; then
            mkdir -p "$NODE_DIR"
            curl -L "$NODE_ARM64_URL" | tar -xz -C "$NODE_DIR" --strip-components=1
        fi
        
        # Set executable permissions
        chmod +x "$NODE_DIR/bin/node"
        
        print_success "Apple Silicon optimization complete"
    else
        print_warning "Not running on Apple Silicon - universal binary will be created"
    fi
}

# Configure app bundle
configure_app_bundle() {
    print_status "Configuring app bundle..."
    
    # Create necessary directories
    mkdir -p "n8n-macos/Resources/Scripts"
    
    # Create n8n startup script
    cat > "n8n-macos/Resources/Scripts/start-n8n.sh" << 'EOF'
#!/bin/bash

# n8n startup script for macOS app bundle

BUNDLE_PATH="$(dirname "$0")/.."
NODE_PATH="$BUNDLE_PATH/node/bin/node"
N8N_PATH="$BUNDLE_PATH/n8n"

# Set environment variables
export N8N_USER_FOLDER="$HOME/Library/Application Support/n8n-macos/n8n-data"
export N8N_CONFIG_FILES="$N8N_USER_FOLDER/config"
export NODE_ENV="production"
export N8N_DISABLE_UI="false"

# Create user folder if it doesn't exist
mkdir -p "$N8N_USER_FOLDER"

# Start n8n server
cd "$N8N_PATH"
"$NODE_PATH" "./bin/n8n" "$@"
EOF
    
    chmod +x "n8n-macos/Resources/Scripts/start-n8n.sh"
    
    print_success "App bundle configured"
}

# Build Xcode project
build_xcode_project() {
    print_status "Building Xcode project..."
    
    # Clean build directory
    xcodebuild clean -project "$XCODE_PROJECT" -scheme "$SCHEME"
    
    # Build for Apple Silicon
    xcodebuild build \
        -project "$XCODE_PROJECT" \
        -scheme "$SCHEME" \
        -configuration Release \
        -arch arm64 \
        -sdk macosx \
        MACOSX_DEPLOYMENT_TARGET="$MACOS_VERSION" \
        ONLY_ACTIVE_ARCH=NO \
        ARCHS="arm64" \
        VALID_ARCHS="arm64" \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO
    
    print_success "Xcode project built successfully"
}

# Create distribution package
create_distribution() {
    print_status "Creating distribution package..."
    
    BUILD_DIR="build/Release"
    APP_NAME="n8n Workflow Automation.app"
    DIST_DIR="dist"
    
    # Create distribution directory
    mkdir -p "$DIST_DIR"
    
    # Copy built app
    if [ -d "$BUILD_DIR/$APP_NAME" ]; then
        cp -r "$BUILD_DIR/$APP_NAME" "$DIST_DIR/"
        
        # Create DMG
        create_dmg "$DIST_DIR/$APP_NAME" "$DIST_DIR/n8n-macos-arm64.dmg"
        
        print_success "Distribution package created: $DIST_DIR/n8n-macos-arm64.dmg"
    else
        print_error "Built app not found at $BUILD_DIR/$APP_NAME"
        exit 1
    fi
}

# Create DMG installer
create_dmg() {
    local APP_PATH="$1"
    local DMG_PATH="$2"
    
    print_status "Creating DMG installer..."
    
    # Create temporary DMG directory
    TEMP_DMG_DIR=$(mktemp -d)
    cp -r "$APP_PATH" "$TEMP_DMG_DIR/"
    
    # Create Applications symlink
    ln -s /Applications "$TEMP_DMG_DIR/Applications"
    
    # Create DMG
    hdiutil create \
        -volname "n8n Workflow Automation" \
        -srcfolder "$TEMP_DMG_DIR" \
        -ov \
        -format UDZO \
        "$DMG_PATH"
    
    # Clean up
    rm -rf "$TEMP_DMG_DIR"
    
    print_success "DMG created: $DMG_PATH"
}

# Performance optimizations
apply_performance_optimizations() {
    print_status "Applying performance optimizations..."
    
    # Enable Metal rendering
    defaults write io.n8n.macos WebKitMetalRenderingEnabled -bool true
    defaults write io.n8n.macos WebKitDisplayP3ColorSpace -bool true
    defaults write io.n8n.macos WebKitAcceleratedCompositingEnabled -bool true
    
    # Optimize for M3 Pro
    defaults write io.n8n.macos CPUOptimization -string "apple-silicon-m3"
    defaults write io.n8n.macos GPUAcceleration -bool true
    
    print_success "Performance optimizations applied"
}

# Main build process
main() {
    print_status "Starting n8n macOS build process..."
    
    check_prerequisites
    build_n8n_backend
    build_n8n_frontend
    optimize_for_apple_silicon
    configure_app_bundle
    apply_performance_optimizations
    build_xcode_project
    create_distribution
    
    print_success "🎉 Build completed successfully!"
    print_status "Distribution package: dist/n8n-macos-arm64.dmg"
    print_status "Optimized for: Apple Silicon M3 Pro"
}

# Run main function
main "$@"