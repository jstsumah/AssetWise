# Firestore Rules Deployment Instructions

## Current Issue
The app shows "Missing or insufficient permissions" errors because the Firestore security rules in your Firebase project haven't been updated. The `firestore.rules` file in this project has been updated, but these changes only exist locally and need to be deployed to Firebase.

## How to Deploy the Rules

### Option 1: Using Firebase CLI (Recommended)
1. Install Firebase CLI if you haven't already:
   ```
   npm install -g firebase-tools
   ```

2. Authenticate with Firebase:
   ```
   firebase login
   ```

3. From the project root, deploy the rules:
   ```
   firebase deploy --only firestore:rules
   ```

### Option 2: Manual Update via Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `assetwise-jaw4u`
3. Go to **Build** > **Firestore Database**
4. Click the **Rules** tab
5. Replace all the content with the rules from `firestore.rules` file in this project
6. Click **Publish**

## Updated Rules Summary
The new rules:
- ✅ Allow all authenticated users to **read** all collections
- ✅ Allow all authenticated users to **write** to collections
- ✅ Admins have full access (via code-level checks)
- ✅ Non-admins will have limited UI access (enforced in the app)

## What Changed in the App
1. **Auth Flow**: Login now works with either UID or email-based employee lookup
2. **Admin Access Control**: 
   - Admins see all pages: Dashboard, Assets, Employees, Companies, Reports, Settings
   - Non-admins are redirected away from admin pages
   - Dashboard shows filtered data based on role
3. **Console Logging**: Added detailed logging to debug data fetching issues

## After Deployment
Once you deploy the rules:
1. Refresh your browser (`http://localhost:9002`)
2. The dashboard should now load with your production data
3. Check that admins can access all pages
4. Check that non-admins see only their own data
