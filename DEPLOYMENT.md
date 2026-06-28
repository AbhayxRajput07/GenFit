# GenFit Deployment Guide

## Overview
GenFit is a full-stack fitness application with:
- **Frontend**: Vite + React (TypeScript) - Deploys to Vercel
- **Backend**: Express.js + MongoDB Atlas - Deployed separately
- **Database**: MongoDB Atlas (Cloud)

## Frontend Deployment to Vercel

### Prerequisites
- Vercel account (free tier available at vercel.com)
- GitHub repository connected to Vercel
- Custom domain www.genfit.me registered and configured

### Step 1: Build Locally
```bash
cd genfit-frontend
npm run build
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Update auth environment configuration for production"
git push origin main
```

### Step 3: Deploy via Vercel

**Option A: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Connect your GitHub repository
3. Select GenFit repository
4. Configure build settings:
   - **Framework**: Vite
   - **Install Command**: `cd genfit-frontend && npm install`
   - **Build Command**: `cd genfit-frontend && npm run build`
   - **Output Directory**: `genfit-frontend/dist`
5. Add Environment Variables:
   - `VITE_API_KEY`: Your Google API Key
   - `VITE_API_BASE_URL`: Your backend API URL (e.g., https://api.genfit.me)
6. Click Deploy

**Option B: Using Vercel CLI**
```bash
npm install -g vercel
vercel
# Follow the prompts to connect to Vercel
```

### Step 4: Connect Custom Domain
1. In Vercel Dashboard → Project Settings → Domains
2. Click "Add Domain"
3. Enter: `www.genfit.me`
4. Follow instructions to update DNS records with your domain registrar
5. Vercel provides CNAME or A record values

### Step 5: Update Production Environment Variables

Once deployed, update the Vercel environment variables:
- **VITE_API_BASE_URL**: Set to your backend API URL
  - Example: `https://api.genfit.me` (if backend is deployed)
  - Or your current backend URL

**To update via Vercel Dashboard:**
1. Project Settings → Environment Variables
2. Edit VITE_API_BASE_URL
3. Click Save and redeploy

## Backend Deployment

### Current Setup
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Already configured)
- **Environment**: genfit-backend/.env

### Deployment Options

**Option 1: Heroku** (Easiest for beginners)
```bash
npm install -g heroku
cd genfit-backend
heroku create your-app-name
git push heroku main
heroku config:set MONGO_URI="your_mongodb_uri"
heroku config:set JWT_SECRET="your_jwt_secret"
```

**Option 2: Railway.app**
1. Create account at railway.app
2. Connect GitHub repository
3. Set environment variables in dashboard
4. Deploy

**Option 3: Render**
1. Create account at render.com
2. Create new Web Service
3. Connect GitHub
4. Set build & start commands
5. Add environment variables
6. Deploy

**Option 4: Your Own Server**
- Deploy to AWS, DigitalOcean, Linode, etc.
- Use PM2 for process management
- Set up nginx as reverse proxy

### Backend Environment Variables
Update `.env` before deployment:
```
MONGO_URI=mongodb+srv://rajputabhay1713_db_user:99g6BLLDBqEHvK8n@cluster0.jfyj90l.mongodb.net/genfit?retryWrites=true&w=majority
JWT_SECRET=genfitsecret
PORT=5000
```

## Connect Frontend to Backend

Once both are deployed, update the frontend environment variable:

**In Vercel Dashboard:**
1. Settings → Environment Variables
2. Set `VITE_API_BASE_URL` to your backend URL
3. Trigger a redeploy

## Troubleshooting

### Frontend Cannot Connect to Backend
- **Issue**: CORS errors, connection refused
- **Solution**: 
  1. Ensure backend has CORS enabled
  2. Check VITE_API_BASE_URL is correct
  3. Verify backend is running and accessible

### Build Failures
- **Issue**: npm install or build errors
- **Solution**:
  1. Check Node.js version (should be 18+)
  2. Delete node_modules and package-lock.json
  3. Run `npm install` again
  4. Check console output in Vercel dashboard

### Environment Variables Not Loading
- **Issue**: undefined values in frontend
- **Solution**:
  1. Verify VITE_ prefix (required for Vite)
  2. Redeploy after setting variables
  3. Check build logs in Vercel

## Production Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend environment variables updated
- [ ] VITE_API_BASE_URL points to production backend
- [ ] Custom domain www.genfit.me configured
- [ ] CORS enabled on backend for frontend domain
- [ ] SSL/HTTPS enabled (Vercel handles automatically)
- [ ] Test signup/login flow
- [ ] Monitor errors in Vercel Analytics

## Domain Configuration (www.genfit.me)

### DNS Setup Example (Namecheap, GoDaddy, etc.)
1. Go to domain registrar settings
2. Add CNAME record:
   - **Name**: www
   - **Value**: (provided by Vercel)
   - **TTL**: 3600

Or A record:
- **Name**: @ (or www)
- **Value**: (provided by Vercel)

### Verify Domain
```bash
nslookup www.genfit.me
# Should resolve to Vercel IP
```

## Useful Commands

```bash
# Build frontend
cd genfit-frontend && npm run build

# Test backend locally
cd genfit-backend && npm start

# Check git changes
git status
git diff

# View logs (local)
npm start  # With console output

# Vercel logs (requires Vercel CLI)
vercel logs
```

## Support & Documentation
- Vercel Docs: https://vercel.com/docs
- Vite Docs: https://vitejs.dev
- Express Docs: https://expressjs.com
- MongoDB Docs: https://docs.mongodb.com
