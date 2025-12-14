#!/bin/bash

# StealthLink Deployment Script
# This script helps deploy the StealthLink Mini App to various platforms

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        print_status "Copy .env.example to .env and configure your settings"
        exit 1
    fi
    
    # Check required environment variables
    if ! grep -q "BOT_TOKEN=.*[^[:space:]]" .env; then
        print_error "BOT_TOKEN not configured in .env"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if command_exists npm; then
        npm install
    elif command_exists yarn; then
        yarn install
    else
        print_error "Neither npm nor yarn found. Please install Node.js and npm."
        exit 1
    fi
    
    print_success "Dependencies installed"
}

# Function to run health check
health_check() {
    print_status "Running health check..."
    
    # Start server in background
    node bot-server.js &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 5
    
    # Check health endpoint
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null || true
    sleep 2
}

# Function to deploy to Docker
deploy_docker() {
    print_status "Deploying with Docker..."
    
    if ! command_exists docker; then
        print_error "Docker not found. Please install Docker."
        exit 1
    fi
    
    # Build image
    docker build -t stealth-chat .
    
    # Run container
    docker run -d \
        --name stealth-chat \
        --env-file .env \
        -p 3000:3000 \
        -p 3001:3001 \
        --restart unless-stopped \
        stealth-chat
    
    print_success "Docker deployment completed"
    print_status "Container is running. Check logs with: docker logs stealth-chat"
}

# Function to deploy to Docker Compose
deploy_docker_compose() {
    print_status "Deploying with Docker Compose..."
    
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    # Build and start services
    docker-compose up -d --build
    
    print_success "Docker Compose deployment completed"
    print_status "Services are running. Check status with: docker-compose ps"
}

# Function to deploy to PM2
deploy_pm2() {
    print_status "Deploying with PM2..."
    
    if ! command_exists pm2; then
        print_error "PM2 not found. Installing PM2..."
        npm install -g pm2
    fi
    
    # Start with PM2
    pm2 start bot-server.js --name stealth-chat
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup
    
    print_success "PM2 deployment completed"
    print_status "Monitor with: pm2 monit"
}

# Function to deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command_exists heroku; then
        print_error "Heroku CLI not found. Please install Heroku CLI."
        exit 1
    fi
    
    # Login to Heroku
    heroku login
    
    # Create app if it doesn't exist
    if ! heroku apps:info >/dev/null 2>&1; then
        heroku create stealth-chat-$(date +%s)
    fi
    
    # Set environment variables
    heroku config:set NODE_ENV=production
    
    # Deploy
    git add .
    git commit -m "Deploy StealthLink Mini App" || true
    git push heroku main
    
    print_success "Heroku deployment completed"
}

# Function to setup nginx
setup_nginx() {
    print_status "Setting up nginx configuration..."
    
    # Create nginx config
    sudo tee /etc/nginx/sites-available/stealth-chat > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/stealth-chat /etc/nginx/sites-enabled/
    
    # Test nginx configuration
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    
    print_success "Nginx configuration completed"
    print_warning "Remember to update SSL certificate paths and domain name"
}

# Function to setup SSL with Let's Encrypt
setup_ssl() {
    print_status "Setting up SSL with Let's Encrypt..."
    
    if ! command_exists certbot; then
        print_error "Certbot not found. Installing..."
        sudo apt update
        sudo apt install certbot python3-certbot-nginx -y
    fi
    
    # Get SSL certificate
    sudo certbot --nginx -d your-domain.com
    
    # Setup auto-renewal
    sudo crontab -l | grep -q certbot || (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    print_success "SSL certificate configured"
}

# Function to show usage
show_usage() {
    echo "StealthLink Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  install     Install dependencies and validate environment"
    echo "  docker      Deploy using Docker"
    echo "  compose     Deploy using Docker Compose"
    echo "  pm2         Deploy using PM2"
    echo "  heroku      Deploy to Heroku"
    echo "  nginx       Setup nginx configuration"
    echo "  ssl         Setup SSL with Let's Encrypt"
    echo "  health      Run health check"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 install"
    echo "  $0 docker"
    echo "  $0 compose"
}

# Main script logic
case "${1:-}" in
    "install")
        validate_environment
        install_dependencies
        health_check
        ;;
    "docker")
        validate_environment
        deploy_docker
        ;;
    "compose")
        validate_environment
        deploy_docker_compose
        ;;
    "pm2")
        validate_environment
        install_dependencies
        deploy_pm2
        ;;
    "heroku")
        deploy_heroku
        ;;
    "nginx")
        setup_nginx
        ;;
    "ssl")
        setup_ssl
        ;;
    "health")
        health_check
        ;;
    "help"|"--help"|"-h")
        show_usage
        ;;
    "")
        print_error "No command specified"
        show_usage
        exit 1
        ;;
    *)
        print_error "Unknown command: $1"
        show_usage
        exit 1
        ;;
esac

print_success "Deployment script completed!"