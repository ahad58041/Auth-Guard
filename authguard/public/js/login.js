const form      = document.getElementById('loginForm');
const alertEl   = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('togglePass');
const passEl    = document.getElementById('password');
const eyeIcon   = document.getElementById('eyeIcon');

const EYE_OPEN   = '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>';
const EYE_CLOSED = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>';

toggleBtn.addEventListener('click', () => {
  const show = passEl.type === 'password';
  passEl.type = show ? 'text' : 'password';
  eyeIcon.innerHTML = show ? EYE_CLOSED : EYE_OPEN;
});

function showAlert(type, message) {
  const isErr = type === 'error';
  alertEl.className = `mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2.5 ${
    isErr ? 'bg-red-500/10 border border-red-500/25 text-red-400'
          : 'bg-green-500/10 border border-green-500/25 text-green-400'}`;
  const icon = isErr
    ? '<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>'
    : '<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  alertEl.innerHTML = icon + `<span>${message}</span>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = passEl.value;

  if (!username || !password) { showAlert('error', 'Please fill in all fields'); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Signing in...';
  alertEl.className = 'hidden';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      const name = encodeURIComponent(data.message.replace('Welcome back, ', '').replace('!', ''));
      window.location.href = `/dashboard?name=${name}`;
    } else {
      showAlert('error', data.message);
    }
  } catch {
    showAlert('error', 'Cannot reach server');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign In';
  }
});
