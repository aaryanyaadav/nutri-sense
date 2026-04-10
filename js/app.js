/** 
 * @file app.js 
 * @description Core Logic for NutriSense Health Tracker.
 * Handles user authentication, food/health logging, and dynamic charting.
 */

import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  doc,
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const authView = document.getElementById('auth-view');
const dashView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authError = document.getElementById('auth-error');

const userEmailDisplay = document.getElementById('user-email-display');
const streakDisplay = document.getElementById('streak-display');
const dailyCaloriesDisplay = document.getElementById('daily-calories');
const logsContainer = document.getElementById('logs-container');
const noLogsMsg = document.getElementById('no-logs');

// Profile DOM Elements
const profileView = document.getElementById('profile-view');
const btnEditProfile = document.getElementById('btn-edit-profile');
const btnBackDashboard = document.getElementById('btn-back-dashboard');
const btnSaveProfile = document.getElementById('btn-save-profile');
const profileNameInput = document.getElementById('profile-name');
const profileGoalInput = document.getElementById('profile-goal');
const profileHeightInput = document.getElementById('profile-height');
const profileWeightInput = document.getElementById('profile-weight');
const profileBmiDisplay = document.getElementById('profile-bmi');
const profileMsg = document.getElementById('profile-msg');
const userDisplayName = document.getElementById('user-display-name');
const dailyGoalDisplay = document.getElementById('daily-goal-display');
const chartTimeframe = document.getElementById('chart-timeframe');

// Profile Tabs DOM Elements
const tabBtnSettings = document.getElementById('tab-btn-settings');
const tabBtnHistory = document.getElementById('tab-btn-history');
const tabBtnHealth = document.getElementById('tab-btn-health');
const pSecSettings = document.getElementById('p-sec-settings');
const pSecHistory = document.getElementById('p-sec-history');
const pSecHealth = document.getElementById('p-sec-health');

// Health DOM Elements
const healthBpInput = document.getElementById('health-bp');
const healthSugarInput = document.getElementById('health-sugar');
const btnSaveHealth = document.getElementById('btn-save-health');
const healthMsg = document.getElementById('health-msg');
const healthLogsContainer = document.getElementById('health-logs-container');
const noHealthLogsMsg = document.getElementById('no-health-logs');

// Dashboard Additions
const dashHealthBpInput = document.getElementById('dash-health-bp');
const dashHealthSugarInput = document.getElementById('dash-health-sugar');
const btnDashSaveHealth = document.getElementById('btn-dash-save-health');
const dashHealthMsg = document.getElementById('dash-health-msg');
const dashLogsContainer = document.getElementById('dash-logs-container');
const dashNoLogsMsg = document.getElementById('dash-no-logs');
const dashHealthLogsContainer = document.getElementById('dash-health-logs-container');
const dashNoHealthLogsMsg = document.getElementById('dash-no-health-logs');

// State
let currentUser = null;
let currentChart = null;
let todayLogs = [];
let DAILY_LIMIT = 2000;
let userProfile = {};

// Utility functions
const getTodayString = () => {
  const d = new Date();
  // YYYY-MM-DD
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const showEl = (el) => el.classList.remove('hidden');
const hideEl = (el) => el.classList.add('hidden');

// ---- Auth Logic ----

document.getElementById('btn-show-signup').addEventListener('click', () => {
  hideEl(loginForm); showEl(signupForm); hideEl(authError);
});
document.getElementById('btn-show-login').addEventListener('click', () => {
  hideEl(signupForm); showEl(loginForm); hideEl(authError);
});

document.getElementById('btn-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value;
  const pwd = document.getElementById('login-pwd').value;
  try {
    await signInWithEmailAndPassword(auth, email, pwd);
  } catch (e) {
    showEl(authError);
    authError.innerText = "Login failed: " + e.message;
  }
});

document.getElementById('btn-signup').addEventListener('click', async () => {
  const email = document.getElementById('signup-email').value;
  const pwd = document.getElementById('signup-pwd').value;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pwd);
    // Initialize user doc
    await setDoc(doc(db, "users", cred.user.uid), {
      email: email,
      displayName: "",
      dailyGoal: 2000,
      height: "",
      weight: "",
      streak: 0,
      lastLogDate: ""
    });
  } catch (e) {
    showEl(authError);
    authError.innerText = "Signup failed: " + e.message;
  }
});

document.getElementById('btn-logout').addEventListener('click', () => {
  signOut(auth);
});

// Listener for auth state changes
if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      hideEl(authView);
      showEl(dashView);
      hideEl(profileView);
      await loadDashboardData();
    } else {
      currentUser = null;
      hideEl(dashView);
      showEl(authView);
    }
  });
} else {
  authError.innerText = 'Firebase is not configured. Please add config in firebase-config.js';
  showEl(authError);
}

// ---- Core Logic ----

/**
 * Fetches and renders all dashboard statistics, food logs, and health metrics
 * for the current day and the current logged-in user.
 * @async
 * @returns {Promise<void>}
 */
async function loadDashboardData() {
  if (!currentUser) return;
  const today = getTodayString();
  
  try {
    // 1. Fetch Food Logs for Today
    const q = query(
      collection(db, "logs"), 
      where("userId", "==", currentUser.uid),
      where("date", "==", today),
    );
    
    const querySnapshot = await getDocs(q);
    todayLogs = [];
    let totalCals = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      todayLogs.push({ id: doc.id, ...data });
      totalCals += data.calories;
    });
    
    // Sort and Render
    todayLogs.sort((a,b) => b.timestamp - a.timestamp);
    renderTodayLogs(todayLogs);
    
    // Update Daily Stats Display
    dailyCaloriesDisplay.innerText = totalCals;
    dailyCaloriesDisplay.style.color = totalCals > DAILY_LIMIT ? 'var(--tertiary)' : 'var(--primary)';
    
    // 2. Fetch User Profile Data
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      userProfile = userDocSnap.data();
      const streak = userProfile.streak || 0;
      DAILY_LIMIT = userProfile.dailyGoal || 2000;
      
      userDisplayName.innerText = userProfile.displayName || currentUser.email;
      if(dailyGoalDisplay) dailyGoalDisplay.innerText = DAILY_LIMIT;
      streakDisplay.innerText = `🔥 ${streak} Days`;
    }

    // 3. Render Trend Charts
    await renderChartData();

  } catch (error) {
    console.error("[NutriSense Error] Failed to load dashboard data:", error);
  }
}

// Removed local renderLogs because we will render history globally in renderChartData

document.getElementById('btn-add-food').addEventListener('click', async () => {
  const name = document.getElementById('food-name').value;
  const cals = parseInt(document.getElementById('food-cals').value, 10);
  const cat = document.getElementById('food-cat').value;
  
  if (!name || isNaN(cals)) {
    alert("Please enter valid food details.");
    return;
  }
  
  const today = getTodayString();
  try {
    // Add Log
    const newLogRef = await addDoc(collection(db, "logs"), {
      userId: currentUser.uid,
      date: today,
      foodName: name,
      calories: cals,
      category: cat,
      timestamp: Date.now()
    });

    // Update streak logic
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists()) {
      const uData = userDocSnap.data();
      let newStreak = uData.streak || 0;
      
      // Calculate yesterday's date string
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      if (uData.lastLogDate === yesterday) {
        // Logged yesterday, continuing streak
        newStreak++;
      } else if (uData.lastLogDate !== today) {
        // Did not log yesterday. If it's a gap, reset to 1
        newStreak = 1;
      }
      
      if (uData.lastLogDate !== today) {
         await setDoc(userDocRef, { streak: newStreak, lastLogDate: today }, { merge: true });
      }
    }

    // Reset Form
    document.getElementById('food-name').value = '';
    document.getElementById('food-cals').value = '';
    
    // Reload
    loadDashboardData();
  } catch (e) {
    console.error("Error adding doc:", e);
    alert("Failed to save entry. Check config.");
  }
});

function generateSmartSuggestions(totalCals, logs) {
  let suggestion = "";
  let isAlert = false;
  
  if (totalCals > DAILY_LIMIT) {
    suggestion = `You have exceeded your daily limit of ${DAILY_LIMIT} kcal by ${totalCals - DAILY_LIMIT} kcal. Drink water and try to balance your next meal.`;
    isAlert = true;
  } else {
    // Calculate category distribution
    let calsByCategory = { 'Breakfast': 0, 'Lunch': 0, 'Dinner': 0, 'Snacks': 0, 'Misc': 0 };
    logs.forEach(l => { if(calsByCategory[l.category] !== undefined) calsByCategory[l.category] += l.calories; });
    
    if (calsByCategory['Snacks'] > 500) {
      suggestion = "Your snacks account for a high portion of calories today. Try substituting with fruits or nuts tomorrow.";
    } else if (totalCals < (DAILY_LIMIT * 0.4) && (new Date().getHours() > 14)) {
       suggestion = "It's past 2 PM and you're well below your calorie goal. Make sure you fuel your body adequately!";
    } else {
       suggestion = "Great job tracking today! Keep maintaining this balanced streak.";
    }
  }

  if (suggestion) {
    showEl(aiSuggestionsPanel);
    aiSuggestionText.innerText = suggestion;
    
    if (isAlert) {
      aiSuggestionsPanel.style.borderLeftColor = 'var(--tertiary)';
      aiSuggestionsPanel.style.backgroundColor = 'rgba(255, 219, 208, 0.4)';
    } else {
      aiSuggestionsPanel.style.borderLeftColor = 'var(--primary)';
      aiSuggestionsPanel.style.backgroundColor = 'rgba(234, 247, 235, 1)';
    }
  } else {
    hideEl(aiSuggestionsPanel);
  }
}

// ---- Chart Logic ----

chartTimeframe?.addEventListener('change', renderChartData);

async function renderChartData() {
  if (!document.getElementById('caloriesChart')) return;
  const timeframe = chartTimeframe.value;
  
  const qAll = query(collection(db, "logs"), where("userId", "==", currentUser.uid));
  const snap = await getDocs(qAll);
  
  const labels = [];
  const chartData = [];
  
  if (timeframe === 'daily') {
    const dailyTotals = {};
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dates.push(str);
      dailyTotals[str] = 0;
    }
    snap.forEach(doc => {
      const d = doc.data();
      if (dailyTotals[d.date] !== undefined) dailyTotals[d.date] += d.calories;
    });
    labels.push(...dates.map(d => d.slice(5)));
    chartData.push(...dates.map(d => dailyTotals[d]));
  } 
  else if (timeframe === 'weekly') {
    const weeklyTotals = [0, 0, 0, 0];
    const now = new Date();
    now.setHours(0,0,0,0);
    snap.forEach(doc => {
      const d = doc.data();
      const logDate = new Date(d.date);
      const diffTime = Math.abs(now - logDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 7) weeklyTotals[3] += d.calories;
      else if (diffDays <= 14) weeklyTotals[2] += d.calories;
      else if (diffDays <= 21) weeklyTotals[1] += d.calories;
      else if (diffDays <= 28) weeklyTotals[0] += d.calories;
    });
    labels.push("3 Wks Ago", "2 Wks Ago", "Last Week", "This Week");
    chartData.push(...weeklyTotals);
  }
  else if (timeframe === 'monthly') {
    const monthlyTotals = [0, 0, 0, 0, 0, 0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const curMonth = new Date().getMonth(); 
    
    for(let i=5; i>=0; i--) {
       let m = curMonth - i;
       if (m < 0) m += 12;
       labels.push(monthNames[m]);
    }

    snap.forEach(doc => {
      const d = doc.data();
      const logDate = new Date(d.date);
      const logM = logDate.getMonth();
      const logY = logDate.getFullYear();
      
      const monthsAgo = (new Date().getFullYear() - logY) * 12 + (curMonth - logM);
      if (monthsAgo >= 0 && monthsAgo < 6) {
         monthlyTotals[5 - monthsAgo] += d.calories;
      }
    });
    chartData.push(...monthlyTotals);
  }
  
  // Update the Profile Food History safely since we already fetched all records here!
  const allLogsData = [];
  snap.forEach((docObj) => allLogsData.push({ id: docObj.id, ...docObj.data() }));
  allLogsData.sort((a,b) => b.timestamp - a.timestamp);
  renderHistoryLogs(allLogsData);
  
  const ctx = document.getElementById('caloriesChart').getContext('2d');
  
  if (currentChart) {
    currentChart.destroy();
  }
  
  currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Calories',
        data: chartData,
        backgroundColor: '#81d99e',
        borderColor: '#036c3c',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          suggestedMax: 2500,
          grid: {
            color: 'rgba(0,0,0,0.05)'
          }
        },
        x: {
          grid: {
             display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

// ---- Profile Logic ----

function updateBMI() {
  const h = parseFloat(profileHeightInput.value);
  const w = parseFloat(profileWeightInput.value);
  if (h > 0 && w > 0) {
    const bmi = w / ((h / 100) ** 2);
    profileBmiDisplay.innerText = bmi.toFixed(1);
    
    if (bmi < 18.5) profileBmiDisplay.style.color = 'var(--tertiary)';
    else if (bmi < 25) profileBmiDisplay.style.color = 'var(--primary)';
    else profileBmiDisplay.style.color = '#aa3500';
  } else {
    profileBmiDisplay.innerText = '--';
  }
}

profileHeightInput.addEventListener('input', updateBMI);
profileWeightInput.addEventListener('input', updateBMI);

btnEditProfile.addEventListener('click', () => {
  hideEl(dashView);
  showEl(profileView);
  hideEl(profileMsg);
  
  // Populate form
  profileNameInput.value = userProfile.displayName || "";
  profileGoalInput.value = userProfile.dailyGoal || 2000;
  profileHeightInput.value = userProfile.height || "";
  profileWeightInput.value = userProfile.weight || "";
  updateBMI();
});

btnBackDashboard.addEventListener('click', () => {
  hideEl(profileView);
  showEl(dashView);
});

btnSaveProfile.addEventListener('click', async () => {
  if (!currentUser) return;
  
  const name = profileNameInput.value.trim();
  const goal = parseInt(profileGoalInput.value, 10);
  const height = profileHeightInput.value.trim();
  const weight = profileWeightInput.value.trim();
  
  if (isNaN(goal) || goal <= 0) {
    alert("Please enter a valid daily goal.");
    return;
  }
  
  btnSaveProfile.innerText = "Saving...";
  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    await setDoc(userDocRef, {
      displayName: name,
      dailyGoal: goal,
      height: height,
      weight: weight
    }, { merge: true });
    
    showEl(profileMsg);
    profileMsg.innerText = "Profile successfully updated!";
    
    // Update local config
    userProfile.displayName = name;
    userProfile.dailyGoal = goal;
    userProfile.height = height;
    userProfile.weight = weight;
    DAILY_LIMIT = goal;
    
    // Update dashboard UI immediately
    userDisplayName.innerText = name || currentUser.email;
    if(dailyGoalDisplay) dailyGoalDisplay.innerText = DAILY_LIMIT;
    
    // Re-evaluate suggestions and colors based on new limit
    const totalCals = todayLogs.reduce((acc, l) => acc + l.calories, 0);
    dailyCaloriesDisplay.style.color = totalCals > DAILY_LIMIT ? 'var(--tertiary)' : 'var(--primary)';
    
  } catch (error) {
    console.error("Error saving profile", error);
    alert("Failed to save profile.");
  } finally {
    btnSaveProfile.innerText = "Save Changes";
  }
});

// Profile Tabbing Logic
function switchProfileTab(tab) {
  // Hide all sections
  hideEl(pSecSettings);
  hideEl(pSecHistory);
  hideEl(pSecHealth);
  
  // Reset buttons
  tabBtnSettings.style.background = 'transparent';
  tabBtnSettings.style.borderColor = 'transparent';
  tabBtnHistory.style.background = 'transparent';
  tabBtnHistory.style.borderColor = 'transparent';
  tabBtnHealth.style.background = 'transparent';
  tabBtnHealth.style.borderColor = 'transparent';
  
  if (tab === 'settings') {
    showEl(pSecSettings);
    tabBtnSettings.style.background = 'var(--surface-container-low)';
    tabBtnSettings.style.borderColor = 'var(--primary)';
  } else if (tab === 'history') {
    showEl(pSecHistory);
    tabBtnHistory.style.background = 'var(--surface-container-low)';
    tabBtnHistory.style.borderColor = 'var(--primary)';
  } else if (tab === 'health') {
    showEl(pSecHealth);
    tabBtnHealth.style.background = 'var(--surface-container-low)';
    tabBtnHealth.style.borderColor = 'var(--primary)';
    loadHealthData(); // Fetch real-time when switching to health tab
  }
}

tabBtnSettings.addEventListener('click', () => switchProfileTab('settings'));
tabBtnHistory.addEventListener('click', () => switchProfileTab('history'));
tabBtnHealth.addEventListener('click', () => switchProfileTab('health'));

function renderHistoryLogs(logs) {
  logsContainer.innerHTML = '';
  if (logs.length === 0) {
    showEl(noLogsMsg);
  } else {
    hideEl(noLogsMsg);
    let currentDate = null;
    
    logs.forEach(log => {
      if (log.date !== currentDate) {
        currentDate = log.date;
        const header = document.createElement('h4');
        header.style.marginTop = '16px';
        header.style.marginBottom = '8px';
        header.style.borderBottom = '1px solid var(--outline-variant)';
        header.style.paddingBottom = '4px';
        header.style.color = 'var(--primary)';
        header.innerText = currentDate;
        logsContainer.appendChild(header);
      }
      
      const div = document.createElement('div');
      div.className = 'log-item';
      div.innerHTML = `
        <div class="log-meta">
          <h4>${log.foodName}</h4>
          <span>${log.category}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="log-calories">${log.calories} kcal</div>
          <button onclick="window.deleteFoodLog('${log.id}')" style="background:none; border:none; color: var(--tertiary); cursor:pointer;">❌</button>
        </div>
      `;
      logsContainer.appendChild(div);
    });
  }
}

window.deleteFoodLog = async (id) => {
  if (!confirm("Are you sure you want to delete this log?")) return;
  try {
    await deleteDoc(doc(db, "logs", id));
    loadDashboardData();
  } catch (e) {
    console.error("Error deleting log:", e);
    alert("Failed to delete log.");
  }
};

window.deleteHealthLog = async (id) => {
  if (!confirm("Are you sure you want to delete this health record?")) return;
  try {
    await deleteDoc(doc(db, "health_metrics", id));
    loadHealthData();
  } catch (e) {
    console.error("Error deleting health record:", e);
    alert("Failed to delete health record.");
  }
};

function renderTodayLogs(logs) {
  if (!dashLogsContainer) return;
  dashLogsContainer.innerHTML = '';
  if (logs.length === 0) {
    showEl(dashNoLogsMsg);
  } else {
    hideEl(dashNoLogsMsg);
    logs.forEach(log => {
      const div = document.createElement('div');
      div.className = 'log-item';
      div.innerHTML = `
        <div class="log-meta">
          <h4>${log.foodName}</h4>
          <span>${log.category}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="log-calories">${log.calories} kcal</div>
          <button onclick="window.deleteFoodLog('${log.id}')" style="background:none; border:none; color: var(--tertiary); cursor:pointer;">❌</button>
        </div>
      `;
      dashLogsContainer.appendChild(div);
    });
  }
}

// ---- Health Logic ----

btnSaveHealth.addEventListener('click', async () => {
  if (!currentUser) return;
  const bp = healthBpInput.value.trim();
  const sugar = parseInt(healthSugarInput.value, 10);
  
  if (!bp && isNaN(sugar)) {
    alert("Please enter either Blood Pressure or Sugar level.");
    return;
  }
  
  btnSaveHealth.innerText = "Saving...";
  try {
    await addDoc(collection(db, "health_metrics"), {
      userId: currentUser.uid,
      date: getTodayString(),
      bloodPressure: bp,
      bloodSugar: isNaN(sugar) ? null : sugar,
      timestamp: Date.now()
    });
    showEl(healthMsg);
    healthMsg.innerText = "Health metric logged successfully!";
    healthBpInput.value = '';
    healthSugarInput.value = '';
    
    // Refresh records
    loadHealthData();
  } catch (e) {
    console.error("Error saving health log:", e);
    alert("Fail to save health metric.");
  } finally {
    btnSaveHealth.innerText = "Save Metrics";
  }
});

btnDashSaveHealth?.addEventListener('click', async () => {
  if (!currentUser) return;
  const bp = dashHealthBpInput.value.trim();
  const sugar = parseInt(dashHealthSugarInput.value, 10);
  
  if (!bp && isNaN(sugar)) {
    alert("Please enter either Blood Pressure or Sugar level.");
    return;
  }
  
  btnDashSaveHealth.innerText = "Saving...";
  try {
    await addDoc(collection(db, "health_metrics"), {
      userId: currentUser.uid,
      date: getTodayString(),
      bloodPressure: bp,
      bloodSugar: isNaN(sugar) ? null : sugar,
      timestamp: Date.now()
    });
    showEl(dashHealthMsg);
    dashHealthMsg.innerText = "Health metric logged successfully!";
    dashHealthBpInput.value = '';
    dashHealthSugarInput.value = '';
    
    setTimeout(() => hideEl(dashHealthMsg), 3000); // Auto-hide after 3s
    loadHealthData();
  } catch (e) {
    console.error("Error saving health log:", e);
    alert("Fail to save health metric.");
  } finally {
    btnDashSaveHealth.innerText = "Add Health Data";
  }
});

async function loadHealthData() {
  if (!currentUser) return;
  
  const qHealth = query(
    collection(db, "health_metrics"), 
    where("userId", "==", currentUser.uid)
  );
  
  try {
    const snap = await getDocs(qHealth);
    const hData = [];
    snap.forEach(docObj => hData.push({ id: docObj.id, ...docObj.data() }));
    hData.sort((a,b) => b.timestamp - a.timestamp);
    
    healthLogsContainer.innerHTML = '';
    const todayStr = getTodayString();
    
    if (dashHealthLogsContainer) dashHealthLogsContainer.innerHTML = '';
    const todayHData = [];
    
    if (hData.length === 0) {
      showEl(noHealthLogsMsg);
      if (dashNoHealthLogsMsg) showEl(dashNoHealthLogsMsg);
    } else {
      hideEl(noHealthLogsMsg);
      if (dashNoHealthLogsMsg) hideEl(dashNoHealthLogsMsg);
      
      hData.forEach(h => {
        const div = document.createElement('div');
        div.className = 'log-item';
        let vals = [];
        if (h.bloodPressure) vals.push(`BP: ${h.bloodPressure}`);
        if (h.bloodSugar) vals.push(`Sugar: ${h.bloodSugar} mg/dL`);
        
        div.innerHTML = `
          <div class="log-meta">
            <h4>Record <span style="font-size: 0.75rem; color: var(--tertiary); font-weight: 500; border: 1px solid var(--tertiary-container); border-radius: 4px; padding: 2px 4px; margin-left: 6px;">${h.date}</span></h4>
            <span>${vals.join(' | ')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <button onclick="window.deleteHealthLog('${h.id}')" style="background:none; border:none; color: var(--tertiary); cursor:pointer;">❌</button>
          </div>
        `;
        healthLogsContainer.appendChild(div);
        
        // Populate Today's Health logs for dashboard
        if (h.date === todayStr) {
          todayHData.push(h);
          if (dashHealthLogsContainer) {
            const dDiv = div.cloneNode(true);
            dashHealthLogsContainer.appendChild(dDiv);
          }
        }
      });
      
      if (todayHData.length === 0 && dashNoHealthLogsMsg) {
        showEl(dashNoHealthLogsMsg);
      }
    }
  } catch (e) {
    console.error("Failed to load health info.");
  }
}
