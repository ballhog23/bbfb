# AWS Deployment Guide - bleedblue.football

Complete guide for deploying the BBFB application to AWS with a 3-tier architecture.

## Architecture Overview

```
Internet
    ↓
[Reverse Proxy] (Public Subnet)
    ↓
[App Server] (Private Subnet with NAT)
    ↓
[PostgreSQL DB] (Isolated Subnet)
```

## Prerequisites

- AWS CLI configured with appropriate credentials
- AWS CDK installed: `npm install -g aws-cdk`
- Domain `bleedblue.football` registered and accessible
- DNS access (Route53 or external provider)

## Deployment Steps

### Step 1: Deploy Infrastructure with CDK

```bash
cd infra
npm install

# First time only - bootstrap CDK in your AWS account
cdk bootstrap

# Deploy the stack
cdk deploy
```

**Note the instance IPs after deployment:**
- You'll need to get these from the AWS Console or CLI (see commands below)

### Step 2: Get Instance Information

After CDK deployment completes, get instance IPs and IDs:

```bash
# Reverse Proxy Public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*ReverseProxyInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text

# App Instance Private IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*AppInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' \
  --output text

# DB Instance Private IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*DbInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].PrivateIpAddress' \
  --output text

# Get Instance IDs (for SSM access)
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*ReverseProxyInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text

aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*AppInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text

aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=*DbInstance*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text
```

### Step 3: Configure Database Instance

**Connect via SSM:**
```bash
aws ssm start-session --target <DB_INSTANCE_ID>
```

**Update and run the setup script:**

1. Update `infra/scripts/setup-db-instance.sh` with the App instance private IP:
   ```bash
   # Replace <APP_INSTANCE_PRIVATE_IP> with actual IP
   ```

2. Copy the script to the instance (or paste it):
   ```bash
   # Option 1: Paste script content directly in SSM session

   # Option 2: Use S3 bucket to transfer
   aws s3 cp infra/scripts/setup-db-instance.sh s3://your-bucket/
   # Then on instance:
   aws s3 cp s3://your-bucket/setup-db-instance.sh .
   ```

3. Run the script:
   ```bash
   chmod +x setup-db-instance.sh
   ./setup-db-instance.sh
   ```

4. When prompted, enter:
   - Database name (e.g., `bbfb`)
   - Database username (e.g., `ballhog`)
   - Database password (secure password)

   **Save these credentials** - you'll need them for the app instance!

### Step 4: Configure App Instance

**Connect via SSM:**
```bash
aws ssm start-session --target <APP_INSTANCE_ID>
```

**Deploy your application code:**

Choose one method:

**Option A: Git Clone (if repo accessible)**
```bash
sudo -u bbfb git clone <YOUR_REPO_URL> /opt/bbfb
```

**Option B: S3 Transfer**
```bash
# On local machine:
tar -czf bbfb.tar.gz --exclude=node_modules --exclude=dist --exclude=.git .
aws s3 cp bbfb.tar.gz s3://your-bucket/

# On instance:
cd /opt/bbfb
aws s3 cp s3://your-bucket/bbfb.tar.gz .
sudo tar -xzf bbfb.tar.gz
sudo chown -R bbfb:bbfb /opt/bbfb
```

**Update and run setup script:**

1. Update `infra/scripts/setup-app-instance.sh` with DB instance private IP

2. Transfer and run:
   ```bash
   chmod +x setup-app-instance.sh
   ./setup-app-instance.sh
   ```

3. When prompted, enter the **same database credentials** from Step 3:
   - Database username
   - Database password
   - Database name

The script will:
- Install Node.js 24
- Install dependencies
- Build the application
- Run database migrations
- Create and start systemd service

**Verify app is running:**
```bash
sudo systemctl status bbfb
sudo journalctl -u bbfb -f  # View logs
curl http://localhost:3000  # Test locally
```

### Step 5: Configure Reverse Proxy Instance

**Connect via SSM:**
```bash
aws ssm start-session --target <REVERSE_PROXY_INSTANCE_ID>
```

**Update and run setup script:**

1. Update `infra/scripts/setup-reverse-proxy.sh` with App instance private IP

2. Transfer and run:
   ```bash
   chmod +x setup-reverse-proxy.sh
   ./setup-reverse-proxy.sh
   ```

**Obtain SSL Certificate:**

After DNS is configured (see Step 6), run:
```bash
sudo certbot --nginx \
  -d bleedblue.football \
  -d www.bleedblue.football \
  --non-interactive \
  --agree-tos \
  -m your-email@example.com
```

**Set up SSL auto-renewal:**
```bash
echo '0 0,12 * * * root /opt/certbot/bin/python -c "import random; import time; time.sleep(random.random() * 3600)" && sudo certbot renew -q' | sudo tee -a /etc/crontab > /dev/null
```

### Step 6: Configure DNS

Create A records in your DNS provider (Route53 or external):

1. **bleedblue.football** → Reverse Proxy Public IP
2. **www.bleedblue.football** → Reverse Proxy Public IP

**Route53 example:**
```bash
# Get hosted zone ID
aws route53 list-hosted-zones --query "HostedZones[?Name=='bleedblue.football.'].Id" --output text

# Create A records using AWS CLI or Console
```

**Wait for DNS propagation** (2-10 minutes):
```bash
dig bleedblue.football
nslookup bleedblue.football
```

### Step 7: Verify Deployment

**Test HTTP → HTTPS redirect:**
```bash
curl -I http://bleedblue.football
# Should return 301 redirect to https://
```

**Test www → non-www redirect:**
```bash
curl -I https://www.bleedblue.football
# Should return 301 redirect to https://bleedblue.football
```

**Test application:**
```bash
curl https://bleedblue.football
# Should return your application's HTML
```

**Check logs:**
```bash
# On reverse proxy:
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# On app instance:
sudo journalctl -u bbfb -f

# On db instance:
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

## Future Deployments

For code updates or schema changes:

### Database Schema Changes

```bash
# On local machine:
npm run generate  # Generate new migrations
git commit -m "Add new migration"
git push

# Deploy code to app instance (via S3, git pull, etc.)

# On app instance:
cd /opt/bbfb
sudo -u bbfb npm run migrate
sudo systemctl restart bbfb
```

### Application Code Updates

```bash
# Deploy new code to /opt/bbfb
# Then:
cd /opt/bbfb
sudo -u bbfb npm ci --omit=dev
sudo -u bbfb npm run build
sudo systemctl restart bbfb
```

## Troubleshooting

### DNS Not Resolving
```bash
# Check DNS propagation
dig bleedblue.football
nslookup bleedblue.football

# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <ZONE_ID>
```

### Nginx Not Starting
```bash
# Check nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Fails
- Ensure DNS is fully propagated (wait 10-15 minutes)
- Verify ports 80 and 443 are accessible from internet
- Check security group rules (should be configured by CDK)
- Ensure nginx is running: `sudo systemctl status nginx`

### App Not Accessible
```bash
# Check app is running
sudo systemctl status bbfb

# Check app logs
sudo journalctl -u bbfb -n 100

# Test locally on app instance
curl http://localhost:3000

# Verify security group allows traffic from reverse proxy to app on port 3000
```

### Database Connection Issues
```bash
# On DB instance, check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf allows app instance
sudo cat /var/lib/pgsql/data/pg_hba.conf

# Test connection from app instance
PGPASSWORD='password' psql -h <DB_PRIVATE_IP> -U ballhog -d bbfb

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

### Instance Access Issues
```bash
# Verify SSM agent is running
sudo systemctl status amazon-ssm-agent

# Check IAM instance profile has SSM permissions
aws ec2 describe-instances --instance-ids <INSTANCE_ID> \
  --query 'Reservations[0].Instances[0].IamInstanceProfile'
```

## Security Considerations

✅ **Network Security:**
- Public subnet: Reverse proxy only
- Private subnet with NAT: App server (internet access for updates)
- Isolated subnet: Database (no internet access)
- Security groups restrict traffic between tiers

✅ **SSL/TLS:**
- Let's Encrypt SSL certificates
- Automatic renewal configured
- HTTP → HTTPS redirect enforced
- HSTS headers enabled

✅ **Access Control:**
- No SSH keys needed (SSM Session Manager)
- IAM-based access control
- Database credentials not in version control
- File permissions (600) on .env files

✅ **Application Security:**
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting (10 req/sec per IP)
- Systemd service hardening
- Dedicated service user with restricted permissions

✅ **Database Security:**
- PostgreSQL pg_hba.conf restricts connections to app instance IP only
- Encrypted passwords (scram-sha-256)
- No public access
- Database owner isolation

## Monitoring

**Nginx logs:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

**Application logs:**
```bash
sudo journalctl -u bbfb -f
sudo journalctl -u bbfb --since "1 hour ago"
```

**PostgreSQL logs:**
```bash
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

**System resources:**
```bash
# CPU and memory
top
htop

# Disk usage
df -h

# Network connections
sudo netstat -tulpn
```

## Cost Optimization

Current setup uses:
- 3x t4g.nano instances (~$3/month each = ~$9/month)
- Minimal data transfer for small traffic
- NAT instance instead of NAT Gateway (saves ~$32/month)

Total estimated cost: **~$10-15/month** for low traffic.
