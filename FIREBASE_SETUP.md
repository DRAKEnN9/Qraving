# Firebase Google Authentication Setup

## Quick Start Guide

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or use existing project
3. Follow the setup wizard

### 2. Enable Google Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Toggle **Enable** and click **Save**
4. Add your domain to **Authorized domains** (e.g., `localhost`, `yourdomain.com`)

### 3. Get Web App Configuration
1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll to "Your apps" section
3. Click **Web app** icon (`</>`) to add or select existing web app
4. Copy the config object values

### 4. Environment Variables Required

Add these to your `.env.local` file:

```env
# Firebase Client Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (Private - Server Side)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your_project_id",...}'
```

### 5. Generate Service Account Key
1. Go to **Project Settings** → **Service accounts** tab
2. Click **Generate new private key**
3. Download the JSON file
4. **Minify the JSON** (remove spaces/newlines) and set as `FIREBASE_SERVICE_ACCOUNT_KEY`

Example minified format:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQ...","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}'
```

## Firebase Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use existing
   - Enable Authentication

2. **Enable Google Sign-In**
   - Go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

3. **Get Web App Config**
   - Go to Project Settings > General
   - Add a web app if not exists
   - Copy the config object values to env variables

4. **Generate Service Account Key**
   - Go to Project Settings > Service accounts
   - Generate new private key (JSON file)
   - Minify the JSON and set as `FIREBASE_SERVICE_ACCOUNT_KEY`

5. **Configure OAuth Consent Screen**
   - Go to Google Cloud Console
   - Configure OAuth consent screen
   - Add test users if in development

## Usage Flow

1. **Login with Google** - No password required for existing users
2. **Signup with Google** - User must create a password after Google authentication
3. **Existing users** - Can link their Google account and continue without additional password

## Security Notes

- Service account key should be kept secure
- Use environment variables for all sensitive data
- Configure authorized domains properly
- Review OAuth scopes requested
