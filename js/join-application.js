(() => {
  const API_URL = 'https://api.freedomlab.nyc/applications';
  const tierPrices = { sparkmaker: 100, torchbearer: 250, flamekeeper: 400 };
  const allowedInterests = new Set([
    'Coworking space',
    'Developing freedom tech',
    'Community',
    'Teaching freedom tech',
    'Learning freedom tech',
    'Helping Freedom Lab grow',
    'Other'
  ]);

  const form = document.getElementById('membershipApplication');
  const steps = [...form.querySelectorAll('[data-step]')];
  const progress = document.querySelector('[data-progress-current]');
  const status = form.querySelector('.apply-status');
  const success = document.querySelector('.apply-success');
  const selectedTier = new URLSearchParams(location.search).get('tier');
  const applicationSource = location.pathname.startsWith('/join2/') ? 'join2' : 'join';
  let current = 1;

  const setStatus = (message = '') => {
    status.textContent = message;
    status.hidden = !message;
  };

  const showStep = step => {
    current = step;
    steps.forEach(panel => { panel.hidden = Number(panel.dataset.step) !== step; });
    if (progress) progress.textContent = String(step);
    setStatus();
  };

  const fieldContainer = field => field.closest('.field');
  const markValidity = field => {
    const container = fieldContainer(field);
    if (!container) return field.checkValidity();
    const valid = field.checkValidity();
    container.classList.toggle('is-error', !valid);
    return valid;
  };

  const validateStep = step => {
    const panel = steps.length
      ? steps.find(item => Number(item.dataset.step) === step)
      : form;
    const fields = [...panel.querySelectorAll('input,select,textarea')].filter(field => !field.disabled && !field.closest('[hidden]'));
    const invalid = fields.find(field => !markValidity(field));
    if (invalid) {
      invalid.focus();
      setStatus('Please complete the required fields.');
      return false;
    }
    return true;
  };

  form.addEventListener('input', event => {
    if (event.target.matches('input,select,textarea')) markValidity(event.target);
  });
  form.addEventListener('change', event => {
    if (event.target.matches('input,select,textarea')) markValidity(event.target);
  });

  const attendance = form.elements.attended_event;
  const eventDetails = document.querySelector('[data-event-details]');
  const syncAttendance = () => {
    const attended = attendance.value === 'yes';
    eventDetails.hidden = !attended;
    eventDetails.querySelector('input').disabled = !attended;
    if (!attended) eventDetails.querySelector('input').value = '';
  };
  attendance.addEventListener('change', syncAttendance);
  syncAttendance();

  const mainInterest = form.elements.main_interest;
  const otherInterest = document.querySelector('[data-other-interest]');
  const syncInterest = () => {
    const other = mainInterest.value === 'Other';
    otherInterest.hidden = !other;
    otherInterest.querySelector('input').disabled = !other;
    otherInterest.querySelector('input').required = other;
    if (!other) otherInterest.querySelector('input').value = '';
  };
  mainInterest.addEventListener('change', syncInterest);
  syncInterest();

  form.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
    if (!validateStep(current)) return;
    showStep(Math.min(steps.length, current + 1));
  }));
  form.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => showStep(Math.max(1, current - 1))));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateStep(current)) return;
    if (!(selectedTier in tierPrices)) {
      setStatus('Choose a membership before applying.');
      return;
    }
    if (!allowedInterests.has(mainInterest.value)) {
      setStatus('Choose your main interest.');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = 'Submitting…';
    setStatus();
    const firstName = form.elements.first_name.value.trim();
    const lastName = form.elements.last_name.value.trim();
    const freedomTechInterests = form.elements.freedom_tech_interests.value.trim();
    const payload = {
      submission_id: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: form.elements.email.value.trim(),
      attended_event: attendance.value === 'yes',
      events_attended: form.elements.events_attended.value.trim(),
      main_interest: mainInterest.value,
      main_interest_other: form.elements.main_interest_other.value.trim(),
      social_platform_link: form.elements.social_platform_link.value.trim(),
      freedom_tech_interests: freedomTechInterests,
      references: form.elements.references.value.trim(),
      other_comments: form.elements.other_comments.value.trim(),
      monthly_budget: tierPrices[selectedTier],
      membership_tier: selectedTier,
      consent_version: `${applicationSource}-2026-08`,
      source: `freedomlab.nyc/${applicationSource}`,
      freedom_tech_tools: freedomTechInterests,
      updates_opt_in: false
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Application failed (${response.status})`);
      form.hidden = true;
      success.hidden = false;
      if (typeof gtag === 'function') {
        gtag('event', 'join_waitlist_submit', {
          event_category: 'conversion',
          event_label: 'Membership Application',
          form_type: 'Membership Application',
          page_path: `/${applicationSource}/apply/`
        });
      }
    } catch (error) {
      setStatus('Submission failed. Please try again.');
      submit.disabled = false;
      submit.textContent = 'Submit application';
    }
  });

  if (steps.length) showStep(1);
})();
