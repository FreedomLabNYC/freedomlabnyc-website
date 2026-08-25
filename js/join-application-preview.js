(() => {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const closeMenu = () => {
    hamburger?.classList.remove('active');
    navMenu?.classList.remove('active');
    mobileOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  };
  hamburger?.addEventListener('click', () => {
    const open = !navMenu.classList.contains('active');
    hamburger.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    mobileOverlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileOverlay?.addEventListener('click', closeMenu);
  document.querySelectorAll('.nav-link, .nav-btn').forEach(link => link.addEventListener('click', closeMenu));

  const form = document.querySelector('.application-form');
  if (!form) return;

  const tier = new URLSearchParams(location.search).get('tier') || '';
  const tierInput = form.querySelector('input[name="membership_tier"]');
  if (tierInput) tierInput.value = tier;

  const attendanceDetails = form.querySelector('[data-attendance-details]');
  const syncAttendance = () => {
    const attended = form.querySelector('input[name="attended_event"]:checked')?.value === 'yes';
    if (!attendanceDetails) return;
    attendanceDetails.hidden = !attended;
    const input = attendanceDetails.querySelector('input');
    if (input) {
      input.required = attended;
      if (!attended) input.value = '';
    }
  };
  form.querySelectorAll('input[name="attended_event"]').forEach(input => input.addEventListener('change', syncAttendance));
  syncAttendance();

  const otherDetails = form.querySelector('[data-other-interest]');
  const syncOther = () => {
    const other = form.querySelector('input[name="main_interest"]:checked')?.value === 'Other';
    if (!otherDetails) return;
    otherDetails.hidden = !other;
    const input = otherDetails.querySelector('input');
    if (input) {
      input.required = other;
      if (!other) input.value = '';
    }
  };
  form.querySelectorAll('input[name="main_interest"]').forEach(input => input.addEventListener('change', syncOther));
  syncOther();

  const panels = [...form.querySelectorAll('[data-step-panel]')];
  const dots = [...document.querySelectorAll('[data-step-dot]')];
  let currentStep = 1;
  const showStep = (step, focusField = true) => {
    currentStep = step;
    panels.forEach(panel => { panel.hidden = Number(panel.dataset.stepPanel) !== step; });
    dots.forEach(dot => dot.classList.toggle('active', Number(dot.dataset.stepDot) === step));
    if (focusField) form.querySelector('[data-step-panel]:not([hidden]) input, [data-step-panel]:not([hidden]) textarea')?.focus();
  };
  form.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
    const active = form.querySelector('[data-step-panel]:not([hidden])');
    const required = [...active.querySelectorAll('[required]')];
    const invalid = required.find(field => !field.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    showStep(2);
  }));
  form.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showStep(1)));
  if (panels.length) showStep(1, false);

  form.addEventListener('submit', event => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    if (status) {
      status.hidden = false;
      status.textContent = 'Preview only — submission is not connected yet.';
      status.focus?.();
    }
  });
})();
