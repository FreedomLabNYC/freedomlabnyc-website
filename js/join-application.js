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
    if (!validateInterestRankings()) {
      rankingSelects[0].focus();
      setStatus('Choose three interests and rank them 1, 2, and 3.');
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
  if (attendance && eventDetails) {
    const syncAttendance = () => {
      const attended = attendance.value === 'yes';
      eventDetails.hidden = !attended;
      eventDetails.querySelector('input').disabled = !attended;
      if (!attended) eventDetails.querySelector('input').value = '';
    };
    attendance.addEventListener('change', syncAttendance);
    syncAttendance();
  }

  const mainInterest = form.elements.main_interest;
  const rankingFieldset = form.querySelector('[data-interest-ranking]');
  const rankingSelects = [...form.querySelectorAll('[data-interest-rank]')];
  const rankedInterests = () => rankingSelects
    .filter(select => select.value)
    .map(select => ({ rank: Number(select.value), interest: select.dataset.interestLabel }))
    .sort((a, b) => a.rank - b.rank);
  const validateInterestRankings = () => {
    if (!rankingSelects.length) return true;
    const rankings = rankedInterests();
    const valid = rankings.length === 3
      && rankings.every((item, index) => item.rank === index + 1)
      && rankings.every(item => allowedInterests.has(item.interest));
    rankingFieldset.classList.toggle('is-error', !valid);
    return valid;
  };
  const otherInterest = document.querySelector('[data-other-interest]');
  const syncInterest = () => {
    const rankedOther = rankingSelects.find(select => select.dataset.interestLabel === 'Other');
    const other = mainInterest ? mainInterest.value === 'Other' : Boolean(rankedOther?.value);
    otherInterest.hidden = !other;
    otherInterest.querySelector('input').disabled = !other;
    otherInterest.querySelector('input').required = other;
    if (!other) otherInterest.querySelector('input').value = '';
  };
  if (mainInterest) mainInterest.addEventListener('change', syncInterest);
  rankingSelects.forEach(select => select.addEventListener('change', () => {
    if (select.value) {
      rankingSelects.forEach(other => {
        if (other !== select && other.value === select.value) other.value = '';
      });
    }
    if (rankingFieldset.classList.contains('is-error')) validateInterestRankings();
    syncInterest();
  }));
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
    const rankings = rankedInterests();
    const primaryInterest = mainInterest ? mainInterest.value : rankings[0]?.interest;
    if (!allowedInterests.has(primaryInterest)) {
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
    const eventsAttended = form.elements.events_attended.value.trim();
    const otherInterestDetail = form.elements.main_interest_other.value.trim();
    const secondaryInterestSummary = rankings.slice(1).map(item => `${item.rank}. ${item.interest}`).join('; ');
    const payload = {
      submission_id: crypto.randomUUID(),
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: form.elements.email.value.trim(),
      attended_event: attendance ? attendance.value === 'yes' : Boolean(eventsAttended),
      events_attended: eventsAttended,
      main_interest: primaryInterest,
      main_interest_other: rankings.length
        ? [secondaryInterestSummary, otherInterestDetail && `Other: ${otherInterestDetail}`].filter(Boolean).join('; ')
        : otherInterestDetail,
      main_interest_rankings: rankings,
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
