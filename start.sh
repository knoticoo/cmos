#!/bin/bash

# Management Web App - Ubuntu VPS Startup Script
# This script installs dependencies, starts services in background, and handles restarts

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
PID_FILE="$PROJECT_DIR/.app.pid"
LOG_FILE="$PROJECT_DIR/app.log"

# Function to print colored output
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if process is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Function to stop existing processes
stop_services() {
    print_status "Checking for running services..."
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        print_warning "Found running process (PID: $pid). Stopping..."
        kill "$pid" 2>/dev/null || true
        sleep 2
        
        # Force kill if still running
        if ps -p "$pid" > /dev/null 2>&1; then
            print_warning "Force killing process..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        
        rm -f "$PID_FILE"
        print_success "Services stopped"
    else
        print_status "No running services found"
    fi
}

# Function to install system dependencies
install_system_deps() {
    print_status "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update -y
    
    # Install Node.js 18.x
    if ! command_exists node; then
        print_status "Installing Node.js 18.x..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        local node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            print_warning "Node.js version $node_version detected. Upgrading to 18.x..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            print_success "Node.js $(node --version) already installed"
        fi
    fi
    
    # Install PM2 globally for process management
    if ! command_exists pm2; then
        print_status "Installing PM2 process manager..."
        sudo npm install -g pm2
    else
        print_success "PM2 already installed"
    fi
    
    # Install other system dependencies
    print_status "Installing additional system dependencies..."
    sudo apt-get install -y build-essential sqlite3 git curl wget
    
    print_success "System dependencies installed"
}

# Function to install project dependencies
install_project_deps() {
    print_status "Installing project dependencies..."
    
    # Install server dependencies
    if [ -d "$SERVER_DIR" ]; then
        print_status "Installing server dependencies..."
        cd "$SERVER_DIR"
        npm install --production
        cd "$PROJECT_DIR"
    fi
    
    # Install client dependencies
    if [ -d "$CLIENT_DIR" ]; then
        print_status "Installing client dependencies..."
        cd "$CLIENT_DIR"
        npm install
        npm run build
        cd "$PROJECT_DIR"
    fi
    
    print_success "Project dependencies installed"
}

# Function to create environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f "$SERVER_DIR/.env" ]; then
        print_status "Creating .env file..."
        cat > "$SERVER_DIR/.env" << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_PATH=./database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@example.com

# PayPal Configuration (Optional)
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
EOF
        print_warning "Created default .env file. Please update with your actual configuration!"
    else
        print_success "Environment file already exists"
    fi
}

# Function to start services
start_services() {
    print_status "Starting services..."
    
    # Create PM2 ecosystem file
    cat > "$PROJECT_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'cmos-server',
      script: './server/index.js',
      cwd: '$PROJECT_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '$LOG_FILE',
      out_file: '$LOG_FILE',
      log_file: '$LOG_FILE',
      time: true
    }
  ]
};
EOF

    # Start server with PM2
    cd "$PROJECT_DIR"
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is running
    if pm2 list | grep -q "cmos-server.*online"; then
        print_success "Services started successfully!"
        print_status "Server running on: http://localhost:5000"
        print_status "Client build available in: $CLIENT_DIR/build"
        print_status "Logs: $LOG_FILE"
        print_status "PM2 Status: pm2 status"
        print_status "PM2 Logs: pm2 logs cmos-server"
    else
        print_error "Failed to start services. Check logs: pm2 logs cmos-server"
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Application Status:"
    echo "===================="
    
    if pm2 list | grep -q "cmos-server"; then
        pm2 list
        echo ""
        print_status "Recent logs:"
        pm2 logs cmos-server --lines 10
    else
        print_warning "No services running"
    fi
}

# Function to show help
show_help() {
    echo "Management Web App - Ubuntu VPS Startup Script"
    echo "=============================================="
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  start     Start/restart the application (default)"
    echo "  stop      Stop the application"
    echo "  restart   Restart the application"
    echo "  status    Show application status"
    echo "  logs      Show application logs"
    echo "  install   Install dependencies only"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                # Start/restart application"
    echo "  $0 start          # Start/restart application"
    echo "  $0 stop           # Stop application"
    echo "  $0 status         # Show status"
    echo "  $0 logs           # Show logs"
}

# Main script logic
main() {
    local action="${1:-start}"
    
    case "$action" in
        "start"|"restart")
            print_status "Starting Management Web App..."
            stop_services
            install_system_deps
            install_project_deps
            setup_environment
            start_services
            show_status
            ;;
        "stop")
            print_status "Stopping Management Web App..."
            pm2 stop cmos-server 2>/dev/null || true
            pm2 delete cmos-server 2>/dev/null || true
            print_success "Application stopped"
            ;;
        "status")
            show_status
            ;;
        "logs")
            if pm2 list | grep -q "cmos-server"; then
                pm2 logs cmos-server --lines 50
            else
                print_warning "No services running"
            fi
            ;;
        "install")
            print_status "Installing dependencies only..."
            install_system_deps
            install_project_deps
            setup_environment
            print_success "Dependencies installed. Run '$0 start' to start the application."
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown option: $action"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
