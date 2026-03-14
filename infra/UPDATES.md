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

## Environment Variable Changes

If you add or rename variables in `.env` or `src/config.ts`, update the GitHub Actions secrets to match:

**Settings → Secrets and variables → Actions**

| Secret | Used by |
|---|---|
| `PLATFORM` | CI tests |
| `PORT` | CI tests |
| `LEAGUE_ID` | CI tests |
| `LEAGUE_SEASON` | CI tests |
| `PREV_LEAGUE_ID` | CI tests |
| `PREV_LEAGUE_SEASON` | CI tests |
| `AWS_DEPLOY_ROLE_ARN` | CD deploy |
| `AWS_REGION` | CD deploy |
| `EC2_INSTANCE_ID` | CD deploy |
| `APP_NAME` | CD deploy |

## Verify

```bash
sudo systemctl status <APP_NAME>
sudo journalctl -u <APP_NAME> -f
curl http://localhost:3000
```
