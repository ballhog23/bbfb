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
[PostgreSQL DB] (Private Subnet with NAT)
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
# All instance IDs and IPs in one query
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=BBFBInfraStack/*" "Name=instance-state-name,Values=running" \
  --query 'Reservations[].Instances[].[Tags[?Key==`Name`].Value|[0],InstanceId,PrivateIpAddress,PublicIpAddress,Placement.AvailabilityZone]' \
  --output table
```

### Step 3: Configure Database Instance

**Temporarily allow outbound HTTPS on the DB security group:**

The DB security group has all outbound traffic blocked by default. To install packages, temporarily add an outbound rule for TCP port 443 (HTTPS) to `0.0.0.0/0` via the AWS Console or CLI. **Remove this rule after setup is complete.**

**Connect via EC2 Instance Connect Endpoint:**
```bash
aws ec2-instance-connect ssh --instance-id <DB_INSTANCE_ID>
```

**Create and run the setup scripts on the instance:**

1. Create `~/setup-db-instance.sh` — paste the contents of `infra/scripts/setup-db-instance.sh`, then set `APP_PRIVATE_IP`, `DB_NAME`, and `DB_USER`:
   ```bash
   vim ~/setup-db-instance.sh
   ```

2. Create `~/setup-db.sql` — paste the contents of `infra/scripts/setup-db.sql`, then replace `<USERNAME>`, `<DBNAME>`, and `<PASSWORD>` (escape single quotes as `''`). These must match the values in the setup script. **Save these credentials** — you'll need them for the app instance.
   ```bash
   vim ~/setup-db.sql
   ```

3. Run the script:
   ```bash
   sudo chmod +x ~/setup-db-instance.sh
   ~/setup-db-instance.sh
   ```

5. **Remove the temporary outbound HTTPS rule** from the DB security group. The database does not need internet access during normal operation.

### Step 4: Configure App Instance

**Connect via EC2 Instance Connect Endpoint:**
```bash
aws ec2-instance-connect ssh --instance-id <APP_INSTANCE_ID>
```

**Create and run the setup script on the instance:**

1. Create `~/setup-app-instance.sh` — paste the contents of `infra/scripts/setup-app-instance.sh`, then set `DB_PRIVATE_IP` and `APP_NAME`:
   ```bash
   vim ~/setup-app-instance.sh
   ```

2. Run the script:
   ```bash
   sudo chmod +x ~/setup-app-instance.sh
   ~/setup-app-instance.sh
   ```

3. When the script pauses for code deployment, clone your repo in another terminal:
   ```bash
   sudo git clone <YOUR_REPO_URL> /opt/<APP_NAME>
   ```
   Then press Enter to continue — the script handles cleanup and ownership.

4. When the script pauses for `.env` configuration, edit the file and fill in the real values:
   ```bash
   sudo vim /opt/<APP_NAME>/.env
   ```
   Set `LEAGUE_ID`, `LEAGUE_SEASON`, and the DB credentials. Then press Enter to continue.

The script will:
- Install Node.js 24
- Install dependencies
- Build the application
- Run database migrations
- Create and start systemd service
- Bootstrap the database with historical data

**Verify app is running:**
```bash
sudo systemctl status <APP_NAME>
sudo journalctl -u <APP_NAME> -f  # View logs
curl http://localhost:3000  # Test locally
```

### Step 5: Configure Reverse Proxy Instance

**Connect via EC2 Instance Connect Endpoint:**
```bash
aws ec2-instance-connect ssh --instance-id <REVERSE_PROXY_INSTANCE_ID> --connection-type eice
```

> **Note:** The reverse proxy is in a public subnet, so you must pass `--connection-type eice` to force routing through the EIC endpoint. Without it, the CLI tries the public IP and hangs.

**Create and run the setup script on the instance:**

1. Create `~/setup-reverse-proxy.sh` — paste the contents of `infra/scripts/setup-reverse-proxy.sh`, then set `APP_PRIVATE_IP` and update the certbot email in the "Next Steps" output:
   ```bash
   vim ~/setup-reverse-proxy.sh
   ```

2. Run the script:
   ```bash
   sudo chmod +x ~/setup-reverse-proxy.sh
   ~/setup-reverse-proxy.sh
   ```

3. **If redeploying**, update the existing A records to point to the new reverse proxy public IP before proceeding. The public IP changes on each deployment.

4. After DNS is configured (see Step 6), obtain the SSL certificate:
   ```bash
   sudo certbot --nginx -d bleedblue.football -d www.bleedblue.football --non-interactive --agree-tos -m <YOUR_EMAIL>
   ```

5. Set up SSL auto-renewal:
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
sudo journalctl -u <APP_NAME> -f

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
cd /opt/<APP_NAME>
sudo -u <APP_NAME> npm run migrate
sudo systemctl restart <APP_NAME>
```

### Application Code Updates

```bash
# Deploy new code to /opt/<APP_NAME>
# Then:
cd /opt/<APP_NAME>
sudo -u <APP_NAME> npm ci --omit=dev
sudo -u <APP_NAME> npm run build
sudo systemctl restart <APP_NAME>
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
sudo systemctl status <APP_NAME>

# Check app logs
sudo journalctl -u <APP_NAME> -n 100

# Test locally on app instance
curl http://localhost:3000

# Verify security group allows traffic from reverse proxy to app on port 3000
```

### Re-running Database Setup Script
If you need to re-run the setup script from scratch, reset the data directory first:
```bash
sudo systemctl stop postgresql
sudo rm -rf /var/lib/pgsql/data
sudo mkdir /var/lib/pgsql/data
sudo chown postgres:postgres /var/lib/pgsql/data
sudo chmod 700 /var/lib/pgsql/data
```
Then re-run the setup script.

### Database Connection Issues
```bash
# On DB instance, check PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf allows app instance
sudo cat /var/lib/pgsql/data/pg_hba.conf

# Test connection from app instance
PGPASSWORD='<password>' psql -h <DB_PRIVATE_IP> -U <DB_USER> -d <DB_NAME>

# Check PostgreSQL logs
sudo tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

### Instance Access Issues
```bash
# Verify the EIC endpoint is in available state
aws ec2 describe-instance-connect-endpoints \
  --query 'InstanceConnectEndpoints[0].[State,SubnetId]' \
  --output text

# Test SSH connectivity via EIC endpoint
aws ec2-instance-connect ssh --instance-id <INSTANCE_ID>

# If connection fails, check the EIC endpoint security group allows
# outbound SSH (port 22) to the target instance's security group
```

## Security Considerations

✅ **Network Security:**
- Public subnet: Reverse proxy only
- Private subnet with NAT: App server (internet access for updates)
- Private subnet with NAT: Database (all outbound blocked, no inbound from internet)
- Security groups restrict traffic between tiers

✅ **SSL/TLS:**
- Let's Encrypt SSL certificates
- Automatic renewal configured
- HTTP → HTTPS redirect enforced
- HSTS headers enabled

✅ **Access Control:**
- No SSH keys needed (EC2 Instance Connect Endpoint)
- IAM-based access control via EIC endpoint
- No public SSH ports exposed - SSH tunneled through private EIC endpoint
- Database credentials not in version control
- File permissions on .env files

✅ **Application Security:**
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting (10 req/sec per IP)
- Systemd service hardening
- Dedicated service user with restricted permissions

✅ **Database Security:**
- PostgreSQL pg_hba.conf restricts connections to app instance IP only
- Encrypted passwords
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
sudo journalctl -u <APP_NAME> -f
sudo journalctl -u <APP_NAME> --since "1 hour ago"
sudo journalctl -u your-service-name -p err # only error-level entry
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