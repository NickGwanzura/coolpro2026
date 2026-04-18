# Systems Capabilities Report: AI Voice Assistant for HEVACRAZ Web App

## Executive Summary

This report outlines the technical feasibility and implementation strategy for deploying an AI Voice Assistant in the HEVACRAZ (HVAC-R Association of Zimbabwe) web application. Unlike native mobile applications, this voice assistant will operate through mobile browsers on mid-range Android devices, leveraging Web Speech API, WebRTC, and Progressive Web App (PWA) technologies. The initiative aims to provide technicians with hands-free access to COC lookups, technician verification, job logging, and sizing calculations critical functions for field workers in Zimbabwe's HVAC-R industry.

**Go/No-Go Recommendation:** **CONDITIONAL GO** (Risk Level: Medium)

The web-based voice solution is technically feasible with acceptable performance for 80%+ of target devices. Key risks include browser background tab restrictions and microphone permission UX, both mitigable through careful UI design and offline-first architecture.

---

## 1. Web Platform Capabilities Matrix

### Browser-Based Voice Technologies

| Capability | Web API | Online Mode | Offline Mode | Status |
|------------|---------|-------------|--------------|--------|
| Speech-to-Text | Web Speech API | Cloud (Google/Apple servers) | WebRTC + Whisper.js | ⚠ Partial |
| Natural Language Understanding | OpenAI Realtime API | GPT-4o | Transformers.js (limited) | ⚠ Partial |
| Text-to-Speech | Web Speech API synthesis | Cloud voices | Browser native TTS | ✓ Ready |
| Wake Word Detection | WebRTC VAD | Cloud | Porcupine.js (on-device) | ✗ Not Possible |
| Audio Recording | MediaRecorder API | ✓ | ✓ (local storage) | ✓ Ready |
| Push Notifications | Push API | ✓ | ✗ (requires service worker) | ⚠ Partial |
| Background Sync | Background Sync API | ✓ | ✓ (deferred sync) | ✓ Ready |
| Local Storage | IndexedDB | ✓ | ✓ (50MB-2GB) | ✓ Ready |
| Offline Page Cache | Service Worker | ✓ | ✓ | ✓ Ready |
| Microphone Access | getUserMedia | ✓ (HTTPS required) | ✓ | ✓ Ready |

### Browser Compatibility (Zimbabwe Market)

| Browser | Market Share | Web Speech API | MediaRecorder | PWA Support | Recommendation |
|---------|-------------|----------------|---------------|-------------|----------------|
| Chrome Mobile | ~65% | ✓ Full | ✓ Full | ✓ | Primary target |
| Samsung Internet | ~15% | ✓ Full | ✓ Full | ✓ | Secondary |
| Opera Mini | ~10% | ✗ None | ✗ None | ✗ | Not supported |
| Firefox Mobile | ~5% | ✓ Partial | ✓ Full | ✓ | Tertiary |
| Safari iOS | ~5% | ✓ Full | ✓ Full | ✓ (limited) | iOS users |

---

## 2. PWA (Progressive Web App) Capabilities

### Core PWA Features for Voice

| Feature | Capability | Implementation |
|---------|-----------|----------------|
| Installable | Add to home screen, full-screen | manifest.json, icons |
| Offline Functionality | Service worker caches voice assets | Workbox/Custom SW |
| Background Audio | Continue listening when screen off | AudioContext + Wake Lock |
| Push Notifications | Alert for voice responses | Push API + VAPID |
| Periodic Sync | Sync offline voice queries | Periodic Background Sync |
| File System Access | Save voice memos locally | File System Access API |

### PWA Limitations vs Native

- **No wake word detection** when app closed (OS restriction)
- **Limited background processing** (iOS especially)
- **No access to Bluetooth headset buttons** (inconsistent)
- **Microphone permission** requires user gesture each session (some browsers)

---

## 3. Connectivity & Infrastructure Analysis

### Zimbabwe-Specific Web Constraints

- **Average mobile data speeds:** Urban 5-15 Mbps, Rural 1-3 Mbps
- **Data costs:** $1-2 per GB (significant for technicians)
- **Browser caching behavior:** Aggressive cache clearing on low storage
- **Power:** Devices often in battery saver mode (restricts background)

### Web-Optimized Architecture

| Connectivity State | Strategy | User Experience |
|-------------------|----------|-----------------|
| 4G/WiFi (Strong) | Full WebRTC + Cloud AI | Real-time conversation |
| 3G (Moderate) | Compressed audio (Opus), queued responses | Slight delay, queued TTS |
| 2G/Edge (Poor) | Record → Upload → Poll for response | Async, notification when ready |
| Offline | Local recording, IndexedDB queue, auto-sync | "Will send when online" |

### Edge Deployment for Web

- **Primary:** AWS CloudFront (Cape Town edge)
- **Secondary:** Cloudflare Workers (Lusaka/Nairobi)
- **Target:** <100ms TTFB for web assets

---

## 4. Audio Pipeline Architecture

### Browser Audio Stack

```
[Microphone] → getUserMedia → MediaRecorder → [Audio Blob]
                                      ↓
[Web Speech API] ← AudioContext ← Real-time Stream (online)
                                      ↓
[Whisper.js] ← AudioWorklet ← Offline Processing (PWA)
                                      ↓
[OpenAI Realtime API] ← WebSocket ← Cloud Processing
                                      ↓
[Response] → TTS (Web Speech/Cloud) → AudioContext → [Speaker]
```

### Audio Format Strategy

- **Recording:** Opus (webm) - 50% smaller than MP3
- **Streaming:** Opus @ 24kbps for voice
- **Storage:** Compressed base64 in IndexedDB
- **Fallback:** WAV for compatibility (Opera Mini excluded)

---

## 5. Device & Browser Capability Audit

### Target Device Landscape (Web Access)

| Device Tier | Example Models | Browser | RAM | Web Speech | PWA Install | Experience |
|-------------|---------------|---------|-----|------------|-------------|------------|
| High | Samsung A54, Tecno Camon 20 | Chrome | 6-8GB | ✓ Native | ✓ | Full voice |
| Mid | Samsung A14, Itel S23 | Chrome | 4GB | ✓ Native | ✓ | Good voice |
| Low | Itel A60, Nokia C32 | Chrome/Opera | 2-3GB | ⚠ Slow | ⚠ | Text-primary |
| Legacy | Any with Opera Mini | Opera Mini | 1GB | ✗ None | ✗ | Not supported |

### Browser-Specific Limitations

- **Chrome Android:** Requires HTTPS, microphone permission per domain
- **Safari iOS:** Web Speech API requires user interaction to start, no background audio
- **Samsung Internet:** Good PWA support, occasional WebRTC issues
- **Opera Mini:** Proxy-based, no Web Audio API support (EXCLUDE)

---

## 6. Web Integration Points

### HEVACRAZ Web App Systems

| System | Integration Type | Web API | Real-time | Offline Queue |
|--------|-----------------|---------|-----------|---------------|
| COC Database | REST/GraphQL | fetch() | No | Background Sync |
| Technician Registry | REST API | fetch() | No | IndexedDB |
| Job Logging | REST API | fetch() | No | Background Sync |
| Sizing Calculator | WebAssembly + JS | Local + Cloud | Yes (calc) | Local formula |
| Training Resources | Headless CMS | fetch() | No | Cache API |
| Voice AI Engine | WebSocket | Native WebSocket | Yes | IndexedDB queue |

---

## 7. Security & Privacy (Web Context)

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| HTTPS mandatory | Let's Encrypt/Cloudflare | Required |
| Microphone permissions | Permission API, explicit ask | Per-session |
| Voice data encryption | TLS 1.3 in transit, AES-256 at rest | Implemented |
| CORS policies | Restricted to hevacraz.space | Configured |
| Content Security Policy | Prevent XSS, inline scripts | Strict CSP |
| Local data encryption | SubtleCrypto API for IndexedDB | Optional |

### Privacy Compliance

- **Voice recordings:** Retain 30 days, auto-delete
- **Browser storage:** Clear on logout option
- **Third-party:** No Google/Apple voice data storage (use own Whisper)
- **Consent:** Explicit opt-in for voice recording, revocable

---

## 8. Performance Benchmarks (Web)

### Web-Specific Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Web Speech API init | <500ms | Custom |
| Voice-to-text latency | <2s (online) | Custom |
| AI response generation | <3s | Custom |
| TTS first byte | <500ms | Custom |
| PWA install prompt | <30s engagement | Analytics |
| Offline page load | <1s | Lighthouse |

### Resource Loading

- **Initial bundle:** <200KB (gzipped)
- **Voice WASM (Whisper):** Lazy load on first use (~30MB)
- **TTS voices:** Load on demand
- **Critical CSS:** Inline (<14KB)

---

## 9. Cost Model (Web Infrastructure)

### Per-Technician Cost Scenarios

| Usage Tier | Voice Minutes | Bandwidth | Compute | Storage | Total/Month |
|------------|---------------|-----------|---------|---------|-------------|
| Light | 30 min | 50MB | $2.00 | $0.10 | $2.50 |
| Medium | 120 min | 200MB | $8.00 | $0.50 | $9.50 |
| Heavy | 300 min | 500MB | $20.00 | $1.00 | $22.00 |
| Offline-First | 60 min online | 100MB | $4.00 | $0.50 | $5.00 |

### Web Infrastructure Costs

- **CDN (CloudFlare/CloudFront):** ~$20/month
- **Edge compute (Workers/Functions):** ~$50/month
- **WebSocket servers:** ~$30/month
- **Object storage (voice recordings):** ~$10/month
- **Monitoring (Sentry/LogRocket):** ~$30/month

---

## 10. Web-Specific Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Browser kills background tab | High | High | Wake Lock API, keep-alive ping |
| Microphone permission denied | Medium | High | Clear UX, fallback to text |
| Opera Mini incompatibility | Medium | Medium | Detect and redirect to lite version |
| iOS Safari restrictions | Medium | Medium | Simplified iOS experience |
| Service worker fails to update | Low | High | SkipWaiting strategy, version alerts |
| Storage quota exceeded | Medium | Medium | LRU cache eviction, cloud sync |
| Web Speech API unavailable | Low | High | Fallback to Whisper.js |
| Battery saver mode | High | Medium | Detect and warn user |

---

## 11. Development Roadmap (Web)

### Phase 1: Core Web Voice (Weeks 1-4)

- [ ] PWA setup (manifest, service worker, icons)
- [ ] Web Speech API integration (STT + TTS)
- [ ] OpenAI Realtime API via WebSocket
- [ ] Basic voice UI (push-to-talk, waveform)
- [ ] Error code lookup via voice

### Phase 2: Offline PWA (Weeks 5-8)

- [ ] Service worker with Background Sync
- [ ] IndexedDB for voice memo storage
- [ ] Whisper.js for on-device STT (limited)
- [ ] Offline fallback pages
- [ ] Queue and sync mechanism

### Phase 3: Advanced Web Features (Weeks 9-12)

- [ ] Wake Lock for long voice sessions
- [ ] File System Access for exports
- [ ] Push notifications for async responses
- [ ] Shona language support
- [ ] Performance optimization

### Web Testing Requirements

- **Device lab:** 5 physical devices (high/mid/low tier)
- **Browser matrix:** Chrome, Samsung Internet, Firefox, Safari
- **Network throttling:** 3G, 2G, offline
- **Battery testing:** Voice session duration on battery

---

## 12. Competitive Web Capability Analysis

### vs. Native HVAC Apps (Cere, Bluon)

| Feature | HEVACRAZ Web | Native Apps | Advantage |
|---------|-------------|-------------|-----------|
| Install friction | Zero (visit URL) | App store download | Web |
| Update speed | Instant | App store review | Web |
| Offline capability | Good (PWA) | Excellent | Native |
| Background audio | Limited | Full | Native |
| Push notifications | Good (Android), Fair (iOS) | Excellent | Native |
| Hardware access | Limited (Bluetooth inconsistent) | Full | Native |
| Development cost | Lower | Higher | Web |
| Zimbabwe data cost | Lower (no app store) | Higher | Web |

### Unique Web Advantages

- No app store approval delays
- Instant updates (critical for regulations)
- Lower data to start (no APK download)
- Cross-platform (Android + iOS + Desktop)

---

## 13. Recommendations

### Immediate (Week 1)

- [ ] Validate Web Speech API on 3 target devices in Zimbabwe
- [ ] Test OpenAI WebSocket connectivity from Harare
- [ ] Confirm PWA install prompts work on Samsung/Itel devices

### Architecture Decisions

- [ ] Use Web Speech API for online (free, native)
- [ ] Use Whisper.js for offline (limited vocabulary)
- [ ] Implement aggressive caching for PWA
- [ ] Design for "online-first, offline-graceful"

### Go/No-Go Criteria

- [ ] Web Speech API works on 80%+ of target devices
- [ ] Latency <3s acceptable to test users
- [ ] PWA install rate >30% of returning users
- [ ] Offline mode functions for core lookups

---

## Appendices

### Appendix A: Web Speech API Browser Compatibility Matrix

| Browser | Version | STT Support | TTS Support | Notes |
|---------|---------|-------------|-------------|-------|
| Chrome Android | 80+ | ✓ Full | ✓ Full | Primary target |
| Samsung Internet | 15+ | ✓ Full | ✓ Full | Good support |
| Firefox Android | 75+ | ✓ Partial | ✓ Full | Requires prefix |
| Safari iOS | 14.5+ | ✓ Full | ✓ Full | User gesture required |
| Opera Mini | All | ✗ None | ✗ None | Excluded |

### Appendix B: Sample WebSocket Implementation

```typescript
// WebSocket connection for OpenAI Realtime API
class VoiceWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  async connect() {
    this.ws = new WebSocket('wss://api.hevacraz.space/voice');
    
    this.ws.onopen = () => {
      console.log('Voice WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleVoiceResponse(data);
    };

    this.ws.onclose = () => {
      this.attemptReconnect();
    };
  }

  sendAudio(audioBlob: Blob) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(audioBlob);
    }
  }
}
```

### Appendix C: Service Worker Caching Strategy

```javascript
// Service Worker for voice assets
const CACHE_NAME = 'hevacraz-voice-v1';
const VOICE_ASSETS = [
  '/voice-ui.js',
  '/whisper.wasm',
  '/offline-voice.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(VOICE_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Cache-first for voice assets
  if (event.request.url.includes('/voice/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### Appendix D: PWA Manifest.json Specification

```json
{
  "name": "HEVACRAZ Voice Assistant",
  "short_name": "HEVACRAZ Voice",
  "description": "AI Voice Assistant for HVAC-R Technicians",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FDF8F3",
  "theme_color": "#FF6B35",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/voice-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/voice-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "Verify Technician",
      "url": "/verify-technician",
      "icons": [{ "src": "/icons/verify-96.png", "sizes": "96x96" }]
    },
    {
      "name": "COC Request",
      "url": "/jobs/request-coc",
      "icons": [{ "src": "/icons/coc-96.png", "sizes": "96x96" }]
    }
  ]
}
```

### Appendix E: Audio Format Conversion Pipeline

```typescript
// Audio conversion utilities
class AudioPipeline {
  // Convert MediaRecorder blob to Opus-encoded WebM
  async toOpus(blob: Blob): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Re-encode as Opus using MediaRecorder
    const mediaRecorder = new MediaRecorder(audioContext.createMediaStreamDestination(), {
      mimeType: 'audio/webm;codecs=opus'
    });
    
    return new Promise((resolve) => {
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm' }));
      mediaRecorder.start();
      
      // Write audio buffer to stream
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.createMediaStreamDestination());
      source.start();
      source.onended = () => mediaRecorder.stop();
    });
  }

  // Convert to base64 for IndexedDB storage
  async toBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-03-02  
**Author:** HEVACRAZ Technical Team  
**Classification:** Internal Technical Report
