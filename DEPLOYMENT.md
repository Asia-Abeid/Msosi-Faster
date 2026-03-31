# Deployment Guide - Railway

Complete guide to deploying Msosi Faster backend to Railway.

## Prerequisites

1. GitHub account with access to the repository
2. Railway account (https://railway.app)
3. MySQL database ready (Railway MySQL plugin or external)
4. Stripe and Selcom API credentials

## Step 1: Deploy Backend to Railway

### 1.1 Connect GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `Msosi-Faster` repository
4. Authorize Railway to access your GitHub
5. Select main branch

### 1.2 Configure Environment Variables

In Railway dashboard → Project Settings → Variables, add:

```
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=yourdomain.railway.app,localhost

DATABASE_ENGINE=django.db.backends.mysql
DATABASE_NAME=msosi_faster
DATABASE_USER=root
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=db_host
DATABASE_PORT=3306

JWT_ACCESS_TOKEN_LIFETIME=1440
JWT_REFRESH_TOKEN_LIFETIME=10080

CORS_ALLOWED_ORIGINS=https://yourdomain.railway.app

SELCOM_API_KEY=your_selcom_key
SELCOM_API_SECRET=your_selcom_secret
STRIPE_API_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## Step 2: Set Up MySQL Database

### Option 1: Railway MySQL Plugin (Recommended)

1. In Railway project, click "Add Service"
2. Select "MySQL"
3. Railway auto-generates connection variables
4. Copy database credentials to your environment variables

### Option 2: External MySQL Database

Configure these variables:
- `DATABASE_HOST`: Your database host
- `DATABASE_NAME`: Database name
- `DATABASE_USER`: Database username
- `DATABASE_PASSWORD`: Database password
- `DATABASE_PORT`: 3306 (default)

## Step 3: Configure Django App

### 3.1 Update settings.py for Production

Ensure these are set in Railway variables:

```python
# .env or Railway variables
DEBUG = False
ALLOWED_HOSTS = ['yourdomain.railway.app', 'api.yourdomain.com']
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

### 3.2 Create railway.json (Optional but Recommended)

```json
{
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "startCommand": "python manage.py migrate --noinput && gunicorn msosi_backend.wsgi:application --bind 0.0.0.0:$PORT",
    "numReplicas": 1,
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 4: Deploy & Migrate

### 4.1 Push to GitHub

```bash
git add .
git commit -m "Production deployment configuration"
git push origin main
```

### 4.2 Railway Auto-Deploy

Once pushed to main:
1. Railway detects changes
2. Builds Docker image using Dockerfile
3. Runs migrations automatically
4. Deploys new version
5. Service becomes available at `yourdomain.railway.app`

### 4.3 Create Superuser on Railway

```bash
# Via Railway Shell
python manage.py createsuperuser

# Or via Railway CLI
railway run python manage.py createsuperuser
```

## Step 5: Post-Deployment Checklist

- [ ] Verify admin panel works: `https://yourdomain.railway.app/admin`
- [ ] Test API endpoints with Postman
- [ ] Check logs for errors
- [ ] Verify database migrations ran successfully
- [ ] Test user registration and login
- [ ] Verify JWT token generation
- [ ] Test file uploads (media files)
- [ ] Check CORS configuration with frontend app
- [ ] Test payment endpoints

## Step 6: Set Custom Domain

### 6.1 Add Domain to Railway

1. Go to Django service settings
2. Click "Domains"
3. Add custom domain: `api.yourdomain.com`
4. Railway provides DNS instructions

### 6.2 Update DNS Records

Add CNAME record in your domain provider:
```
api.yourdomain.com CNAME route.railway.app
```

Wait for DNS propagation (up to 48 hours).

## Step 7: SSL/HTTPS Configuration

Railway automatically provisions SSL certificates via Let's Encrypt for all custom domains.

No additional configuration needed!

## Monitoring & Logs

### View Logs

```bash
# Via Railway CLI
railway logs

# Follow logs in real-time
railway logs --follow
```

### Check Service Status

1. Railway Dashboard → Your Project
2. View resource usage (CPU, Memory, Network)
3. Check deployment history

## Troubleshooting Deployment

### Build Fails

Check these in your Dockerfile:
1. Python version compatibility
2. All dependencies in requirements.txt
3. Build arguments correctly set

### Database Connection Error

```
Error: Can't connect to MySQL server
```

Solutions:
1. Verify DATABASE_HOST in environment variables
2. Check DATABASE_NAME exists
3. Verify DATABASE_USER and PASSWORD
4. Check firewall allows connection

### Migrations Fail

```
Error: Applying migrations
```

Solutions:
1. Check database credentials
2. Ensure database is created
3. Run migrations locally first to test
4. Check for circular imports in models

### Static Files Not Loading

```
CSS/Images not appearing
```

Solutions:
1. Run: `python manage.py collectstatic`
2. Ensure STATIC_ROOT is configured
3. Check STATIC_URL is correct
4. Verify file permissions

### 502 Bad Gateway

```
Error showing on domain
```

Solutions:
1. Check Railway logs: `railway logs`
2. Verify app is running: `railway status`
3. Check PORT is set to 8000
4. Restart service: `railway down && railway up`

## Continuous Deployment

Once set up, deployment is automatic:

1. Make changes locally
2. Commit to git: `git commit -m "description"`
3. Push to main: `git push origin main`
4. Railway automatically:
   - Detects changes
   - Builds Docker image
   - Runs migrations
   - Deploys new version
   - No downtime with smart restart

## Rollback to Previous Version

If deployment fails:

1. Railway Dashboard → Deployments
2. Click previous successful build
3. Click "Redeploy"

## Database Maintenance

### Backup Database

Railway MySQL plugin auto-backups daily.

To manual backup:
```bash
# Via Railway CLI
railway exec mysqldump -u$DATABASE_USER -p$DATABASE_PASSWORD $DATABASE_NAME > backup.sql
```

### Database Size

Check in Railway Dashboard:
1. MySQL service → Info
2. View storage usage
3. Upgrade plan if needed

## Performance Optimization

### 1. Enable Caching

```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
```

### 2. Optimize Database Queries

- Use `select_related()` for foreign keys
- Use `prefetch_related()` for many-to-many
- Add database indexes for frequently searched fields

### 3. Add CDN for Media Files

Configure AWS S3 or Cloudinary for media files:
```
USE_S3=True
AWS_STORAGE_BUCKET_NAME=your-bucket
```

### 4. Scale Resources

Railway allows scaling:
1. Increase instance size
2. Add more replicas
3. Allocate more CPU/Memory

## Environment-Specific Configs

### Development (.env)
```
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Testing (.env.testing)
```
DEBUG=False
ALLOWED_HOSTS=test.railway.app
```

### Production (Railway Variables)
```
DEBUG=False
ALLOWED_HOSTS=yourdomain.railway.app
```

## Team Access

Share Railway project with team:

1. Railway → Project Settings → Members
2. Click "Invite Member"
3. Add teammate email
4. Set permissions level

## Cost Management

### Estimate Costs

- Django service: $5-50/month depending on traffic
- MySQL database: $10-20/month
- Total: ~$15-70/month for small-medium app

### Optimize Costs

1. Use smaller instance for low traffic
2. Remove unused services
3. Monitor resource usage
4. Use auto-scaling

## Support & Issues

Helpful resources:
- Railway Docs: https://docs.railway.app
- Django Docs: https://docs.djangoproject.com
- Issue tracker: GitHub Issues
- Team Slack/Discord for discussions

## Next Steps

1. ✅ Deploy to Railway
2. Test thoroughly on production
3. Monitor logs and performance
4. Train team on deployment process
5. Set up CI/CD pipeline (GitHub Actions)
6. Configure automated tests before deployment

---

**Last Updated**: March 2024
**Deployment Environment**: Railway
**Status**: Production Ready
