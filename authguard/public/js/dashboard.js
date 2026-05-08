const params = new URLSearchParams(window.location.search);
const name   = params.get('name') ? decodeURIComponent(params.get('name')) : 'User';
document.getElementById('welcomeMsg').textContent = `Welcome, ${name}!`;
