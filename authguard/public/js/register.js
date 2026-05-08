const form      = document.getElementById('registerForm');
const alertEl   = document.getElementById('alert');
const submitBtn = document.getElementById('submitBtn');

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
  const firstName       = document.getElementById('firstName').value.trim();
  const lastName        = document.getElementById('lastName').value.trim();
  const email           = document.getElementById('email').value.trim();
  const password        = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    showAlert('error', 'Please fill in all fields'); return;
  }
  if (password !== confirmPassword) {
    showAlert('error', 'Passwords do not match'); return;
  }
  if (password.length < 6) {
    showAlert('error', 'Password must be at least 6 characters'); return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';
  alertEl.className = 'hidden';

  try {
    const res  = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password, confirmPassword }),
    });
    const data = await res.json();

    if (data.success) {
      showAlert('success', 'Account created! Redirecting to login...');
      setTimeout(() => { window.location.href = '/'; }, 1800);
    } else {
      showAlert('error', data.message);
    }
  } catch {
    showAlert('error', 'Cannot reach server');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
});
