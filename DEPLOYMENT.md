# Deployment Guide

This guide explains how to deploy the Management Web App on different platforms.

## Ubuntu VPS Deployment

### Prerequisites
- Ubuntu 18.04+ (recommended: Ubuntu 20.04 LTS)
- Root or sudo access
- Internet connection

### Quick Start

1. **Upload your code to the VPS:**
   ```bash
   # Clone the repository
   git clone https://github.com/knoticoo/cmos.git
   cd cmos
   ```

2. **Make the script executable:**
   ```bash
   chmod +x start.sh
   ```

3. **Run the deployment script:**
   ```bash
   # First time - installs everything and starts the app
   ./start.sh
   
   # Or explicitly start
   ./start.sh start
   ```

### Available Commands

```bash
./start.sh start      # Start/restart the application
./start.sh stop       # Stop the application
./start.sh restart    # Restart the application
./start.sh status     # Show application status
./start.sh logs       # Show application logs
./start.sh install    # Install dependencies only
./start.sh help       # Show help message
```

### What the Script Does

1. **System Dependencies:**
   - Updates package list
   - Installs Node.js 18.x
   - Installs PM2 process manager
   - Installs build tools and SQLite

2. **Project Dependencies:**
   - Installs server dependencies (`npm install --production`)
   - Installs client dependencies (`npm install`)
   - Builds the React client (`npm run build`)

3. **Configuration:**
   - Creates `.env` file with default settings
   - Sets up PM2 ecosystem configuration
   - Configures process management

4. **Service Management:**
   - Starts server with PM2
   - Enables auto-restart on crashes
   - Sets up logging
   - Saves PM2 configuration

### Production Configuration

After first deployment, update the `.env` file in the `server` directory:

```bash
nano server/.env
```

**Important settings to change:**
- `JWT_SECRET`: Use a strong, random secret key
- `ADMIN_PASSWORD`: Change from default password
- `ADMIN_EMAIL`: Set your admin email
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`: Add your PayPal credentials
- `CORS_ORIGIN`: Set your domain name

### Monitoring and Logs

```bash
# Check application status
pm2 status

# View logs
pm2 logs cmos-server

# Monitor in real-time
pm2 monit

# Restart application
pm2 restart cmos-server
```

### Nginx Reverse Proxy (Optional)

For production, set up Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/cmos
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/cmos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Windows Deployment

### Prerequisites
- Windows 10/11 or Windows Server
- PowerShell 5.0+
- Internet connection

### Quick Start

1. **Open PowerShell as Administrator**

2. **Navigate to your project directory:**
   ```powershell
   cd C:\path\to\cmos
   ```

3. **Run the deployment script:**
   ```powershell
   # First time - installs everything and starts the app
   .\start.ps1
   
   # Or explicitly start
   .\start.ps1 start
   ```

### Available Commands

```powershell
.\start.ps1 start      # Start/restart the application
.\start.ps1 stop       # Stop the application
.\start.ps1 restart    # Restart the application
.\start.ps1 status     # Show application status
.\start.ps1 install    # Install dependencies only
.\start.ps1 help       # Show help message
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port 5000
   sudo lsof -i :5000
   # Kill the process
   sudo kill -9 <PID>
   ```

2. **Permission denied:**
   ```bash
   # Make script executable
   chmod +x start.sh
   # Or run with bash
   bash start.sh
   ```

3. **Node.js version issues:**
   ```bash
   # Check Node.js version
   node --version
   # Should be 18.x or higher
   ```

4. **PM2 not found:**
   ```bash
   # Install PM2 globally
   sudo npm install -g pm2
   ```

5. **Database issues:**
   ```bash
   # Check if database file exists
   ls -la server/database.sqlite
   # Check permissions
   chmod 664 server/database.sqlite
   ```

### Logs and Debugging

```bash
# Application logs
pm2 logs cmos-server

# System logs
sudo journalctl -u nginx

# Check server status
curl http://localhost:5000/api/health
```

### Security Considerations

1. **Firewall Configuration:**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL Certificate:**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

3. **Regular Updates:**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js dependencies
   cd /path/to/cmos
   npm update
   ```

## Support

If you encounter issues:

1. Check the logs: `pm2 logs cmos-server`
2. Verify all dependencies are installed
3. Check the `.env` configuration
4. Ensure ports are not blocked
5. Verify database file permissions

For additional help, check the project repository or create an issue.
