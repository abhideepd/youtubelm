// === YT Learner — content.js ===
// Injected into youtube.com/watch pages
// Extracts video metadata, transcript, and communicates with popup.js

(function () {
  'use strict';

  // ─── Extract video metadata from the DOM ──────────────────────────────────
  function getVideoMeta() {
    const urlParams  = new URLSearchParams(window.location.search);
    const videoId    = urlParams.get('v');
    const title      = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent?.trim()
                    || document.title?.replace(' - YouTube', '').trim()
                    || '';
    const channel    = document.querySelector('#channel-name a, ytd-channel-name a')?.textContent?.trim() || '';
    const duration   = document.querySelector('.ytp-time-duration')?.textContent?.trim() || '';
    const views      = document.querySelector('#info-container ytd-video-view-count-renderer .view-count')?.textContent?.trim() || '';
    const description = document.querySelector('#description ytd-text-inline-expander, #snippet-text')?.textContent?.trim()?.slice(0,500) || '';

    return { videoId, title, channel, duration, views, description };
  }

  // ─── Extract transcript from YouTube's caption track ─────────────────────
  async function getTranscript(videoId) {
    try {
      // Try YouTube's internal transcript endpoint
      const pageData = ytInitialData || {};
      let captionTracks = [];

      // Navigate through ytInitialData to find caption tracks
      const playerResponse = window.ytInitialPlayerResponse;
      if (playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
        captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
      }

      if (!captionTracks.length) return null;

      // Prefer English
      const track = captionTracks.find(t => t.languageCode === 'en')
                 || captionTracks.find(t => t.languageCode?.startsWith('en'))
                 || captionTracks[0];

      const response = await fetch(track.baseUrl + '&fmt=json3');
      const data     = await response.json();

      // Build plain text transcript
      const text = (data.events || [])
        .filter(e => e.segs)
        .map(e => e.segs.map(s => s.utf8 || '').join(''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text || null;
    } catch (e) {
      return null;
    }
  }

  // ─── Listen for messages from popup ──────────────────────────────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_VIDEO_META') {
      sendResponse(getVideoMeta());
      return true;
    }

    if (request.type === 'GET_TRANSCRIPT') {
      getTranscript(request.videoId).then(transcript => {
        sendResponse({ transcript });
      });
      return true; // async
    }

    if (request.type === 'SEEK_TO') {
      const video = document.querySelector('video');
      if (video && typeof request.seconds === 'number') {
        video.currentTime = request.seconds;
        sendResponse({ ok: true });
      }
      return true;
    }
  });

  // ─── Observe navigation (YouTube is an SPA) ───────────────────────────────
  let lastVideoId = null;
  const observer = new MutationObserver(() => {
    const params  = new URLSearchParams(window.location.search);
    const videoId = params.get('v');
    if (videoId && videoId !== lastVideoId) {
      lastVideoId = videoId;
      // Notify background that a new video is being watched
      chrome.runtime.sendMessage({
        type: 'VIDEO_CHANGED',
        meta: getVideoMeta()
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial notification
  setTimeout(() => {
    const meta = getVideoMeta();
    if (meta.videoId) {
      lastVideoId = meta.videoId;
      chrome.runtime.sendMessage({ type: 'VIDEO_CHANGED', meta });
    }
  }, 1500);

})();
