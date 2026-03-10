// Supabase Configuration
const SUPABASE_URL = 'https://ivhsfvqyuykmetjmppgf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHNmdnF5dXlrbWV0am1wcGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODI4MDAsImV4cCI6MjA4ODY1ODgwMH0.ypufR0cenAqDPW8OR6OAkerIzady8Cn5bne2lOMgU3E';

console.log('supabase-auth.js: Script loaded');

let supabase;

const initSupabase = () => {
    console.log('auth.js: Initializing Supabase...');
    if (window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('auth.js: Supabase client initialized successfully');
        setupFormListeners();
    } else {
        console.error('auth.js: Supabase SDK not found on window object.');
    }
};

const setupFormListeners = () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');

    console.log('auth.js: Setting up form listeners...', { signupForm: !!signupForm, loginForm: !!loginForm });

    // Helper to show messages
    const showMessage = (message, isError = false) => {
        alert(message);
    };

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('auth.js: Sign-up form submitted');

            const btn = document.getElementById('signup-btn');
            const formData = new FormData(signupForm);

            const email = formData.get('email');
            const password = formData.get('password');
            const fullname = formData.get('fullname');
            const role = formData.get('role');

            btn.innerText = 'Creating account...';
            btn.disabled = true;

            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullname,
                            role: role
                        }
                    }
                });

                if (error) throw error;

                console.log('auth.js: Sign-up success', data);
                showMessage('Registration successful! Please check your email for verification.');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('auth.js: Sign-up error', error);
                showMessage(error.message, true);
            } finally {
                btn.innerText = 'Get Started';
                btn.disabled = false;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('auth.js: Login form submitted');

            const btn = document.getElementById('login-btn');
            const formData = new FormData(loginForm);

            const email = formData.get('email');
            const password = formData.get('password');

            btn.innerText = 'Signing in...';
            btn.disabled = true;

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                console.log('auth.js: Login success', data);
                showMessage('Login successful! Redirecting...');
            } catch (error) {
                console.error('auth.js: Login error', error);
                showMessage(error.message, true);
            } finally {
                btn.innerText = 'Sign In';
                btn.disabled = false;
            }
        });
    }

    // Input focus effects
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        const label = input.parentElement.querySelector('label');
        if (label) {
            input.addEventListener('focus', () => {
                label.style.color = 'var(--primary)';
            });
            input.addEventListener('blur', () => {
                label.style.color = 'var(--text-muted)';
            });
        }
    });
};

// Orchestrate the loading
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}
