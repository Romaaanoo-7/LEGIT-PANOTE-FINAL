// DOM Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const themeCheckbox = document.getElementById('theme-checkbox');
const logo = document.getElementById('logo');

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeCheckbox.checked = savedTheme === 'dark';
    updateLogo(savedTheme);
}

function toggleTheme(e) {
    const theme = e.target.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateLogo(theme);
}

function updateLogo(theme) {
    // Smooth opacity transition for logo replacement
    logo.style.opacity = '0';
    setTimeout(() => {
        logo.src = theme === 'dark'
            ? '../elements/PanotePencilDark.svg'
            : '../elements/PanotePencil.svg';
        logo.style.opacity = '1';
    }, 200);
}

// Password Toggle
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Form Switching
function switchForm(formType) {
    const card = document.querySelector('.card');

    // Fade out content
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';

    setTimeout(() => {
        if (formType === 'register') {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        } else {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        }

        // Fade in content
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 300);
}

// Mock API Calls
async function handleLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('login-error');
    const originalText = btn.innerHTML;

    // Reset error
    errorMsg.style.display = 'none';

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    // Simulate API call
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock success (you can add specific logic here)
        console.log('Login payload:', {
            username: document.getElementById('login-username').value,
            password: '***'
        });

        // Redirect or show success
        alert('Login successful! Redirecting...');

    } catch (err) {
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    const errorMsg = document.getElementById('register-error');
    const originalText = btn.innerHTML;

    // Reset error
    errorMsg.style.display = 'none';

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    // Simulate API call
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));

        console.log('Register payload:', {
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: '***'
        });

        alert('Account created! Please login.');
        switchForm('login');

    } catch (err) {
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Event Listeners
themeCheckbox.addEventListener('change', toggleTheme);
document.addEventListener('DOMContentLoaded', initTheme);
