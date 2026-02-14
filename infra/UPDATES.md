# Updating bleedblue.football

## Connect to the App Instance

```bash
aws ec2-instance-connect ssh --instance-id <APP_INSTANCE_ID>
```

## Application Code Updates

```bash
cd /opt/bbfb
sudo -u bbfb git pull origin master
sudo -u bbfb npm ci
sudo -u bbfb npm run build
sudo -u bbfb npm prune --omit=dev
sudo systemctl restart bbfb
```

## Database Schema Changes

If the update includes new migrations, run them before restarting:

```bash
cd /opt/bbfb
sudo -u bbfb git pull origin master
sudo -u bbfb npm ci
sudo -u bbfb npm run migrate
sudo -u bbfb npm run build
sudo -u bbfb npm prune --omit=dev
sudo systemctl restart bbfb
```

Generate migrations locally before pushing:

```bash
npm run generate
git commit -m "Add new migration"
git push
```

## Verify

```bash
sudo systemctl status <APP_NAME>
sudo journalctl -u <APP_NAME> -f
curl http://localhost:3000
```
