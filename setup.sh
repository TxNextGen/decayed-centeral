#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons."
        print_error "Please run as a regular user with sudo privileges."
        exit 1
    fi
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            OS="ubuntu"
        elif command -v yum &> /dev/null; then
            OS="centos"
        elif command -v dnf &> /dev/null; then
            OS="fedora"
        else
            print_error "Unsupported Linux distribution"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    print_status "Detected OS: $OS"
}

install_dependencies() {
    print_header "Installing Dependencies"
    
    case $OS in
        "ubuntu")
            sudo apt-get update
            sudo apt-get install -y curl wget gnupg2 software-properties-common
            ;;
        "centos"|"fedora")
            sudo yum update -y
            sudo yum install -y curl wget gnupg2
            ;;
        "macos")
            if ! command -v brew &> /dev/null; then
                print_status "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew update
            ;;
    esac
}

install_caddy() {
    print_header "Installing Caddy"
    
    case $OS in
        "ubuntu")
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
            curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
            sudo apt-get update
            sudo apt-get install -y caddy
            ;;
        "centos")
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://dl.cloudsmith.io/public/caddy/stable/rpm.repo
            sudo yum install -y caddy
            ;;
        "fedora")
            sudo dnf install -y 'dnf-command(copr)'
            sudo dnf copr enable -y @caddy/caddy
            sudo dnf install -y caddy
            ;;
        "macos")
            brew install caddy
            ;;
    esac
    
    if command -v caddy &> /dev/null; then
        print_status "Caddy installed successfully!"
        caddy version
    else
        print_error "Failed to install Caddy"
        exit 1
    fi
}

setup_nodejs() {
    print_header "Setting up Node.js"
    
    if ! command -v node &> /dev/null; then
        print_status "Installing Node.js..."
        case $OS in
            "ubuntu")
                curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
                sudo apt-get install -y nodejs
                ;;
            "centos"|"fedora")
                curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
                sudo yum install -y nodejs
                ;;
            "macos")
                brew install node
                ;;
        esac
    else
        print_status "Node.js already installed: $(node --version)"
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm not found. Please install npm manually."
        exit 1
    fi
}

install_project_deps() {
    print_header "Installing Project Dependencies"
    
    if [ -f "package.json" ]; then
        npm install
        print_status "Project dependencies installed"
    else
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
}

build_project() {
    print_header "Building Next.js Project"
    
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Project built successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

setup_caddy_config() {
    print_header "Setting up Caddy Configuration"
    
    sudo mkdir -p /etc/caddy
    
    if [ -f "Caddyfile" ]; then
        sudo cp Caddyfile /etc/caddy/Caddyfile
        print_status "Caddyfile copied to /etc/caddy/Caddyfile"
    else
        print_warning "Caddyfile not found. Using default configuration."
        sudo tee /etc/caddy/Caddyfile > /dev/null <<EOF
{
	admin off
	auto_https off
}

:80 {
	root * /usr/share/caddy/public
	try_files {path} {path}.html {path}/index.html /index.html
	
	handle /api/* {
		reverse_proxy localhost:3000
	}
	
	handle /* {
		reverse_proxy localhost:3000
	}
}
EOF
    fi
    
    sudo chown root:root /etc/caddy/Caddyfile
    sudo chmod 644 /etc/caddy/Caddyfile
}

create_nextjs_service() {
    print_header "Creating Next.js Service"
    
    sudo tee /etc/systemd/system/nextjs-app.service > /dev/null <<EOF
[Unit]
Description=Next.js Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    sudo systemctl enable nextjs-app
    print_status "Next.js service created and enabled"
}

create_startup_script() {
    print_header "Creating Startup Script"
    
    cat > start.sh <<'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting Next.js application..."
sudo systemctl start nextjs-app

print_status "Starting Caddy server..."
sudo systemctl start caddy

sleep 3

if sudo systemctl is-active --quiet nextjs-app; then
    print_status "Next.js app is running"
else
    print_error "Next.js app failed to start"
fi

if sudo systemctl is-active --quiet caddy; then
    print_status "Caddy server is running"
else
    print_error "Caddy server failed to start"
fi

print_status "Your site should be available at: http://localhost"
print_status "To check logs:"
print_status "  Next.js: sudo journalctl -u nextjs-app -f"
print_status "  Caddy: sudo journalctl -u caddy -f"
EOF
    
    chmod +x start.sh
    print_status "Startup script created: ./start.sh"
}

create_stop_script() {
    print_header "Creating Stop Script"
    
    cat > stop.sh <<'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Stopping Next.js application..."
sudo systemctl stop nextjs-app

print_status "Stopping Caddy server..."
sudo systemctl stop caddy

print_status "All services stopped"
EOF
    
    chmod +x stop.sh
    print_status "Stop script created: ./stop.sh"
}

main() {
    print_header "Caddy + Next.js Setup Script"
    print_status "This script will set up Caddy and configure your Next.js application"
    
    check_root
    detect_os
    install_dependencies
    install_caddy
    setup_nodejs
    install_project_deps
    build_project
    setup_caddy_config
    create_nextjs_service
    create_startup_script
    create_stop_script
    
    print_header "Setup Complete!"
    print_status "To start your application, run: ./start.sh"
    print_status "To stop your application, run: ./stop.sh"
    print_status ""
    print_status "BYOD Configuration:"
    print_status "1. Add your domain to /etc/caddy/Caddyfile"
    print_status "2. Uncomment and modify the BYOD template section"
    print_status "3. Restart Caddy: sudo systemctl restart caddy"
    print_status ""
    print_status "Your site will be available at: http://localhost"
}

main "$@"
