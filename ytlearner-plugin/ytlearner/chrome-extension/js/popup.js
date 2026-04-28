// === YT Learner — popup.js ===
// Communicates with content.js (via chrome.tabs.sendMessage) and Spring Boot backend

const API_BASE_KEY = 'ytlearner_api_base';
const USERNAME_KEY = 'ytlearner_username';
const TRACKED_KEY  = 'ytlearner_tracked_videos';

let currentVideoId   = null;
let currentVideoMeta = {};
let quizQuestions    = [];
let currentQIndex    = 0;
let score            = 0;
let answered         = false;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await detectCurrentVideo();
  initTabs();
  initSummaryTab();
  initQuizTab();
  initQATab();
  initTriviaTab();
  initSettings();
  loadTrackedVideos();
});

// ─── Settings ─────────────────────────────────────────────────────────────────
async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get([API_BASE_KEY, USERNAME_KEY], (res) => {
      document.getElementById('apiUrlInput').value  = res[API_BASE_KEY]  || 'http://localhost:8080';
      document.getElementById('usernameInput').value = res[USERNAME_KEY] || 'guest';
      resolve();
    });
  });
}

function getApiBase() {
  return new Promise(resolve => {
    chrome.storage.local.get(API_BASE_KEY, (r) => resolve(r[API_BASE_KEY] || 'http://localhost:8080'));
  });
}

function getUsername() {
  return new Promise(resolve => {
    chrome.storage.local.get(USERNAME_KEY, (r) => resolve(r[USERNAME_KEY] || 'guest'));
  });
}

// ─── Detect current YouTube video ────────────────────────────────────────────
async function detectCurrentVideo() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url?.includes('youtube.com/watch')) {
    setStatusDot('idle');
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_VIDEO_META' });
    if (response?.videoId) {
      currentVideoId   = response.videoId;
      currentVideoMeta = response;
      renderVideoBanner(response);
      setStatusDot('active');
      checkIfTracked(response.videoId);
    }
  } catch (e) {
    // content script not ready yet — try injecting
    setStatusDot('error');
  }
}

function renderVideoBanner(meta) {
  document.getElementById('videoTitle').textContent   = meta.title   || 'Unknown Title';
  document.getElementById('videoChannel').textContent = meta.channel || 'Unknown Channel';
  document.getElementById('videoDuration').textContent = meta.duration || '';
  const thumb = document.getElementById('videoThumb');
  if (meta.videoId) {
    thumb.src = `https://img.youtube.com/vi/${meta.videoId}/mqdefault.jpg`;
  }
}

function setStatusDot(state) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot';
  if (state === 'active') dot.classList.add('active');
  if (state === 'error')  dot.classList.add('error');
}

// ─── Tabs ────────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────
function initSummaryTab() {
  document.getElementById('summarizeBtn').addEventListener('click', summarizeVideo);
  document.getElementById('copySummaryBtn').addEventListener('click', () => {
    const text = document.getElementById('summaryText').textContent;
    navigator.clipboard.writeText(text);
    showToast('Summary copied!');
  });
}

async function summarizeVideo() {
  if (!currentVideoId) { showToast('Open a YouTube video first'); return; }
  const length  = document.getElementById('summaryLength').value;
  const apiBase = await getApiBase();

  showSkeleton('summary');
  hideElement('summaryEmpty');
  hideElement('summaryResult');

  try {
    const res = await fetch(`${apiBase}/api/videos/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: currentVideoId,
        title:   currentVideoMeta.title,
        channel: currentVideoMeta.channel,
        length:  length
      })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    hideSkeleton('summary');
    showElement('summaryResult');

    document.getElementById('summaryText').textContent = data.summary;

    const kp = document.getElementById('keyPoints');
    kp.innerHTML = '';
    (data.keyPoints || []).forEach(pt => {
      const el = document.createElement('div');
      el.className = 'key-point-item';
      el.innerHTML = `<div class="key-point-dot"></div><span>${pt}</span>`;
      kp.appendChild(el);
    });
  } catch (err) {
    hideSkeleton('summary');
    showElement('summaryEmpty');
    showToast(`Error: ${err.message}`);
  }
}

// ─── Quiz Tab ─────────────────────────────────────────────────────────────────
function initQuizTab() {
  document.getElementById('generateQuizBtn').addEventListener('click', generateQuiz);
  document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
  document.getElementById('prevQuestionBtn').addEventListener('click', prevQuestion);
  document.getElementById('retryQuizBtn').addEventListener('click', retryQuiz);
}

async function generateQuiz() {
  if (!currentVideoId) { showToast('Open a YouTube video first'); return; }
  const count   = parseInt(document.getElementById('quizCount').value);
  const apiBase = await getApiBase();

  showSkeleton('quiz');
  hideElement('quizEmpty');
  hideElement('quizContainer');

  try {
    const res = await fetch(`${apiBase}/api/videos/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId: currentVideoId,
        title:   currentVideoMeta.title,
        count:   count
      })
    });

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    quizQuestions = data.questions;
    currentQIndex = 0;
    score = 0;
    answered = false;

    hideSkeleton('quiz');
    showElement('quizContainer');
    hideElement('quizEmpty');
    hideElement('quizComplete');
    document.getElementById('mcqCard').style.display = '';
    renderQuestion();
  } catch (err) {
    hideSkeleton('quiz');
    showElement('quizEmpty');
    showToast(`Error: ${err.message}`);
  }
}

function renderQuestion() {
  if (currentQIndex >= quizQuestions.length) { showQuizComplete(); return; }
  const q = quizQuestions[currentQIndex];
  answered = false;

  document.getElementById('quizProgress').textContent = `Question ${currentQIndex + 1} / ${quizQuestions.length}`;
  document.getElementById('quizScore').textContent     = `Score: ${score}`;
  document.getElementById('mcqQuestion').textContent   = q.question;

  const opts = document.getElementById('mcqOptions');
  opts.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  (q.options || []).forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'mcq-option';
    btn.innerHTML = `<span class="option-letter">${letters[i]}</span><span>${opt}</span>`;
    btn.addEventListener('click', () => checkAnswer(i, q.correctIndex, q.explanation));
    opts.appendChild(btn);
  });

  const fb = document.getElementById('mcqFeedback');
  fb.style.display = 'none';
  fb.className = 'mcq-feedback';

  document.getElementById('prevQuestionBtn').disabled = currentQIndex === 0;
  document.getElementById('nextQuestionBtn').textContent =
    currentQIndex === quizQuestions.length - 1 ? 'Finish' : 'Next →';
}

function checkAnswer(selectedIdx, correctIdx, explanation) {
  if (answered) return;
  answered = true;
  const options = document.querySelectorAll('.mcq-option');
  options.forEach((opt, i) => {
    opt.disabled = true;
    if (i === correctIdx) opt.classList.add('correct');
    else if (i === selectedIdx) opt.classList.add('wrong');
  });
  const correct = selectedIdx === correctIdx;
  if (correct) score++;

  const fb = document.getElementById('mcqFeedback');
  fb.style.display = '';
  fb.className = `mcq-feedback ${correct ? 'correct' : 'wrong'}`;
  fb.textContent = correct
    ? `✓ Correct! ${explanation || ''}`
    : `✗ The answer is ${['A','B','C','D'][correctIdx]}. ${explanation || ''}`;

  document.getElementById('quizScore').textContent = `Score: ${score}`;
}

function nextQuestion() {
  currentQIndex++;
  if (currentQIndex >= quizQuestions.length) { showQuizComplete(); return; }
  renderQuestion();
}

function prevQuestion() {
  if (currentQIndex > 0) { currentQIndex--; renderQuestion(); }
}

function retryQuiz() {
  currentQIndex = 0;
  score = 0;
  answered = false;
  hideElement('quizComplete');
  document.getElementById('mcqCard').style.display = '';
  renderQuestion();
}

function showQuizComplete() {
  const pct = Math.round((score / quizQuestions.length) * 100);
  document.getElementById('mcqCard').style.display = 'none';
  showElement('quizComplete');
  document.getElementById('finalScore').textContent = `${score} / ${quizQuestions.length}`;
  const msgs = ['Keep practicing! 💪', 'Good effort! 🙂', 'Well done! 👍', 'Excellent! 🌟', 'Perfect! 🏆'];
  document.getElementById('completeMsg').textContent = msgs[Math.floor(pct / 25)];
  saveQuizResult();
}

async function saveQuizResult() {
  const apiBase  = await getApiBase();
  const username = await getUsername();
  try {
    await fetch(`${apiBase}/api/quiz/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: currentVideoId, username, score, total: quizQuestions.length })
    });
  } catch (_) {}
}

// ─── Q&A Tab ──────────────────────────────────────────────────────────────────
function initQATab() {
  const input = document.getElementById('questionInput');
  input.addEventListener('input', () => {
    document.getElementById('charCount').textContent = `${input.value.length}/300`;
  });
  document.getElementById('submitQuestionBtn').addEventListener('click', submitQuestion);

  // Load questions when tab becomes active
  document.querySelector('[data-tab="questions"]').addEventListener('click', loadQuestions);
}

async function submitQuestion() {
  const text     = document.getElementById('questionInput').value.trim();
  const username = await getUsername();
  const apiBase  = await getApiBase();
  if (!text || !currentVideoId) return;

  try {
    const res = await fetch(`${apiBase}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId: currentVideoId, author: username, text })
    });
    if (!res.ok) throw new Error();
    document.getElementById('questionInput').value = '';
    document.getElementById('charCount').textContent = '0/300';
    showToast('Question posted!');
    loadQuestions();
  } catch {
    showToast('Failed to post question');
  }
}

async function loadQuestions() {
  if (!currentVideoId) return;
  const apiBase = await getApiBase();
  showElement('questionsLoading');
  try {
    const res = await fetch(`${apiBase}/api/questions/${currentVideoId}`);
    const questions = await res.json();
    renderQuestions(questions);
  } catch {
    showToast('Could not load questions');
  } finally {
    hideElement('questionsLoading');
  }
}

function renderQuestions(questions) {
  const list = document.getElementById('questionsList');
  list.innerHTML = '';
  if (!questions?.length) {
    list.innerHTML = document.getElementById('questionsEmpty').outerHTML;
    return;
  }
  questions.forEach(q => {
    const card = document.createElement('div');
    card.className = 'question-card';
    const answersHtml = (q.answers || []).map(a =>
      `<div class="answer-item"><span class="answer-author">${escapeHtml(a.author)}:</span>${escapeHtml(a.text)}</div>`
    ).join('');
    card.innerHTML = `
      <div class="q-meta">
        <span class="q-author">${escapeHtml(q.author)}</span>
        <span class="q-time">${formatTime(q.createdAt)}</span>
      </div>
      <div class="q-text">${escapeHtml(q.text)}</div>
      ${answersHtml ? `<div class="answers-list">${answersHtml}</div>` : ''}
      <div class="answer-input-row">
        <input type="text" class="answer-input" placeholder="Write an answer…" id="ans_${q.id}" />
        <button class="secondary-btn" onclick="submitAnswer('${q.id}', '${escapeHtml(q.videoId)}')">Post</button>
      </div>`;
    list.appendChild(card);
  });
}

window.submitAnswer = async (questionId, videoId) => {
  const input    = document.getElementById(`ans_${questionId}`);
  const text     = input?.value?.trim();
  const username = await getUsername();
  const apiBase  = await getApiBase();
  if (!text) return;
  try {
    await fetch(`${apiBase}/api/questions/${questionId}/answers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author: username, text })
    });
    showToast('Answer posted!');
    loadQuestions();
  } catch {
    showToast('Failed to post answer');
  }
};

// ─── Trivia Tab ───────────────────────────────────────────────────────────────
function initTriviaTab() {
  document.getElementById('saveForTriviaBtn').addEventListener('click', toggleTracking);
  document.getElementById('saveTriviaPrefBtn').addEventListener('click', saveTriviaPrefs);
  document.getElementById('fetchTriviaBtn').addEventListener('click', fetchTrivia);
  document.querySelector('[data-tab="trivia"]').addEventListener('click', loadTrackedVideos);
}

async function toggleTracking() {
  if (!currentVideoId) return;
  const tracked = await getTrackedVideos();
  const exists  = tracked.find(v => v.videoId === currentVideoId);
  let updated;

  if (exists) {
    updated = tracked.filter(v => v.videoId !== currentVideoId);
    document.getElementById('saveForTriviaBtn').textContent = '📌 Track';
    document.getElementById('saveForTriviaBtn').classList.remove('tracked');
    showToast('Removed from tracking');
  } else {
    updated = [...tracked, { ...currentVideoMeta, videoId: currentVideoId, trackedAt: Date.now() }];
    document.getElementById('saveForTriviaBtn').textContent = '✓ Tracked';
    document.getElementById('saveForTriviaBtn').classList.add('tracked');
    showToast('Video tracked for trivia!');
    // Notify backend
    const apiBase  = await getApiBase();
    const username = await getUsername();
    try {
      await fetch(`${apiBase}/api/trivia/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: currentVideoId, username, title: currentVideoMeta.title })
      });
    } catch (_) {}
  }

  chrome.storage.local.set({ [TRACKED_KEY]: updated });
  loadTrackedVideos();
}

function checkIfTracked(videoId) {
  chrome.storage.local.get(TRACKED_KEY, (r) => {
    const tracked = r[TRACKED_KEY] || [];
    if (tracked.find(v => v.videoId === videoId)) {
      document.getElementById('saveForTriviaBtn').textContent = '✓ Tracked';
      document.getElementById('saveForTriviaBtn').classList.add('tracked');
    }
  });
}

function getTrackedVideos() {
  return new Promise(resolve => {
    chrome.storage.local.get(TRACKED_KEY, (r) => resolve(r[TRACKED_KEY] || []));
  });
}

async function loadTrackedVideos() {
  const tracked = await getTrackedVideos();
  const list    = document.getElementById('trackedVideosList');
  list.innerHTML = '';

  if (!tracked.length) {
    list.innerHTML = document.getElementById('trackedEmpty').outerHTML;
    return;
  }

  tracked.forEach(v => {
    const item = document.createElement('div');
    item.className = 'tracked-item';
    item.innerHTML = `
      <img class="tracked-thumb" src="https://img.youtube.com/vi/${v.videoId}/default.jpg" alt="" />
      <div class="tracked-info">
        <div class="tracked-title" title="${escapeHtml(v.title || '')}">${escapeHtml(v.title || v.videoId)}</div>
        <div class="tracked-channel">${escapeHtml(v.channel || '')}</div>
      </div>
      <button class="untrack-btn" title="Remove" onclick="untrackVideo('${v.videoId}')">✕</button>`;
    list.appendChild(item);
  });
}

window.untrackVideo = async (videoId) => {
  const tracked = await getTrackedVideos();
  const updated = tracked.filter(v => v.videoId !== videoId);
  chrome.storage.local.set({ [TRACKED_KEY]: updated }, loadTrackedVideos);
  showToast('Removed from tracking');
};

async function saveTriviaPrefs() {
  const freq     = document.getElementById('triviaFrequency').value;
  const username = await getUsername();
  const apiBase  = await getApiBase();
  chrome.storage.local.set({ ytlearner_trivia_freq: freq });
  // Set Chrome alarm
  chrome.alarms.clear('ytlearner_trivia');
  chrome.alarms.create('ytlearner_trivia', { periodInMinutes: parseInt(freq) });
  try {
    await fetch(`${apiBase}/api/trivia/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, frequencyMinutes: parseInt(freq) })
    });
  } catch (_) {}
  showToast('Preferences saved!');
}

async function fetchTrivia() {
  const tracked  = await getTrackedVideos();
  const apiBase  = await getApiBase();
  const username = await getUsername();
  if (!tracked.length) { showToast('Track some videos first!'); return; }

  showSkeleton('trivia');
  hideElement('triviaFeedEmpty');

  try {
    const videoIds = tracked.map(v => v.videoId);
    const res = await fetch(`${apiBase}/api/trivia/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, videoIds })
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderTriviaFeed(data.triviaCards);
  } catch {
    showToast('Failed to fetch trivia');
    showElement('triviaFeedEmpty');
  } finally {
    hideSkeleton('trivia');
  }
}

function renderTriviaFeed(cards) {
  const feed = document.getElementById('triviaFeed');
  feed.innerHTML = '';
  if (!cards?.length) { showElement('triviaFeedEmpty'); return; }
  cards.forEach(card => {
    const el = document.createElement('div');
    el.className = 'trivia-card';
    el.innerHTML = `
      <div class="trivia-card-label">${card.type === 'note' ? '📝 Note' : '❓ Recall Question'}</div>
      <div class="trivia-card-text">${escapeHtml(card.content)}</div>
      ${card.source ? `<div class="trivia-card-source">From: ${escapeHtml(card.source)}</div>` : ''}`;
    feed.appendChild(el);
  });
}

// ─── Settings Panel ────────────────────────────────────────────────────────────
function initSettings() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    showElement('settingsPanel');
  });
  document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    hideElement('settingsPanel');
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const apiUrl   = document.getElementById('apiUrlInput').value.trim();
    const username = document.getElementById('usernameInput').value.trim();
    chrome.storage.local.set({
      [API_BASE_KEY]: apiUrl || 'http://localhost:8080',
      [USERNAME_KEY]: username || 'guest'
    });
    const toast = document.getElementById('settingsToast');
    toast.style.display = '';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function showSkeleton(tab) {
  const el = document.getElementById(`${tab}Skeleton`);
  if (el) el.style.display = '';
}
function hideSkeleton(tab) {
  const el = document.getElementById(`${tab}Skeleton`);
  if (el) el.style.display = 'none';
}
function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = '';
}
function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('globalToast');
  toast.textContent = msg;
  toast.style.display = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}
