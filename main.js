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
    onAuthStateChanged,
    createUserWithEmailAndPassword 
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

// ডিবাগিং লগ
console.log("Firebase App initialized:", app);
console.log("Firebase Auth:", auth);

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
    console.log("Checking auth state...");
    
    onAuthStateChanged(auth, (user) => {
        console.log("Auth state changed. User:", user);
        
        if (user) {
            // লগইন করা আছে
            currentAdmin = user;
            console.log("User logged in:", user.email);
            
            // যদি লগইন পেজে থাকি, তাহলে ড্যাশবোর্ডে রিডাইরেক্ট
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname.endsWith('/') ||
                window.location.pathname === '/') {
                console.log("Redirecting to dashboard...");
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
            console.log("No user logged in");
            
            // যদি লগইন পেজে না থাকি, তাহলে লগইন পেজে রিডাইরেক্ট
            if (!window.location.pathname.includes('index.html') && 
                !window.location.pathname.endsWith('/') &&
                window.location.pathname !== '/') {
                console.log("Redirecting to login...");
                window.location.href = 'index.html';
            }
        }
    }, (error) => {
        console.error("Auth state change error:", error);
    });
}

// অ্যাডমিন ইনফো আপডেট
function updateAdminInfo() {
    if (!currentAdmin) return;
    
    console.log("Updating admin info for:", currentAdmin.email);
    
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
    
    console.log("Setting up login form...");
    
    if (loginForm) {
        console.log("Login form found");
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log("Login form submitted");
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            console.log("Email:", email);
            
            if (!email || !password) {
                showAlert('ইমেইল এবং পাসওয়ার্ড দিন', 'error');
                return;
            }
            
            try {
                showLoading();
                console.log("Attempting login...");
                
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Login successful:", userCredential.user);
                
                showAlert('লগইন সফল!', 'success');
                
                // রিডাইরেক্ট হবে onAuthStateChanged এ
            } catch (error) {
                console.error('লগইন এরর:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                let errorMessage = 'লগইন ব্যর্থ হয়েছে';
                
                if (error.code === 'auth/invalid-email') {
                    errorMessage = 'ইনভ্যালিড ইমেইল ঠিকানা';
                } else if (error.code === 'auth/user-disabled') {
                    errorMessage = 'এই অ্যাকাউন্ট ডিজেবল করা আছে';
                } else if (error.code === 'auth/user-not-found') {
                    errorMessage = 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই';
                } else if (error.code === 'auth/wrong-password') {
                    errorMessage = 'ভুল পাসওয়ার্ড';
                } else if (error.code === 'auth/too-many-requests') {
                    errorMessage = 'বহুবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন';
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage = 'নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন';
                }
                
                showAlert(errorMessage, 'error');
            } finally {
                hideLoading();
            }
        });
    } else {
        console.log("Login form NOT found on this page");
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

// ডিবাগিং ফাংশন - অ্যাডমিন অ্যাকাউন্ট তৈরি
function setupAdminAccountCreation() {
    // শুধু ডেভেলপমেন্টের জন্য
    const createAdminBtn = document.getElementById('createAdminBtn');
    
    if (createAdminBtn) {
        createAdminBtn.addEventListener('click', async () => {
            const email = prompt("Admin email:");
            const password = prompt("Admin password (min 6 chars):");
            
            if (!email || !password) return;
            
            try {
                showLoading();
                await createUserWithEmailAndPassword(auth, email, password);
                alert("Admin account created!");
            } catch (error) {
                console.error("Admin creation error:", error);
                alert("Error: " + error.message);
            } finally {
                hideLoading();
            }
        });
    }
}

// ফায়ারবেস কানেকশন টেস্ট
async function testFirebaseConnection() {
    console.log("Testing Firebase connection...");
    
    try {
        // ডাটাবেস রেফারেন্স টেস্ট
        const testRef = ref(database, 'test');
        await set(testRef, { timestamp: Date.now() });
        console.log("Firebase write test: SUCCESS");
        
        await remove(testRef);
        console.log("Firebase delete test: SUCCESS");
        
    } catch (error) {
        console.error("Firebase connection test FAILED:", error);
        console.error("Full error details:", error);
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
                console.log("Logout successful");
            } catch (error) {
                console.error('লগআউট এরর:', error);
                showAlert('লগআউট ব্যর্থ হয়েছে', 'error');
            } finally {
                hideLoading();
            }
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

// অ্যাপ ইনিশিয়ালাইজ
function initializeApp() {
    console.log("Initializing app...");
    console.log("Current page:", window.location.pathname);
    
    // Firebase কানেকশন টেস্ট
    testFirebaseConnection();
    
    // Firebase অথেনটিকেশন স্টেট চেক
    checkAuthState();
    
    // লগইন ফর্ম সেটআপ
    setupLoginForm();
    
    // লগআউট সেটআপ
    setupLogout();
    
    // অ্যাডমিন অ্যাকাউন্ট তৈরি (ডিবাগিং)
    setupAdminAccountCreation();
    
    // শুধু ড্যাশবোর্ড পেজে থাকলে
    if (!window.location.pathname.includes('index.html') && 
        window.location.pathname !== '/' &&
        !window.location.pathname.endsWith('/')) {
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
    }
}

// সাইডবার টগল (ড্যাশবোর্ডের জন্য)
function setupSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('collapsed');
        });
    }
}

// বাকি ফাংশনগুলো (আগের কোডের মত)
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

// DOM লোড হওয়ার পর অ্যাপ ইনিশিয়ালাইজ
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing app...");
    initializeApp();
});

// error দেখলে ব্রাউজার কনসোলে খুলে F12 চাপুন
