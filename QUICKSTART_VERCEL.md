# Quick Start: Deploy to www.genfit.me

## What's Been Done
✅ Code fixes for auth (VITE_API_BASE_URL added)
✅ Changes pushed to GitHub
✅ Documentation files created
✅ Environment templates added

## Next Steps for Production Deployment

### 1️⃣ Set Up Vercel (Frontend)

**Go to: https://vercel.com**

1. Sign in (or create free account)
2. Click **Add New** → **Project**
3. Import GitHub repository: `AbhayxRajput07/GenFit`
4. Configure project settings:
   - Framework: **Vite**
   - Install: `cd genfit-frontend && npm install`
   - Build: `cd genfit-frontend && npm run build`
   - Output: `genfit-frontend/dist`
5. Click **Deploy**

### 2️⃣ Add Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Example |
|----------|-------|---------|
| VITE_API_KEY | Google API Key | AIzaSy... |
| VITE_API_BASE_URL | Backend API URL | https://api.yourdomain.com |

**⚠️ Important**: Replace with your actual backend URL!

### 3️⃣ Connect Custom Domain (www.genfit.me)

In Vercel Dashboard:
1. Settings → Domains
2. Add Domain → Enter: `www.genfit.me`
3. Vercel shows DNS CNAME record
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Add CNAME record:
   ```
   Name: www
   Value: <Vercel CNAME>
   TTL: 3600
   ```
6. Wait 24-48 hours for DNS propagation

### 4️⃣ Deploy Backend (Production)

**Choose one option:**

#### Option A: Heroku (Easiest)
```bash
npm install -g heroku
cd genfit-backend
heroku login
heroku create your-app-name
heroku config:set MONGO_URI="your_mongodb_connection_string"
heroku config:set JWT_SECRET="your_jwt_secret"
git push heroku main
```
Backend URL: `https://your-app-name.herokuapp.com`

#### Option B: Railway (Recommended)
1. Go to https://railway.app
2. Create account & project
3. Connect GitHub
4. Set environment variables (MONGO_URI, JWT_SECRET)
5. Deploy
6. Get URL from Railway dashboard

#### Option C: Render
Similar to Railway - visit https://render.com

### 5️⃣ Update Frontend with Backend URL

Once backend is deployed:
1. Get backend URL (e.g., `https://genfit-api.herokuapp.com`)
2. In Vercel Dashboard → Environment Variables
3. Update `VITE_API_BASE_URL` to your backend URL
4. Redeploy (Vercel auto-redeploys on environment changes)

### 6️⃣ Test Production

Visit: **https://www.genfit.me**

Test the flow:
1. Click "Log In / Sign Up"
2. Test Sign Up with new email
3. Test Log In with credentials
4. Check browser console for errors

## Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Frontend Code | ✅ Ready | Pushed to GitHub, VITE_API_BASE_URL configured |
| Frontend Deployment | ⏳ Need Setup | Deploy via Vercel |
| Backend Code | ✅ Ready | Tested locally, works correctly |
| Backend Deployment | ⏳ Need Setup | Choose Heroku/Railway/Render |
| Database | ✅ Ready | MongoDB Atlas connected |
| Domain | ⏳ Need Config | Add DNS records after Vercel setup |

## Troubleshooting

### "Failed to fetch" in browser
- Check VITE_API_BASE_URL is correct
- Verify backend is running
- Check CORS is enabled on backend
- Allow frontend domain in CORS

### Deployment fails
- Check build logs in Vercel dashboard
- Ensure Node.js 18+ is used
- Verify all dependencies are in package.json

### Domain not working
- Wait 24-48 hours for DNS propagation
- Clear browser cache
- Check DNS with: `nslookup www.genfit.me`

## Resources

- **Vercel Setup**: https://vercel.com/docs/getting-started
- **Environment Variables**: https://vercel.com/docs/projects/environment-variables
- **Custom Domains**: https://vercel.com/docs/concepts/projects/domains/add-a-domain
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Backend Deployment Guide**: See DEPLOYMENT.md in repo

## Need Help?

Check `DEPLOYMENT.md` in the GitHub repository for detailed instructions on each step.

---

**Summary**: Code is ready! Just need to:
1. Connect Vercel to GitHub repo
2. Deploy backend (Heroku/Railway/Render)
3. Update environment variables
4. Point domain to Vercel
5. Test on www.genfit.me
