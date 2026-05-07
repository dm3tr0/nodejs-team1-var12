// Copy URL to clipboard
function copyUrl(url) {
  navigator.clipboard.writeText(url).then(() => {
    const btn = event.target;
    const orig = btn.textContent;
    btn.textContent = '✓ Скопійовано!';
    btn.style.color = 'var(--success)';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
    }, 2000);
  });
}

// Auto-hide alerts after 5s
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.alert').forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });
});
