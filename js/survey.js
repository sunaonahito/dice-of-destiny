// survey.js

// Google Apps Script URL (replace with your deployed URL)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmFGQAd65GbEFia0zfyLxG2FKDn9KE2NeQAN1U-1YJzZ7QExbGh6LehdnKe-pOfVob/exec';

// Store survey data
let surveyData = {
  preSurvey: {},
  gamePlay: {},
  postSurvey: {}
};

// Initialize survey functionality
function initializeSurveys() {
  // Pre-survey form handling
  const preSurveyForm = document.getElementById('pre-survey-form');
  if (preSurveyForm) {
    preSurveyForm.addEventListener('submit', handlePreSurveySubmit);

    // Progress tracking
    trackSurveyProgress('pre-survey-form', 'pre-survey-progress', 'answered-count', 45);

    // Ethnicity validation removed - all fields now optional
  }
  
  // Post-survey form handling
  const postSurveyForm = document.getElementById('post-survey-form');
  if (postSurveyForm) {
    postSurveyForm.addEventListener('submit', handlePostSurveySubmit);
    
    // Pre-fill anonymous code if available
    const savedCode = sessionStorage.getItem('anonymous_code');
    if (savedCode) {
      const postAnonCode = document.getElementById('post-anonymous-code');
      if(postAnonCode) {
        postAnonCode.value = savedCode;
      }
    }
    
    // Progress tracking
    trackSurveyProgress('post-survey-form', 'post-survey-progress', 'post-answered-count', 53);
  }
}

// Track survey completion progress
function trackSurveyProgress(formId, progressBarId, counterId, total) {
  const form = document.getElementById(formId);
  const progressBar = document.getElementById(progressBarId);
  const counter = document.getElementById(counterId);
  const totalCount = form.querySelector('.total-count');
  
  if (!form || !progressBar) return;
  
  if (totalCount) {
    totalCount.textContent = total;
  }
  
  // Get all required inputs
  const requiredInputs = form.querySelectorAll('[required]');
  
  // Update progress
  function updateProgress() {
    let answered = 0;
    const countedNames = new Set();

    requiredInputs.forEach(input => {
        let isAnswered = false;
        if (input.type === 'radio' || input.type === 'checkbox') {
            const name = input.name;
            if (!countedNames.has(name)) {
                const checked = form.querySelector(`[name="${name}"]:checked`);
                if (checked) {
                    isAnswered = true;
                    countedNames.add(name);
                }
            }
        } else if (input.value.trim() !== '') {
            isAnswered = true;
        }

        if (isAnswered) {
            answered++;
        }
    });
    
    const percentage = (answered / total) * 100;
    progressBar.style.width = `${percentage}%`;
    
    if (counter) {
      counter.textContent = answered;
    }
  }
  
  // Listen to all input changes
  form.addEventListener('input', updateProgress);
  form.addEventListener('change', updateProgress);
  
  // Initial update
  updateProgress();
}

// Ethnicity validation (at least one checkbox)
function setupEthnicityValidation() {
  const form = document.getElementById('pre-survey-form');
  if(!form) return;

  const checkboxes = form.querySelectorAll('input[name="ethnicity"]');
  const validationMsg = document.getElementById('ethnicity-validation');
  
  function validate() {
      const checked = form.querySelectorAll('input[name="ethnicity"]:checked');
      if (checked.length > 0) {
        checkboxes.forEach(cb => cb.setCustomValidity(''));
        if (validationMsg) validationMsg.classList.remove('show');
        return true;
      } else {
        checkboxes.forEach(cb => cb.setCustomValidity('Please select at least one option'));
        if (validationMsg) {
          validationMsg.textContent = 'Please select at least one option';
          validationMsg.classList.add('show');
        }
        return false;
      }
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', validate);
  });
  
  form.addEventListener('submit', (e) => {
    if (!validate()) {
        e.preventDefault();
    }
  });
}

// Handle pre-survey submission
function handlePreSurveySubmit(e) {
  e.preventDefault();

  const form = e.target;

  // No validation required - all fields are optional
  
  // Collect form data
  const formData = new FormData(form);
  const data = {
    timestamp: new Date().toISOString(),
    demographics: {},
    life_satisfaction: {},
    self_efficacy: {},
    post_traumatic_growth: {}
  };
  
  // Process demographics
  data.demographics.anonymous_code = formData.get('anonymous_code');
  data.demographics.age = parseInt(formData.get('age'));
  data.demographics.gender = formData.get('gender');
  if (data.demographics.gender === 'Other') {
    data.demographics.gender_other = formData.get('gender_other');
  }
  
  // Ethnicity (multiple values)
  data.demographics.ethnicity = formData.getAll('ethnicity');
  if (data.demographics.ethnicity.includes('Other')) {
    data.demographics.ethnicity_other = formData.get('ethnicity_other');
  }
  
  data.demographics.academic_year = formData.get('academic_year');
  if (data.demographics.academic_year === 'Other') {
    data.demographics.academic_year_other = formData.get('academic_year_other');
  }
  
  data.demographics.major = formData.get('major');
  if (data.demographics.major === 'Other') {
    data.demographics.major_other = formData.get('major_other');
  }
  
  data.demographics.work_status = formData.get('work_status');
  data.demographics.marital_status = formData.get('marital_status');
  data.demographics.parental_status = formData.get('parental_status');
  
  // Process Likert scale questions
  for (let i = 10; i <= 17; i++) {
    data.life_satisfaction[`q${i}`] = parseInt(formData.get(`q${i}`));
  }
  
  for (let i = 18; i <= 30; i++) {
    data.self_efficacy[`q${i}`] = parseInt(formData.get(`q${i}`));
  }
  
  for (let i = 31; i <= 45; i++) {
    data.post_traumatic_growth[`q${i}`] = parseInt(formData.get(`q${i}`));
  }
  
  // Store data
  surveyData.preSurvey = data;

  // Save anonymous code for later use
  sessionStorage.setItem('anonymous_code', data.demographics.anonymous_code);

  // Navigate to opening story
  navigateTo('opening-story-1');
}

// Handle post-survey submission
async function handlePostSurveySubmit(e) {
  e.preventDefault();

  const form = e.target;

  // No validation required - all fields are optional

  // Collect form data
  const formData = new FormData(form);
  const data = {
    timestamp: new Date().toISOString(),
    anonymous_code: formData.get('anonymous_code'),
    life_satisfaction: {},
    self_efficacy: {},
    post_traumatic_growth: {},
    learning_engagement: {},
    feedback: ''
  };

  // Process Likert scale questions (Q1-Q52)
  // Q1-Q8: Life Satisfaction
  for (let i = 1; i <= 8; i++) {
    data.life_satisfaction[`q${i}`] = parseInt(formData.get(`q${i}`));
  }

  // Q9-Q22: Self-Efficacy
  for (let i = 9; i <= 22; i++) {
    data.self_efficacy[`q${i}`] = parseInt(formData.get(`q${i}`));
  }

  // Q23-Q36: Post-Traumatic Growth
  for (let i = 23; i <= 36; i++) {
    data.post_traumatic_growth[`q${i}`] = parseInt(formData.get(`q${i}`));
  }

  // Q37-Q52: Learning Engagement
  for (let i = 37; i <= 52; i++) {
    data.learning_engagement[`q${i}`] = parseInt(formData.get(`q${i}`));
  }

  // Q53: Open-ended feedback
  data.feedback = formData.get('q53') || '';

  // Store data
  surveyData.postSurvey = data;

  // Send to Google Sheets
  showNotification('Sending data to Google Sheets...', 'info');
  const success = await sendToGoogleSheets();

  if (success) {
    showNotification('Data saved successfully!', 'success');
  } else {
    showNotification('Data sent (check console for details)', 'info');
  }

  // Navigate to completion
  setTimeout(() => {
    navigateTo('completion');
  }, 1500);
}

// Notification system
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Send data to Google Sheets
async function sendToGoogleSheets() {
  // Flatten all data into a single object matching the GAS specification
  const preSurvey = surveyData.preSurvey;
  const gamePlay = surveyData.gamePlay;
  const postSurvey = surveyData.postSurvey;

  const flatData = {
    anonymous_code: preSurvey.demographics?.anonymous_code || postSurvey.anonymous_code,

    // Demographics
    age: preSurvey.demographics?.age,
    gender: preSurvey.demographics?.gender,
    gender_other: preSurvey.demographics?.gender_other || '',
    ethnicity: Array.isArray(preSurvey.demographics?.ethnicity)
      ? preSurvey.demographics.ethnicity.join(', ')
      : preSurvey.demographics?.ethnicity || '',
    ethnicity_other: preSurvey.demographics?.ethnicity_other || '',
    academic_year: preSurvey.demographics?.academic_year,
    academic_year_other: preSurvey.demographics?.academic_year_other || '',
    major: preSurvey.demographics?.major,
    major_other: preSurvey.demographics?.major_other || '',
    work_status: preSurvey.demographics?.work_status,
    marital_status: preSurvey.demographics?.marital_status,
    parental_status: preSurvey.demographics?.parental_status,
  };

  // Pre-Survey Q10-Q45
  for (let i = 10; i <= 45; i++) {
    const qKey = `q${i}`;
    flatData[`pre_q${i}`] = preSurvey.life_satisfaction?.[qKey] ||
                            preSurvey.self_efficacy?.[qKey] ||
                            preSurvey.post_traumatic_growth?.[qKey] || '';
  }

  // Stage 1
  const stage1Cards = gamePlay.stage1?.cards?.filter(c => c.text !== '') || [];
  flatData.stage1_total_cards = stage1Cards.length;
  flatData.stage1_cards_json = JSON.stringify(stage1Cards);

  // Stage 2
  const stage2Stories = gamePlay.stage2?.selectedCards || [];
  flatData.stage2_story_count = stage2Stories.length;
  flatData.stage2_stories_json = JSON.stringify(stage2Stories);

  // Stage 3
  flatData.stage3_mode = gamePlay.stage3?.mode || '';
  flatData.stage3_roll_count = gamePlay.stage3?.rolls?.length || 0;
  flatData.stage3_remaining_count = gamePlay.stage3?.remainingCards?.length || 0;
  flatData.stage3_lost_count = gamePlay.stage3?.lostCards?.length || 0;
  flatData.stage3_rolls_json = JSON.stringify(gamePlay.stage3?.rolls || []);

  // Post-Survey Q1-Q52
  for (let i = 1; i <= 52; i++) {
    const qKey = `q${i}`;
    flatData[`post_q${i}`] = postSurvey.life_satisfaction?.[qKey] ||
                             postSurvey.self_efficacy?.[qKey] ||
                             postSurvey.post_traumatic_growth?.[qKey] ||
                             postSurvey.learning_engagement?.[qKey] || '';
  }

  // Post-Survey Q53 (Open-ended feedback)
  flatData.post_q53 = postSurvey.feedback || '';

  // Interim Message
  flatData.interim_message = gamePlay.interimMessage || '';

  // Send to Google Sheets
  try {
    console.log('Sending data to Google Sheets:', flatData);
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(flatData),
      redirect: 'follow'
    });

    console.log('Data sent to Google Sheets. The request was made, but the response is opaque due to no-cors mode.');
    return true;
  } catch (error) {
    console.error('Error sending data to Google Sheets:', error);
    console.log('Failed data:', JSON.stringify(flatData));
    return false;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSurveys);
