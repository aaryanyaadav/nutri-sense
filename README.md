# 🥗 NutriSense - Smart Food & Health Tracking App

NutriSense is a beautifully designed, minimalist web application built to help users seamlessly track their daily caloric intake, monitor long-term diet trends, and log key cardiovascular health metrics. 

Designed with a modern "Digital Sanctuary" neomorphic UI, NutriSense focuses heavily on an intuitive, distraction-free user experience, keeping your data secure and exclusively yours via Firebase.

---

## ✨ Features

- **Auth & Secure Profiles:** Email/Password authentication. Profiles save daily caloric limit goals, height, weight, and automatically compute your Body Mass Index (BMI).
- **Macro Logging:** Log unlimited meals rapidly, categorized by Breakfast, Lunch, Dinner, Snacks, and Misc.
- **Dynamic Charting:** Visualize your caloric intake trends toggling between a 7-day, 4-week, and 6-month historical perspective using `Chart.js`.
- **Robust Food History:** Easily review separated, chronologically date-bracketed timelines of your entire food history. Instantly delete errant logs.
- **Health Metrics:** A parallel system for daily tracking of Blood Pressure and Blood Sugar records, instantly accessible directly from the dashboard and aggregated in your permanent Profile timeline.
- **Micro-Animations & Neomorphism:** Buttery smooth CSS styling drawing heavily on modern soft-UI rendering techniques bridging glassmorphism and soft shadows.

---

## 🛠 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6 Modules)
- **Data Visualization:** Chart.js 
- **Backend (BaaS):** Firebase (v10.8.1)
  - Firebase Authentication
  - Cloud Firestore (NoSQL Database)
- **Hosting / Running:** Any local dev server (`npx serve`, VS Code Live Server)

---

## 🚀 Local Setup Guide

This guide will walk you through setting up your Firebase backend (Authentication and Firestore Database) and linking it to the NutriSense application.

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** (or **Create a project**).
3. Name your project (e.g., "NutriSense").

### Step 2: Enable User Authentication
1. In your Firebase project dashboard, click **Build** -> **Authentication**.
2. Click **Get Started**, then click the **Sign-in method** tab.
3. Click on **Email/Password** and toggle **Enable**. Save.

### Step 3: Setup Firestore Database
1. In the left-hand sidebar, click **Build** -> **Firestore Database**.
2. Click **Create database** -> Select **Start in test mode** -> **Create**.

### Step 4: Get Your Configuration Keys
1. Go to the Firebase console homepage -> **Project settings (gear icon)**.
2. Under **Your apps**, click the **Web icon (`</>`)**.
3. Register the app to receive your `firebaseConfig` keys.
4. Open the local file at `js/firebase-config.js` and paste your specific keys inside the placeholder `firebaseConfig` object.

### Step 5: Secure Your Database (Mandatory)
Right now, anyone can read your test database. Let's restrict it so users only access their own private data.
1. Go back to **Firestore Database** -> click the **Rules** tab at the top.
2. Replace all existing code with the following and click **Publish**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users profile rule
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Food logs rule
    match /logs/{logId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Health metrics rule
    match /health_metrics/{metricId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Step 6: Running the App!
Because the app uses modules (`<script type="module">`), you can't just double-click the `index.html` file in your File Explorer. It must be hosted on a local server.

**Option A - VS Code (Recommended)**:
1. Install the `Live Server` extension.
2. Right-click on `index.html` and select **Open with Live Server**.

**Option B - Node.js**:
1. Open your terminal in this project folder.
2. Run `npx serve .` 
3. Open `http://localhost:3000` in your browser.
