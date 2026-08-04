# 🚀 AWS Deployment & GitHub Actions Pipeline Setup Guide

This guide details how to automatically build and deploy **ForenSecure** to your **AWS EC2** instance whenever code is pushed to the `main` branch on GitHub repository [`https://github.com/iamsannybharti/ForenSecure`](https://github.com/iamsannybharti/ForenSecure).

---

## 1. 🔑 GitHub Secrets Configuration

Before triggering the pipeline, go to your GitHub repository:
**Repository Settings ➔ Secrets and variables ➔ Actions ➔ New repository secret**

Add the following 3 Secrets:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `EC2_HOST` | Public IP Address or Domain of your AWS EC2 instance | `13.235.120.45` or `ec2-13-235-120-45.ap-south-1.compute.amazonaws.com` |
| `EC2_USERNAME` | SSH User for your EC2 AMI instance | `ubuntu` (for Ubuntu) or `ec2-user` (for Amazon Linux) |
| `EC2_SSH_KEY` | Entire content of your AWS `.pem` private key file | `-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----` |

---

## 2. ⚡ One-Time AWS EC2 Server Initial Setup

Run the following commands ONCE on your AWS EC2 instance terminal to install Node.js 20, Nginx, PM2, and Git:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git pm2

# 3. Install PM2 globally for background process management
sudo npm install -g pm2
sudo pm2 startup

# 4. Create web directory
sudo mkdir -p /var/www/forensecure
sudo chown -R $USER:$USER /var/www/forensecure

# 5. Clone repository
git clone https://github.com/iamsannybharti/ForenSecure.git /var/www/forensecure
```

---

## 3. 🌐 Nginx Configuration for Frontend & API Reverse Proxy

Edit Nginx site configuration on AWS:

```bash
sudo nano /etc/nginx/sites-available/forensecure
```

Paste the following configuration:

```nginx
server {
    listen 80;
    server_name _; # Replace with your domain name e.g. forensecure.edu.in

    # Frontend Static Distribution
    location / {
        root /var/www/forensecure/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/forensecure /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. 🔄 How the Automatic CI/CD Pipeline Works

1. You make changes locally and push to GitHub:
   ```bash
   git add .
   git commit -m "Upgrade feature"
   git push origin main
   ```
2. GitHub Actions automatically triggers [.github/workflows/deploy.yml](file:///d:/FS_Figma/.github/workflows/deploy.yml).
3. The workflow builds the React frontend and TypeScript Express backend.
4. It connects securely to AWS EC2 via SSH, pulls the latest code, and restarts the backend process using PM2.
