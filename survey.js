/* =============================================
   TrueLyfe PMF Survey — Interactivity
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Google Sheet URL (same deployment as main site) ───
  const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyWzCNTS9pjnhbYHq7idoCEZk_h4ByoOn81wcRF9cZp0r9qR--W2d3R6-B6moTuwqOo/exec';

  const TOTAL_QUESTIONS = 12;
  const form = document.getElementById('survey-form');
  const thankyou = document.getElementById('survey-thankyou');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const progressPercent = document.getElementById('progress-percent');
  const submitBtn = document.getElementById('survey-submit-btn');

  // ─── Pre-fill name & email from URL parameters ───
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get('name');
  const emailParam = urlParams.get('email');

  if (nameParam) document.getElementById('survey-name').value = decodeURIComponent(nameParam);
  if (emailParam) document.getElementById('survey-email').value = decodeURIComponent(emailParam);

  // ─── Track Progress ───
  function updateProgress() {
    let answered = 0;

    // Q1–Q3: single radio
    ['q1', 'q2', 'q3'].forEach(name => {
      if (form.querySelector(`input[name="${name}"]:checked`)) answered++;
    });

    // Q4: checkbox (at least 1 checked)
    if (form.querySelectorAll('input[name="q4"]:checked').length > 0) answered++;

    // Q5: rating scale
    if (form.querySelector('input[name="q5"]:checked')) answered++;

    // Q6: disappointment
    if (form.querySelector('input[name="q6"]:checked')) answered++;

    // Q7: variant
    if (form.querySelector('input[name="q7"]:checked')) answered++;

    // Q8: checkbox
    if (form.querySelectorAll('input[name="q8"]:checked').length > 0) answered++;

    // Q9–Q12: text
    ['q9', 'q10', 'q11', 'q12'].forEach(name => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && el.value.trim().length > 0) answered++;
    });

    const percent = Math.round((answered / TOTAL_QUESTIONS) * 100);
    progressFill.style.width = percent + '%';
    progressLabel.textContent = `${answered} of ${TOTAL_QUESTIONS} answered`;
    progressPercent.textContent = percent + '%';
  }

  // Listen for changes on all inputs
  form.addEventListener('change', updateProgress);
  form.addEventListener('input', updateProgress);

  // ─── Form Submission ───
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form data
    const data = {
      action: 'survey',
      name: document.getElementById('survey-name').value || '',
      email: document.getElementById('survey-email').value || '',
      q1: getRadioValue('q1'),
      q2: getRadioValue('q2'),
      q3: getRadioValue('q3'),
      q4: getCheckboxValues('q4'),
      q5: getRadioValue('q5'),
      q6: getRadioValue('q6'),
      q7: getRadioValue('q7'),
      q8: getCheckboxValues('q8'),
      q9: getValue('q9-input'),
      q10: getValue('q10-input'),
      q11: getValue('q11-input'),
      q12: getValue('q12-input')
    };

    // Show loading
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Show thank you
      form.style.display = 'none';
      document.getElementById('survey-progress').style.display = 'none';
      thankyou.classList.add('show');

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('Survey submission error:', err);
      // Still show thank you (no-cors may have sent it)
      form.style.display = 'none';
      document.getElementById('survey-progress').style.display = 'none';
      thankyou.classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });

  // ─── Helper Functions ───
  function getRadioValue(name) {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
  }

  function getCheckboxValues(name) {
    const checked = form.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checked).map(cb => cb.value).join(', ');
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

});
