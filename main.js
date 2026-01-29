// Firebase কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyCLVNqwyxyCRUlHJjPximCa9J_o1idn6C8",
    authDomain: "video-b71ed.firebaseapp.com",
    databaseURL: "https://video-b71ed-default-rtdb.firebaseio.com",
    projectId: "video-b71ed",
    storageBucket: "video-b71ed.firebasestorage.app",
    messagingSenderId: "641495253298",
    appId: "1:641495253298:web:805f370986d1d0e63f572b"
};

// Firebase মডিউল ইমপোর্ট
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { 
    getDatabase, 
    ref, 
    set, 
    update, 
    remove, 
    onValue, 
    push,
    child,
    get
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js';

// Firebase ইনিশিয়ালাইজ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// গ্লোবাল ভেরিয়েবল
let currentAdmin = null;
let adsConfig = null;
let appsData = null;

// ইউটিলিটি ফাংশন
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showAlert(message, type = 'error') {
    let alertElement = document.getElementById('loginAlert');
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'loginAlert';
        document.querySelector('.login-container').appendChild(alertElement);
    }
    
    alertElement.textContent = message;
    alertElement.className = `login-alert ${type}`;
    alertElement.style.display = 'block';
    
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}

// অথেনটিকেশন স্টেট মনিটর
function checkAuthState() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // লগইন করা আছে
            currentAdmin = user;
            
            // যদি লগইন পেজে থাকি, তাহলে ড্যাশবোর্ডে রিডাইরেক্ট
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname.endsWith('/')) {
                window.location.href = 'dashboard.html';
            } else {
                // অন্য পেজে হলে অ্যাডমিন ইনফো আপডেট
                updateAdminInfo();
                loadDashboardData();
                loadAdsConfig();
            }
        } else {
            // লগআউট করা
            currentAdmin = null;
            
            // যদি লগইন পেজে না থাকি, তাহলে লগইন পেজে রিডাইরেক্ট
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
        }
    });
}

// অ্যাডমিন ইনফো আপডেট
function updateAdminInfo() {
    if (!currentAdmin) return;
    
    const adminNameElements = document.querySelectorAll('#adminName');
    const adminEmailElements = document.querySelectorAll('#adminEmail');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    const displayName = currentAdmin.displayName || currentAdmin.email.split('@')[0];
    const email = currentAdmin.email;
    
    adminNameElements.forEach(el => {
        if (el) el.textContent = displayName;
    });
    
    adminEmailElements.forEach(el => {
        if (el) el.textContent = email;
    });
    
    if (welcomeMessage) {
        welcomeMessage.textContent = `স্বাগতম, ${displayName}!`;
    }
}

// লগইন ফর্ম হ্যান্ডলিং
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const showPasswordBtn = document.getElementById('showPassword');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showAlert('ইমেইল এবং পাসওয়ার্ড দিন', 'error');
                return;
            }
            
            try {
                showLoading();
                await signInWithEmailAndPassword(auth, email, password);
                showAlert('লগইন সফল!', 'success');
            } catch (error) {
                console.error('লগইন এরর:', error);
                let errorMessage = 'লগইন ব্যর্থ হয়েছে';
                
                if (error.code === 'auth/invalid-email') {
                    errorMessage = 'ইনভ্যালিড ইমেইল ঠিকানা';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'এই অ্যাকাউন্ট ডিজেবল করা আছে';
                } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = 'ভুল ইমেইল বা পাসওয়ার্ড';
                }
                
                showAlert(errorMessage, 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    if (showPasswordBtn) {
        showPasswordBtn.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const icon = showPasswordBtn.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                passwordInput.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }
}

// লগআউট ফাংশন
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                showLoading();
                await signOut(auth);
            } catch (error) {
                console.error('লগআউট এরর:', error);
                showAlert('লগআউট ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// সাইডবার টগল
function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('collapsed');
        });
    }
}

// সাবমেনু টগল
function setupSubmenus() {
    const appsManagement = document.getElementById('appsManagement');
    const noticeManagement = document.getElementById('noticeManagement');
    
    if (appsManagement) {
        appsManagement.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = appsManagement.nextElementSibling;
            submenu.classList.toggle('active');
        });
    }
    
    if (noticeManagement) {
        noticeManagement.addEventListener('click', (e) => {
            e.preventDefault();
            const submenu = noticeManagement.nextElementSibling;
            submenu.classList.toggle('active');
        });
    }
}

// Firebase থেকে এডস কনফিগারেশন লোড
async function loadAdsConfig() {
    return new Promise((resolve, reject) => {
        const adsRef = ref(database, 'ads');
        
        onValue(adsRef, (snapshot) => {
            adsConfig = snapshot.val() || {
                enabled: false,
                banner: { enabled: false, script: '' },
                native: { enabled: false, script: '' },
                socialBar: { enabled: false, script: '' },
                interstitial: { enabled: false, script: '' }
            };
            console.log('এডস কনফিগ লোড হয়েছে:', adsConfig);
            updateAdsUI();
            resolve(adsConfig);
        }, (error) => {
            console.error('এডস কনফিগ লোড করতে এরর:', error);
            reject(error);
        });
    });
}

// এডস UI আপডেট
function updateAdsUI() {
    if (!adsConfig) return;
    
    // গ্লোবাল টগল
    const globalAdsToggle = document.getElementById('globalAdsToggle');
    const globalAdsLabel = document.getElementById('globalAdsLabel');
    const globalStatusBadge = document.getElementById('globalStatusBadge');
    
    if (globalAdsToggle) {
        globalAdsToggle.checked = adsConfig.enabled || false;
        updateGlobalToggleLabel();
    }
    
    if (globalStatusBadge) {
        globalStatusBadge.textContent = adsConfig.enabled ? 'অনলাইন' : 'অফলাইন';
        globalStatusBadge.className = `status-badge ${adsConfig.enabled ? 'success' : 'danger'}`;
    }
    
    // ব্যানার এড
    const bannerAdToggle = document.getElementById('bannerAdToggle');
    const bannerScript = document.getElementById('bannerScript');
    if (bannerAdToggle && adsConfig.banner) {
        bannerAdToggle.checked = adsConfig.banner.enabled || false;
    }
    if (bannerScript && adsConfig.banner) {
        bannerScript.value = adsConfig.banner.script || '';
    }
    
    // নেটিভ এড
    const nativeAdToggle = document.getElementById('nativeAdToggle');
    const nativeScript = document.getElementById('nativeScript');
    if (nativeAdToggle && adsConfig.native) {
        nativeAdToggle.checked = adsConfig.native.enabled || false;
    }
    if (nativeScript && adsConfig.native) {
        nativeScript.value = adsConfig.native.script || '';
    }
    
    // সোশ্যাল বার এড
    const socialBarAdToggle = document.getElementById('socialBarAdToggle');
    const socialBarScript = document.getElementById('socialBarScript');
    if (socialBarAdToggle && adsConfig.socialBar) {
        socialBarAdToggle.checked = adsConfig.socialBar.enabled || false;
    }
    if (socialBarScript && adsConfig.socialBar) {
        socialBarScript.value = adsConfig.socialBar.script || '';
    }
    
    // ইন্টারস্টিশিয়াল এড
    const interstitialAdToggle = document.getElementById('interstitialAdToggle');
    const interstitialScript = document.getElementById('interstitialScript');
    if (interstitialAdToggle && adsConfig.interstitial) {
        interstitialAdToggle.checked = adsConfig.interstitial.enabled || false;
    }
    if (interstitialScript && adsConfig.interstitial) {
        interstitialScript.value = adsConfig.interstitial.script || '';
    }
    
    // ড্যাশবোর্ড স্ট্যাটাস
    const adsStatusElement = document.getElementById('adsStatus');
    if (adsStatusElement) {
        adsStatusElement.textContent = adsConfig.enabled ? 'ON' : 'OFF';
    }
}

// গ্লোবাল টগল লেবেল আপডেট
function updateGlobalToggleLabel() {
    const globalAdsToggle = document.getElementById('globalAdsToggle');
    const globalAdsLabel = document.getElementById('globalAdsLabel');
    
    if (globalAdsToggle && globalAdsLabel) {
        globalAdsLabel.textContent = globalAdsToggle.checked ? 'সব এডস ON' : 'সব এডস OFF';
    }
}

// এডস সেভ ফাংশন
function setupAdsSave() {
    // গ্লোবাল টগল
    const globalAdsToggle = document.getElementById('globalAdsToggle');
    if (globalAdsToggle) {
        globalAdsToggle.addEventListener('change', async () => {
            adsConfig.enabled = globalAdsToggle.checked;
            updateGlobalToggleLabel();
            
            try {
                showLoading();
                await set(ref(database, 'ads'), adsConfig);
                showAlert('এডস স্ট্যাটাস আপডেট করা হয়েছে!', 'success');
            } catch (error) {
                console.error('এডস সেভ এরর:', error);
                showAlert('আপডেট ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // সব এডস ON/OFF বাটন
    const enableAllAds = document.getElementById('enableAllAds');
    const disableAllAds = document.getElementById('disableAllAds');
    
    if (enableAllAds) {
        enableAllAds.addEventListener('click', async () => {
            adsConfig.enabled = true;
            if (adsConfig.banner) adsConfig.banner.enabled = true;
            if (adsConfig.native) adsConfig.native.enabled = true;
            if (adsConfig.socialBar) adsConfig.socialBar.enabled = true;
            if (adsConfig.interstitial) adsConfig.interstitial.enabled = true;
            
            try {
                showLoading();
                await set(ref(database, 'ads'), adsConfig);
                updateAdsUI();
                showAlert('সব এডস ON করা হয়েছে!', 'success');
            } catch (error) {
                console.error('এডস ON এরর:', error);
                showAlert('ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    if (disableAllAds) {
        disableAllAds.addEventListener('click', async () => {
            adsConfig.enabled = false;
            if (adsConfig.banner) adsConfig.banner.enabled = false;
            if (adsConfig.native) adsConfig.native.enabled = false;
            if (adsConfig.socialBar) adsConfig.socialBar.enabled = false;
            if (adsConfig.interstitial) adsConfig.interstitial.enabled = false;
            
            try {
                showLoading();
                await set(ref(database, 'ads'), adsConfig);
                updateAdsUI();
                showAlert('সব এডস OFF করা হয়েছে!', 'success');
            } catch (error) {
                console.error('এডস OFF এরর:', error);
                showAlert('ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
    
    // আলাদা আলাদা এড সেভ
    setupIndividualAdSave('banner', 'saveBannerScript', 'bannerAdToggle', 'bannerScript');
    setupIndividualAdSave('native', 'saveNativeScript', 'nativeAdToggle', 'nativeScript');
    setupIndividualAdSave('socialBar', 'saveSocialBarScript', 'socialBarAdToggle', 'socialBarScript');
    setupIndividualAdSave('interstitial', 'saveInterstitialScript', 'interstitialAdToggle', 'interstitialScript');
    
    // সব একসাথে সেভ
    const saveAllAds = document.getElementById('saveAllAds');
    if (saveAllAds) {
        saveAllAds.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // সব স্ক্রিপ্ট আপডেট
            updateAdConfigFromUI();
            
            try {
                showLoading();
                await set(ref(database, 'ads'), adsConfig);
                showAlert('সব এডস সেটিংস সফলভাবে সেভ হয়েছে!', 'success');
            } catch (error) {
                console.error('এডস সেভ এরর:', error);
                showAlert('সেভ ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// আলাদা এড সেভ ফাংশন
function setupIndividualAdSave(adType, buttonId, toggleId, scriptId) {
    const saveButton = document.getElementById(buttonId);
    if (saveButton) {
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const toggle = document.getElementById(toggleId);
            const script = document.getElementById(scriptId);
            
            if (!adsConfig[adType]) {
                adsConfig[adType] = {};
            }
            
            adsConfig[adType].enabled = toggle.checked;
            adsConfig[adType].script = script.value;
            
            try {
                showLoading();
                await update(ref(database, `ads/${adType}`), adsConfig[adType]);
                showAlert(`${adType} এড সফলভাবে সেভ হয়েছে!`, 'success');
            } catch (error) {
                console.error(`${adType} এড সেভ এরর:`, error);
                showAlert('সেভ ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        });
    }
}

// UI থেকে এড কনফিগ আপডেট
function updateAdConfigFromUI() {
    // গ্লোবাল
    const globalAdsToggle = document.getElementById('globalAdsToggle');
    if (globalAdsToggle) {
        adsConfig.enabled = globalAdsToggle.checked;
    }
    
    // ব্যানার
    const bannerAdToggle = document.getElementById('bannerAdToggle');
    const bannerScript = document.getElementById('bannerScript');
    if (bannerAdToggle && bannerScript) {
        if (!adsConfig.banner) adsConfig.banner = {};
        adsConfig.banner.enabled = bannerAdToggle.checked;
        adsConfig.banner.script = bannerScript.value;
    }
    
    // নেটিভ
    const nativeAdToggle = document.getElementById('nativeAdToggle');
    const nativeScript = document.getElementById('nativeScript');
    if (nativeAdToggle && nativeScript) {
        if (!adsConfig.native) adsConfig.native = {};
        adsConfig.native.enabled = nativeAdToggle.checked;
        adsConfig.native.script = nativeScript.value;
    }
    
    // সোশ্যাল বার
    const socialBarAdToggle = document.getElementById('socialBarAdToggle');
    const socialBarScript = document.getElementById('socialBarScript');
    if (socialBarAdToggle && socialBarScript) {
        if (!adsConfig.socialBar) adsConfig.socialBar = {};
        adsConfig.socialBar.enabled = socialBarAdToggle.checked;
        adsConfig.socialBar.script = socialBarScript.value;
    }
    
    // ইন্টারস্টিশিয়াল
    const interstitialAdToggle = document.getElementById('interstitialAdToggle');
    const interstitialScript = document.getElementById('interstitialScript');
    if (interstitialAdToggle && interstitialScript) {
        if (!adsConfig.interstitial) adsConfig.interstitial = {};
        adsConfig.interstitial.enabled = interstitialAdToggle.checked;
        adsConfig.interstitial.script = interstitialScript.value;
    }
}

// ড্যাশবোর্ড ডেটা লোড
async function loadDashboardData() {
    try {
        // মোট অ্যাপস কাউন্ট
        const appsRef = ref(database, 'apps');
        const snapshot = await get(appsRef);
        
        if (snapshot.exists()) {
            appsData = snapshot.val();
            updateDashboardStats();
        }
    } catch (error) {
        console.error('ড্যাশবোর্ড ডেটা লোড এরর:', error);
    }
}

// ড্যাশবোর্ড স্ট্যাটস আপডেট
function updateDashboardStats() {
    if (!appsData) return;
    
    const appsArray = Object.values(appsData);
    const totalApps = appsArray.length;
    const activeApps = totalApps;
    const unlockedApps = appsArray.filter(app => !app.locked).length;
    const lockedApps = appsArray.filter(app => app.locked).length;
    
    // এলিমেন্ট আপডেট
    document.getElementById('totalApps').textContent = totalApps;
    document.getElementById('activeApps').textContent = activeApps;
    document.getElementById('unlockedApps').textContent = unlockedApps;
    document.getElementById('lockedApps').textContent = lockedApps;
    
    // সাম্প্রতিক অ্যাপস টেবিল
    updateRecentAppsTable(appsArray.slice(0, 5));
}

// সাম্প্রতিক অ্যাপস টেবিল আপডেট
function updateRecentAppsTable(apps) {
    const tableBody = document.getElementById('recentAppsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    apps.forEach(app => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="app-info-small">
                    <i class="${app.icon || 'fas fa-mobile-alt'}"></i>
                    <span>${app.name}</span>
                </div>
            </td>
            <td>v${app.version || '1.0'}</td>
            <td>
                <span class="status-badge ${app.locked ? 'danger' : 'success'}">
                    ${app.locked ? 'লক করা' : 'অ্যাকটিভ'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm ${app.locked ? 'btn-success' : 'btn-danger'} toggle-lock-btn" 
                        data-app-id="${app.id}" data-locked="${app.locked}">
                    ${app.locked ? 'আনলক করুন' : 'লক করুন'}
                </button>
            </td>
            <td>
                <a href="edit-app.html?id=${app.id}" class="btn btn-outline btn-sm">
                    <i class="fas fa-edit"></i> এডিট
                </a>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// অ্যাপ লক/আনলক ফাংশন
function setupAppLockToggle() {
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('toggle-lock-btn')) {
            const appId = e.target.dataset.appId;
            const isLocked = e.target.dataset.locked === 'true';
            
            try {
                showLoading();
                await update(ref(database, `apps/${appId}`), {
                    locked: !isLocked
                });
                showAlert(`অ্যাপ ${!isLocked ? 'লক' : 'আনলক'} করা হয়েছে!`, 'success');
                
                // UI আপডেট
                e.target.dataset.locked = !isLocked;
                e.target.textContent = !isLocked ? 'লক করুন' : 'আনলক করুন';
                e.target.className = `btn btn-sm ${!isLocked ? 'btn-danger' : 'btn-success'} toggle-lock-btn`;
                
            } catch (error) {
                console.error('অ্যাপ লক/আনলক এরর:', error);
                showAlert('ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
        }
    });
}

// নতুন অ্যাপ যোগ ফর্ম
function setupAddAppForm() {
    const addAppForm = document.getElementById('addAppForm');
    if (!addAppForm) return;
    
    addAppForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const appData = {
            id: Date.now().toString(),
            name: document.getElementById('appName').value,
            category: document.getElementById('appCategory').value,
            version: document.getElementById('appVersion').value,
            size: document.getElementById('appSize').value,
            icon: document.getElementById('appIcon').value,
            order: parseInt(document.getElementById('appOrder').value) || 1,
            shortDescription: document.getElementById('shortDescription').value,
            description: document.getElementById('fullDescription').value,
            developer: document.getElementById('appDeveloper').value,
            downloads: document.getElementById('appDownloads').value || '1K+',
            rating: document.getElementById('appRating').value || '4.5',
            lastUpdated: document.getElementById('lastUpdated').value || 'সাম্প্রতিক',
            locked: document.getElementById('appLocked').checked,
            premium: document.getElementById('appPremium').checked,
            downloadUrl: document.getElementById('downloadUrl').value,
            features: document.getElementById('appFeatures').value.split('\n').filter(f => f.trim())
        };
        
        try {
            showLoading();
            await set(ref(database, `apps/${appData.id}`), appData);
            showAlert('অ্যাপ সফলভাবে যোগ করা হয়েছে!', 'success');
            addAppForm.reset();
        } catch (error) {
            console.error('অ্যাপ যোগ এরর:', error);
            showAlert('অ্যাপ যোগ ব্যর্থ হয়েছে', 'error');
        } finally {
            hideLoading();
        }
    });
}

// সব অ্যাপস দেখুন লিংক
function setupViewAppsLink() {
    const viewAppsLinks = document.querySelectorAll('#viewApps, #viewAllApps');
    viewAppsLinks.forEach(link => {
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'edit-app.html';
            });
        }
    });
}

// অ্যাপ প্রিভিউ ফাংশন
function setupAppPreview() {
    const previewBtn = document.getElementById('previewBtn');
    const closePreview = document.getElementById('closePreview');
    const modal = document.getElementById('appPreviewModal');
    
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            generateAppPreview();
            if (modal) modal.style.display = 'flex';
        });
    }
    
    if (closePreview) {
        closePreview.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
        });
    }
    
    // মডাল বাইরে ক্লিক করলে বন্ধ হবে
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

// অ্যাপ প্রিভিউ জেনারেট
function generateAppPreview() {
    const previewCard = document.getElementById('appPreviewCard');
    const previewDetails = document.getElementById('appPreviewDetails');
    
    if (!previewCard || !previewDetails) return;
    
    const appData = {
        name: document.getElementById('appName').value || 'অ্যাপ নাম',
        icon: document.getElementById('appIcon').value || 'fas fa-mobile-alt',
        version: document.getElementById('appVersion').value || '1.0',
        size: document.getElementById('appSize').value || '10MB',
        downloads: document.getElementById('appDownloads').value || '1K+',
        shortDescription: document.getElementById('shortDescription').value || 'শর্ট ডেসক্রিপশন',
        description: document.getElementById('fullDescription').value || 'ফুল ডেসক্রিপশন',
        premium: document.getElementById('appPremium').checked,
        locked: document.getElementById('appLocked').checked,
        features: document.getElementById('appFeatures').value.split('\n').filter(f => f.trim())
    };
    
    // অ্যাপ কার্ড প্রিভিউ
    previewCard.innerHTML = `
        <div class="app-thumbnail">
            <i class="${appData.icon}"></i>
        </div>
        <div class="app-info">
            <div class="app-header">
                <h3 class="app-name">${appData.name}</h3>
                ${appData.premium ? '<span class="premium-badge">প্রিমিয়াম</span>' : ''}
            </div>
            <p class="app-description">${appData.shortDescription}</p>
            <div class="app-meta">
                <span><i class="fas fa-code-branch"></i> v${appData.version}</span>
                <span><i class="fas fa-sd-card"></i> ${appData.size}</span>
                <span><i class="fas fa-download"></i> ${appData.downloads}</span>
            </div>
        </div>
    `;
    
    // অ্যাপ ডিটেইলস প্রিভিউ
    previewDetails.innerHTML = `
        <h3>বিস্তারিত তথ্য:</h3>
        <p><strong>পূর্ণ বর্ণনা:</strong> ${appData.description}</p>
        <p><strong>স্ট্যাটাস:</strong> ${appData.locked ? '🔒 লক করা আছে' : '🔓 আনলক করা আছে'}</p>
        ${appData.features.length > 0 ? `
            <h4>ফিচারসমূহ:</h4>
            <ul>
                ${appData.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        ` : ''}
    `;
}

// প্রোগ্রাম ইনিশিয়ালাইজ
function initializeApp() {
    // Firebase অথেনটিকেশন স্টেট চেক
    checkAuthState();
    
    // লগইন ফর্ম সেটআপ
    setupLoginForm();
    
    // লগআউট সেটআপ
    setupLogout();
    
    // সাইডবার সেটআপ
    setupSidebar();
    
    // সাবমেনু সেটআপ
    setupSubmenus();
    
    // এডস সেভ সেটআপ
    setupAdsSave();
    
    // অ্যাপ লক/আনলক সেটআপ
    setupAppLockToggle();
    
    // নতুন অ্যাপ ফর্ম সেটআপ
    setupAddAppForm();
    
    // অ্যাপ প্রিভিউ সেটআপ
    setupAppPreview();
    
    // সব অ্যাপস লিংক সেটআপ
    setupViewAppsLink();
    
    // এড প্রিভিউ (ঐচ্ছিক)
    setupAdPreviews();
}

// এড প্রিভিউ সেটআপ
function setupAdPreviews() {
    // ব্যানার এড প্রিভিউ
    const bannerScript = document.getElementById('bannerScript');
    if (bannerScript) {
        bannerScript.addEventListener('input', () => {
            updateAdPreview('bannerPreview', bannerScript.value);
        });
    }
    
    // অন্যান্য এড প্রিভিউগুলোও একইভাবে যোগ করুন
}

// এড প্রিভিউ আপডেট
function updateAdPreview(previewId, script) {
    const previewContainer = document.getElementById(previewId);
    if (!previewContainer) return;
    
    previewContainer.innerHTML = script || '<p class="preview-placeholder">এড স্ক্রিপ্ট পেস্ট করুন</p>';
    
    // স্ক্রিপ্ট এক্সিকিউট
    const scripts = previewContainer.getElementsByTagName('script');
    for (let script of scripts) {
        const newScript = document.createElement('script');
        if (script.src) {
            newScript.src = script.src;
        } else {
            newScript.textContent = script.textContent;
        }
        document.body.appendChild(newScript);
    }
}

// DOM লোড হওয়ার পর অ্যাপ ইনিশিয়ালাইজ
document.addEventListener('DOMContentLoaded', initializeApp);

// গ্লোবাল ফাংশন এক্সপোর্ট
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showAlert = showAlert;