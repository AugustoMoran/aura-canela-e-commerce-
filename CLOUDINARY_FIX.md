# ⚠️ Cloudinary Configuration Verification

## Current Configuration
```
Cloud Name: dvory3d2
API Key: 578319858564676
API Secret: 14QkxKKTnX49fQU-fY1jTjtmCPE
```

## Error from Cloudinary
```
"Unknown API key"
```

## What This Means
Cloudinary is rejecting the API key `578319858564676`. This happens when:

1. **API Key is incorrect/expired** - The key doesn't exist in Cloudinary
2. **Cloud name is wrong** - `dvory3d2` doesn't match the account
3. **Account has been deactivated** - The Cloudinary account is no longer active
4. **Typo in credentials** - The client may have copied it incorrectly

## How to Fix

### Step 1: Go to Cloudinary Dashboard
1. Visit: https://cloudinary.com/console/
2. Login with your account
3. Look at the "Account" tab

### Step 2: Copy CORRECT Credentials
You should see:
- **Cloud Name** (example: `dp1k2v5n9`)
- **API Key** (10-12 digits, example: `578319858564676`)
- **API Secret** (long string)

### Step 3: Update Environment Variables
Replace the values in `.env.local`:
```
CLOUDINARY_CLOUD_NAME=[your-cloud-name-from-dashboard]
CLOUDINARY_API_KEY=[your-api-key-from-dashboard]
CLOUDINARY_API_SECRET=[your-api-secret-from-dashboard]
```

### Step 4: Check Fly.io Secrets
Update in Fly.io:
```bash
flyctl secrets set CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
flyctl secrets set CLOUDINARY_API_KEY=your-actual-api-key
flyctl secrets set CLOUDINARY_API_SECRET=your-actual-api-secret
```

### Step 5: Redeploy
```bash
cd backend
flyctl deploy -a m-sports-backend --force-machines
```

## ✅ Verification Test
Once updated, run:
```bash
node test-cloudinary-signature.js
```

This will show the correct signature format being used.
