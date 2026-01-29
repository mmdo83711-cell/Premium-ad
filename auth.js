// Firebase কনফিগারেশন - আপনার প্রজেক্টের
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

// Firebase ইনিশিয়ালাইজ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ডিবাগিং: কনসোলে লগ করুন
console.log('🔥 Firebase App Initialized:', app);
console.log('🔑 Firebase Auth Initialized:', auth);
console.log('📧 Auth Domain:', firebaseConfig.authDomain);

// স্ট্যাটাস মেসেজ ফাংশন
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// লগইন ফাংশন
async function loginUser(email, password) {
    console.log('🔐 Attempting login with:', email);
    
    try {
        showStatus('লগইন হচ্ছে...', 'loading');
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('✅ Login successful! User:', user);
        console.log('👤 User UID:', user.uid);
        console.log('📧 User Email:', user.email);
        
        showStatus('লগইন সফল! ড্যাশবোর্ডে নিয়ে যাচ্ছি...', 'success');
        
        // ২ সেকেন্ড পর ড্যাশবোর্ডে রিডাইরেক্ট
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
        
        return user;
        
    } catch (error) {
        console.error('❌ Login error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        let errorMessage = 'লগইন ব্যর্থ হয়েছে';
        
        switch(error.code) {
            case 'auth/invalid-email':
                errorMessage = 'ইনভ্যালিড ইমেইল ঠিকানা';
                break;
            case 'auth/user-disabled':
                errorMessage = 'এই অ্যাকাউন্ট ডিজেবল করা আছে';
                break;
            case 'auth/user-not-found':
                errorMessage = 'এই ইমেইলে কোনো অ্যাকাউন্ট নেই';
                break;
            case 'auth/wrong-password':
                errorMessage = 'ভুল পাসওয়ার্ড';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'বহুবার চেষ্টা করা হয়েছে। পরে আবার চেষ্টা করুন';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন';
                break;
            default:
                errorMessage = `লগইন ব্যর্থ: ${error.message}`;
        }
        
        showStatus(errorMessage, 'error');
        return null;
    }
}

// অটোমেটিক অ্যাকাউন্ট তৈরি (যদি না থাকে)
async function createAdminAccount() {
    const testEmail = 'admin@gmail.com';
    const testPassword = 'admin123';
    
    try {
        console.log('👨‍💼 Creating admin account...');
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        console.log('✅ Admin account created:', userCredential.user);
        showStatus('অ্যাডমিন অ্যাকাউন্ট তৈরি হয়েছে!', 'success');
        return userCredential.user;
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log('ℹ️ Admin account already exists');
            return null;
        }
        console.error('❌ Account creation error:', error);
        showStatus(`অ্যাকাউন্ট তৈরি ব্যর্থ: ${error.message}`, 'error');
        return null;
    }
}

// Auth স্টেট মনিটর
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('👤 User is logged in:', user.email);
        console.log('🆔 User UID:', user.uid);
        
        // যদি index.html এ থাকি, তাহলে ড্যাশবোর্ডে নিয়ে যাও
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            console.log('🔄 Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
    } else {
        console.log('👤 No user is logged in');
        
        // যদি ড্যাশবোর্ড পেজে থাকি কিন্তু লগইন না থাকে
        if (window.location.pathname.includes('dashboard.html')) {
            console.log('🔄 Redirecting to login...');
            window.location.href = 'index.html';
        }
    }
});

// DOM লোড হওয়ার পর
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded');
    
    // লগইন ফর্ম
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (!email || !password) {
                showStatus('ইমেইল এবং পাসওয়ার্ড দিন', 'error');
                return;
            }
            
            await loginUser(email, password);
        });
    }
    
    // টেস্ট লগইন বাটন
    const testLoginBtn = document.getElementById('testLogin');
    if (testLoginBtn) {
        testLoginBtn.addEventListener('click', async () => {
            console.log('🧪 Testing login...');
            
            // প্রথমে অ্যাকাউন্ট তৈরি করার চেষ্টা করুন
            await createAdminAccount();
            
            // তারপর লগইন করুন
            await loginUser('admin@gmail.com', 'admin123');
        });
    }
    
    // Firebase ডোমেইন টেস্ট
    console.log('🌐 Testing Firebase domain...');
    fetch('https://video-b71ed.firebaseapp.com/__/auth/handler')
        .then(response => {
            console.log('✅ Firebase domain is accessible');
        })
        .catch(error => {
            console.error('❌ Firebase domain not accessible:', error);
        });
});

// গ্লোবাল এক্সেস
window.firebaseApp = app;
window.firebaseAuth = auth;
window.loginUser = loginUser;
window.createAdminAccount = createAdminAccount;
