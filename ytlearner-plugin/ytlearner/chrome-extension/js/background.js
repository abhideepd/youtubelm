// === YT Learner — background.js (Service Worker) ===
// Handles periodic trivia notifications via Chrome Alarms

const API_BASE_KEY = 'ytlearner_api_base';
const USERNAME_KEY = 'ytlearner_username';
const TRACKED_KEY  = 'ytlearner_tracked_videos';

// ─── Alarm listener — fires trivia notifications ────────────────────────────
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'ytlearner_trivia') return;

  try {
    const storage  = await chrome.storage.local.get([API_BASE_KEY, USERNAME_KEY, TRACKED_KEY]);
    const apiBase  = storage[API_BASE_KEY]  || 'http://localhost:8080';
    const username = storage[USERNAME_KEY]  || 'guest';
    const tracked  = storage[TRACKED_KEY]   || [];

    if (!tracked.length) return;

    const videoIds = tracked.map(v => v.videoId);
    const res = await fetch(`${apiBase}/api/trivia/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, videoIds, limit: 1 })
    });

    if (!res.ok) return;
    const data = await res.json();
    const card = data.triviaCards?.[0];
    if (!card) return;

    chrome.notifications.create({
      type:    'basic',
      iconUrl: 'icons/icon48.png',
      title:   '🧠 YT Learner — Daily Recall',
      message: card.content.slice(0, 140),
      contextMessage: card.source || ''
    });
  } catch (e) {
    console.error('[YTLearner] Trivia alarm error:', e);
  }
});

// ─── Restore alarms on service worker restart ────────────────────────────────
chrome.runtime.onStartup.addListener(restoreAlarms);
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    // Set default daily alarm
    chrome.alarms.create('ytlearner_trivia', { periodInMinutes: 1440 });
  }
  restoreAlarms();
});

async function restoreAlarms() {
  const { ytlearner_trivia_freq } = await chrome.storage.local.get('ytlearner_trivia_freq');
  const freq = parseInt(ytlearner_trivia_freq) || 1440;
  const existing = await chrome.alarms.get('ytlearner_trivia');
  if (!existing) {
    chrome.alarms.create('ytlearner_trivia', { periodInMinutes: freq });
  }
}

// ─── Listen for messages from content scripts ─────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'VIDEO_CHANGED') {
    // Could update badge, store last-watched, etc.
    chrome.action.setBadgeText({ text: '●' });
    chrome.action.setBadgeBackgroundColor({ color: '#7c6aff' });
  }
});
