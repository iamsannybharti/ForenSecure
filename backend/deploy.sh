#!/bin/bash
# ForenSecure - EC2 Backend Setup Script
# Run as: chmod +x deploy.sh && sudo ./deploy.sh

set -e

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== Installing PostgreSQL ==="
apt-get install -y postgresql postgresql-contrib

echo "=== Starting PostgreSQL ==="
systemctl enable postgresql
systemctl start postgresql

echo "=== Installing Nginx ==="
apt-get install -y nginx

echo "=== Writing Nginx config ==="
cat > /etc/nginx/sites-available/forensecure << 'EOF'
server {
    listen 80;
    server_name _;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files
    location /uploads/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/forensecure /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "=== Done! Next steps ==="
echo "1. Clone your repo: git clone https://github.com/iamsannybharti/ForenSecure.git /app"
echo "2. cd /app/backend"
echo "3. Create .env with your DB credentials (see .env.example)"
echo "4. npm install && npm run build"
echo "5. pm2 start ecosystem.config.js --env production"
echo "6. pm2 save && pm2 startup"
echo ""
echo "PostgreSQL setup:"
echo "  sudo -u postgres psql"
echo "  CREATE USER forensecure WITH PASSWORD 'yourpassword';"
echo "  CREATE DATABASE forensecure OWNER forensecure;"
echo "  \q"
