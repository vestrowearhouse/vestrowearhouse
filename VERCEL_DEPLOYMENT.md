# Vercel Deployment Guide

## Prerequisites
- GitHub account with this repository pushed
- Vercel account (free at vercel.com)
- MongoDB Atlas cluster (or other MongoDB host)
- Gmail App Password (for email)

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/stellarmartbd.git
git push -u origin main
```

---

## Step 2: Deploy on Vercel

### Option A: Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts → Link to existing project or create new
```

### Option B: Vercel Dashboard (Recommended)
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Framework Preset: **Next.js** (auto-detected)
5. Click **Deploy**

---

## Step 3: Add Environment Variables

Go to **Project Settings → Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | Your MongoDB connection string | Production, Preview |
| `JWT_SECRET` | Your strong JWT secret key | Production, Preview |
| `EMAIL_HOST` | `smtp.gmail.com` | Production, Preview |
| `EMAIL_PORT` | `587` | Production, Preview |
| `EMAIL_USER` | `stellarmartbd@gmail.com` | Production, Preview |
| `EMAIL_PASS` | Your 16-digit Gmail App Password | Production, Preview |
| `FROM_EMAIL` | `StellarMartBD <stellarmartbd@gmail.com>` | Production, Preview |
| `NEXT_PUBLIC_BASE_URL` | `https://your-project.vercel.app` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app API key | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `stellarmartbd-930de.firebaseapp.com` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `stellarmartbd-930de` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `stellarmartbd-930de.firebasestorage.app` | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app sender ID | Production, Preview |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID | Production, Preview |
| `FIREBASE_PROJECT_ID` | `stellarmartbd-930de` | Production, Preview |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account client email | Production, Preview |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key | Production, Preview |
| `NODE_ENV` | `production` | Production |

**Important**: After adding environment variables, **redeploy** the project.

---

## Step 4: Update Firebase and Google OAuth

After deployment, add your deployed domain to Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Authentication → Settings → Authorized domains
3. Add your deployed domain, for example: `your-project.vercel.app`

Then register the Firebase auth handler in Google Cloud:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Open the OAuth 2.0 Client ID used by Firebase Authentication
3. Add this Authorized redirect URI:

```text
https://stellarmartbd-930de.firebaseapp.com/__/auth/handler
```

If Google's error page shows a different `redirect_uri`, add that exact URI too or update
`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` in Vercel to `stellarmartbd-930de.firebaseapp.com`.

---

## Step 5: Update NEXT_PUBLIC_BASE_URL

Make sure `NEXT_PUBLIC_BASE_URL` matches your actual Vercel URL.

---

## Troubleshooting

### Build Fails
```bash
# Test build locally
npm run build
```

### Emails Not Sending (Production)
- Verify Gmail App Password is correct
- Check Vercel Function Logs: Project → Functions → Select function → Logs

### MongoDB Connection Error
- Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access (for Vercel serverless functions)
- Or use MongoDB Atlas Data API

### Images Not Loading
- The `next.config.js` already allows Cloudinary and Unsplash domains
- Add any new image domains to `images.remotePatterns`

---

## Redeploy After Changes

```bash
git add .
git commit -m "Update"
git push origin main
# Vercel auto-deploys on every push
