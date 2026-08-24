(() => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  if (!hamburger || !navMenu || !mobileOverlay) return;

  const closeMenu = () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    const open = !navMenu.classList.contains('active');
    hamburger.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    mobileOverlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  mobileOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.nav-link, .nav-btn').forEach(link => link.addEventListener('click', closeMenu));
})();
