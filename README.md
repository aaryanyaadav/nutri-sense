# NutriSense - Project Setup & Database Guide

This guide will walk you through setting up your Firebase backend (Authentication and Firestore Database) and linking it to the NutriSense application.

## Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., "NutriSense") and click **Continue**.
4. (Optional) Disable Google Analytics for this test project and click **Create Project**.

---

## Step 2: Enable User Authentication
Users need to log in to track their specific calories and streaks.
1. In your Firebase project dashboard, look at the left-hand sidebar and click **Build** -> **Authentication**.
2. Click the **Get Started** button.
3. Click the **Sign-in method** tab at the top.
4. Click on **Email/Password** (under the "Native" providers list).
5. Toggle **Enable** on the first option (Email/Password) and click **Save**.

---

## Step 3: Setup Firestore Database
This is where user streaks and food logs are stored.
1. In the left-hand sidebar, click **Build** -> **Firestore Database**.
2. Click the **Create database** button.
3. Select your preferred physical location/region (leave default if unsure) and click **Next**.
4. Select **Start in test mode** and click **Create**.
   *(Note: Test mode allows open reading/writing for 30 days. We will secure it in Step 5).*

---

## Step 4: Get Your Configuration Keys
Connect your local code to your new Firebase backend.
1. Go to the Firebase console homepage by clicking the **Settings (gear icon)** -> **Project settings** in the top left.
2. Scroll down to the **Your apps** section and click the **Web icon (`</>`)**.
3. Give your app a nickname (e.g., "nutrisense-web") and click **Register app**.
4. You will see a block of code with a `firebaseConfig` object. It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...xxxx",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
5. **Copy only those configuration keys**.
6. Open your local file at `js/firebase-config.js` and paste your specific keys inside the placeholder `firebaseConfig` object. Save the file.

---

## Step 5: Secure Your Database (Highly Recommended)
Right now, anyone can read your test database. Let's lock it down so users can only access their own logs.
1. Go back to **Firestore Database** -> click the **Rules** tab at the top.
2. Delete the existing rules and paste the following exactly:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read, write, and see their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only create logs tied to their own ID, and read their own logs
    match /logs/{logId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
  }
}
```
3. Click **Publish**.

---

## Step 6: Running the App!
Because the app uses modules (`<script type="module">`), you can't just double-click the `index.html` file in your File Explorer. It must be hosted on a local server.

**Option A - VS Code (Easiest)**:
1. Install the `Live Server` extension by Ritwick Dey.
2. Right-click on `index.html` and select **Open with Live Server**.

**Option B - Node.js**:
1. Open your terminal in this project folder.
2. Run `npx serve .` or `npx http-server`.
3. Open `http://localhost:3000` (or whatever URL it provides) in your browser.
