# Farmer Data Source Deployment Guide

This guide will help you deploy the Farmer Audio Recording Server to your production server at `196.43.168.57:8086` with automated GitHub Actions deployment.

---

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ Docker installed on the server
2. ✅ Docker volumes created on the server
3. ✅ Firewall port 8086 opened
4. ✅ GitHub Secrets configured
5. ✅ Public exposure method ready (ngrok or Cloudflare Tunnel)

---

## 🚀 Deployment Steps

### Step 1: Prepare the Server

SSH into your server and prepare the environment:

```bash
# SSH into the server
ssh ademneadev@196.43.168.57

# Create Docker volumes for persistent storage
docker volume create farmer-recordings
docker volume create farmer-data

# Open firewall port 8086
sudo ufw allow 8086/tcp

# Verify firewall status
sudo ufw status

# Exit SSH
exit
```

---

### Step 2: Configure GitHub Secrets

You need to add ONE new GitHub Secret for this deployment. The other secrets are already configured from your main BSADS API deployment.

#### Required GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

**New Secret to Add:**

| Secret Name          | Value                                           | How to Generate                  |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| `FARMER_ADMIN_KEY`   | A secure random string (e.g., 64 characters)    | `openssl rand -hex 32`           |

**Already Configured (from main BSADS deployment):**

| Secret Name           | Description                        |
| --------------------- | ---------------------------------- |
| `DOCKERHUB_USERNAME`  | Your Docker Hub username           |
| `DOCKERHUB_TOKEN`     | Your Docker Hub access token       |
| `SERVER_PASSWORD`     | Server SSH password (Ademneadev@26)|

#### Generate the Admin Key

Run this command on your local machine or server:

```bash
openssl rand -hex 32
```

Copy the output and add it as `FARMER_ADMIN_KEY` in GitHub Secrets.

**⚠️ IMPORTANT:** Keep this admin key **secret**! It's used to create and manage API keys for your farmers/clients.

---

### Step 3: Deploy via GitHub Actions

Once the secrets are configured:

1. **Commit and push** this folder to your GitHub repository (if not already committed):

```bash
# From the project root
git add bsads_farmer_external_data_source_simulation/
git commit -m "Add farmer data source simulation service"
git push origin main
```

2. The GitHub Actions workflow will automatically:
   - Build the Docker image
   - Push to Docker Hub
   - Deploy to your server on port 8086
   - Create volumes for recordings and API keys
   - Start the service

3. Monitor the deployment in GitHub:
   - Go to **Actions** tab in your repository
   - Click on the latest workflow run
   - Watch the deployment progress

---

### Step 4: Verify Deployment

After deployment completes, verify the service is running:

```bash
# Test from your local machine
curl http://196.43.168.57:8086/health

# Expected response:
# {"status":"ok"}

# Test API docs access
# Open in browser: http://196.43.168.57:8086/docs
```

---

### Step 5: Expose Publicly with Cloudflare Tunnel (Recommended)

Cloudflare Tunnel is **free**, more reliable than ngrok, and doesn't require keeping a terminal open.

#### Option A: Cloudflare Tunnel (Recommended - FREE & Permanent)

**1. Install cloudflared on your server:**

```bash
# SSH into the server
ssh ademneadev@196.43.168.57

# Download and install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate (opens browser - do this once)
cloudflared tunnel login
```

**2. Create and configure tunnel:**

```bash
# Create a tunnel
cloudflared tunnel create farmer-data-source

# This will output a tunnel ID and create a credentials file
# Note the tunnel ID (something like: 12345678-1234-1234-1234-123456789abc)

# Create config file
sudo mkdir -p /etc/cloudflared
sudo nano /etc/cloudflared/config.yml
```

**3. Add this configuration to `/etc/cloudflared/config.yml`:**

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/ademneadev/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: farmer-data.yourdomain.com  # Change this to your subdomain
    service: http://localhost:8086
  - service: http_status:404
```

**4. Create DNS record:**

```bash
# Replace with your tunnel ID and desired subdomain
cloudflared tunnel route dns <YOUR_TUNNEL_ID> farmer-data.yourdomain.com
```

**5. Install and start as a service:**

```bash
# Install the service
sudo cloudflared service install

# Start the service
sudo systemctl start cloudflared

# Enable on boot
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

**Your public URL:** `https://farmer-data.yourdomain.com`

**Benefits:**
- ✅ FREE (no subscription needed)
- ✅ Permanent (doesn't expire)
- ✅ Automatic HTTPS
- ✅ Runs as background service
- ✅ No need to keep terminal open
- ✅ DDoS protection included

---

#### Option B: ngrok (Temporary/Development)

If you want a quick temporary solution:

**1. Install ngrok on server:**

```bash
# SSH into the server
ssh ademneadev@196.43.168.57

# Install ngrok
curl -sSL https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
  | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
  | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**2. Authenticate ngrok (optional but recommended):**

Sign up at https://ngrok.com and get your auth token, then:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**3. Start the tunnel:**

```bash
# Start ngrok tunnel (keeps terminal open)
ngrok http 8086

# OR run in background with screen/tmux
screen -S ngrok
ngrok http 8086
# Press Ctrl+A then D to detach
```

**Your public URL** will be shown in the ngrok output (e.g., `https://abc123.ngrok-free.app`)

**Limitations:**
- ⚠️ URL changes each time you restart (unless you have paid plan)
- ⚠️ Requires keeping process running
- ⚠️ Free tier has session limits

---

### Step 6: Generate API Keys for Farmers/Clients

Once the service is publicly accessible, you can generate API keys for your farmers/clients.

```bash
# Replace YOUR_PUBLIC_URL with your Cloudflare or ngrok URL
# Replace YOUR_ADMIN_KEY with the FARMER_ADMIN_KEY secret you generated

curl -X POST https://YOUR_PUBLIC_URL/admin/keys \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client_name": "Farmer John Doe"}'
```

**Response:**

```json
{
  "api_key": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "client_name": "Farmer John Doe"
}
```

**Share with your farmer/client:**

1. **Server URL:** `https://YOUR_PUBLIC_URL`
2. **API Key:** `f47ac10b-58cc-4372-a567-0e02b2c3d479`

They can then configure their BSADS poller to use these credentials.

---

### Step 7: Test API Key

Test that the generated API key works:

```bash
# List recordings (should be empty initially)
curl -H "X-API-Key: f47ac10b-58cc-4372-a567-0e02b2c3d479" \
  https://YOUR_PUBLIC_URL/recordings

# Expected: {"recordings":[]}
```

---

## 📁 Directory Structure on Server

After deployment, your server will have:

```
Docker Volumes:
├── farmer-recordings/          # Audio recordings storage
│   └── <api-key-uuid>/         # One folder per API key
│       └── <hive-name>/        # Hive folders within each client
│           └── *.wav           # Audio files
│
└── farmer-data/                # API keys database
    └── api_keys.json           # Generated API keys
```

---

## 🔧 Maintenance Commands

### View Service Logs

```bash
ssh ademneadev@196.43.168.57
docker logs farmer-data-source -f
```

### Restart Service

```bash
ssh ademneadev@196.43.168.57
docker restart farmer-data-source
```

### Stop Service

```bash
ssh ademneadev@196.43.168.57
docker stop farmer-data-source
```

### Check Service Status

```bash
ssh ademneadev@196.43.168.57
docker ps | grep farmer-data-source
```

### List All API Keys

```bash
curl -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  https://YOUR_PUBLIC_URL/admin/keys
```

### Revoke an API Key

```bash
curl -X DELETE \
  -H "X-Admin-Key: YOUR_ADMIN_KEY" \
  https://YOUR_PUBLIC_URL/admin/keys/API_KEY_TO_REVOKE
```

---

## 🌐 Service URLs

After deployment:

| Service              | URL                                              |
| -------------------- | ------------------------------------------------ |
| **Health Check**     | `http://196.43.168.57:8086/health`               |
| **API Docs**         | `http://196.43.168.57:8086/docs`                 |
| **Public URL**       | `https://YOUR_PUBLIC_URL` (via Cloudflare/ngrok)|
| **Public API Docs**  | `https://YOUR_PUBLIC_URL/docs`                   |

---

## 🔒 Security Best Practices

1. **Never share the Admin Key** - Only share individual API keys with farmers
2. **Use HTTPS** - Always use the public HTTPS URL (Cloudflare/ngrok) for production
3. **Revoke unused keys** - Regularly audit and revoke API keys that are no longer needed
4. **Monitor access** - Check logs regularly for suspicious activity
5. **Backup API keys** - The `api_keys.json` file is stored in the `farmer-data` volume

---

## 🐛 Troubleshooting

### Port already in use

```bash
# Check what's using port 8086
sudo lsof -i :8086

# Stop conflicting service
sudo systemctl stop SERVICE_NAME
```

### Container not starting

```bash
# Check logs
docker logs farmer-data-source

# Check if volumes exist
docker volume ls | grep farmer

# Recreate container manually
docker stop farmer-data-source
docker rm farmer-data-source
docker pull YOUR_DOCKERHUB_USERNAME/farmer-data-source:latest
docker run -d \
  --name farmer-data-source \
  --restart unless-stopped \
  -p 8086:8000 \
  -v farmer-recordings:/home/farmer/recordings \
  -v farmer-data:/data \
  -e ADMIN_KEY="YOUR_ADMIN_KEY" \
  YOUR_DOCKERHUB_USERNAME/farmer-data-source:latest
```

### Cannot access from public URL

**For Cloudflare Tunnel:**
```bash
# Check tunnel status
sudo systemctl status cloudflared

# Check tunnel logs
sudo journalctl -u cloudflared -f
```

**For ngrok:**
```bash
# Check if ngrok is running
screen -ls  # or ps aux | grep ngrok

# Reattach to ngrok screen
screen -r ngrok
```

---

## 📚 Additional Resources

- **API Documentation:** See [README.md](README.md)
- **Farmer Setup Guide:** See [1.Server(farmer)_owner_admin.md](1.Server(farmer)_owner_admin.md)
- **Client Integration:** See [2.ExternalFarmerIntergrator.md](2.ExternalFarmerIntergrator.md)
- **Example Client:** See [example_polling_client.py](example_polling_client.py)

---

## ✅ Deployment Checklist

- [ ] Server prepared (Docker volumes created, firewall opened)
- [ ] GitHub Secret `FARMER_ADMIN_KEY` added
- [ ] Code committed and pushed to trigger deployment
- [ ] Deployment workflow completed successfully
- [ ] Health check endpoint responding (`/health`)
- [ ] API docs accessible (`/docs`)
- [ ] Cloudflare Tunnel or ngrok configured for public access
- [ ] Public URL tested and working
- [ ] Test API key generated and validated
- [ ] API key shared with first farmer/client

---

**Need help?** Check the logs or contact your system administrator.
