/**
 * SermonSearch - Main application for searching and displaying sermon content
 * Fellowship Digital Ministry
 * 
 * This is an optimized version with improved UX, performance,
 * and proper API integration.
 */

// Global API configuration that Jekyll can write to directly
const API_CONFIG = {
  baseUrl: 'https://sermon-search-api-8fok.onrender.com'
};

/**
 * BYOK (Bring Your Own OpenRouter Key)
 *
 * When the shared daily cap is hit, motivated users can paste in their
 * own OpenRouter key. The key lives in localStorage only — we never
 * send it anywhere except OpenRouter (via the X-OpenRouter-Key header
 * on the answer endpoints, which the backend forwards without logging
 * or persisting).
 */
const BYOK_STORAGE_KEY = 'fellowship-openrouter-key-v1';

const BYOK = {
  get() {
    try { return localStorage.getItem(BYOK_STORAGE_KEY) || ''; }
    catch (e) { return ''; }
  },
  set(key) {
    try { localStorage.setItem(BYOK_STORAGE_KEY, key); }
    catch (e) {}
  },
  clear() {
    try { localStorage.removeItem(BYOK_STORAGE_KEY); }
    catch (e) {}
  },
  isValidShape(key) {
    // Real validation happens server-side on first use; this is just a
    // gentle prefix check to catch obvious paste mistakes.
    return typeof key === 'string' && /^sk-or-[A-Za-z0-9_-]{20,}$/.test(key.trim());
  },
};

/**
 * Thrown by SermonAPI methods when the backend returns a 429 with
 * byok_supported: true. The caller catches this specific type to know
 * it should offer the BYOK modal instead of showing a generic error.
 */
class CapHitError extends Error {
  constructor(detail) {
    super(detail.message || 'Daily quota exceeded');
    this.name = 'CapHitError';
    this.detail = detail;  // { error, message, byok_supported }
  }
}

/**
 * API Connection Module
 * This handles all API connections with proper error handling
 */
const SermonAPI = {
  // Base URL from Jekyll config with fallback
  baseUrl: API_CONFIG.baseUrl || 'https://sermon-search-api-8fok.onrender.com',
  
  /**
   * Verify API connection
   * @param {boolean} showFeedback - Whether to show feedback to the user
   * @returns {Promise<boolean>} - Whether the connection was successful
   */
  async verifyConnection(showFeedback = false) {
    console.log('Verifying API connection to:', this.baseUrl);
    
    // Show checking message if feedback is requested
    if (showFeedback) {
      const apiStatusBanner = document.getElementById('api-status-banner');
      const apiStatusMessage = document.getElementById('api-status-message');
      
      if (apiStatusBanner && apiStatusMessage) {
        apiStatusBanner.style.display = 'block';
        apiStatusBanner.style.backgroundColor = '#f0f9ff';
        apiStatusBanner.style.color = '#2ea3f2';
        apiStatusMessage.textContent = 'Checking connection...';
      }
    }
    
    try {
      // Ensure we're accessing the correct endpoint
      const url = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`API connection failed with status: ${response.status}`);
      }
      
      console.log('API connection successful');
      
      // Show success message if feedback was requested
      if (showFeedback) {
        const apiStatusBanner = document.getElementById('api-status-banner');
        const apiStatusMessage = document.getElementById('api-status-message');
        
        if (apiStatusBanner && apiStatusMessage) {
          apiStatusBanner.style.backgroundColor = '#f0fff4';
          apiStatusBanner.style.color = '#2ecc71';
          apiStatusMessage.textContent = 'Connected successfully!';
          
          // Hide after 3 seconds
          setTimeout(() => {
            apiStatusBanner.style.display = 'none';
          }, 3000);
        }
      }
      
      return true;
    } catch (error) {
      console.error('API connection verification failed:', error);
      
      // Show error message if feedback was requested
      if (showFeedback) {
        const apiStatusBanner = document.getElementById('api-status-banner');
        const apiStatusMessage = document.getElementById('api-status-message');
        
        if (apiStatusBanner && apiStatusMessage) {
          apiStatusBanner.style.display = 'block';
          apiStatusBanner.style.backgroundColor = '#fef2f2';
          apiStatusBanner.style.color = '#b91c1c';
          apiStatusMessage.textContent = 'API connection issue detected. Check your internet connection or try again later.';
        }
      } else {
        // Display the error in the messages area if we're not already showing feedback
        const messagesContainer = document.getElementById('messages');
        if (messagesContainer) {
          const errorElement = document.createElement('div');
          errorElement.className = 'message bot error';
          errorElement.innerHTML = `
            <div class="connection-error">
              <p>Sorry, I can't reach the sermon database right now. Please check your internet connection.</p>
              <button class="retry-button">Try Again</button>
            </div>
          `;
          messagesContainer.appendChild(errorElement);
          
          // Add click handler for retry button
          const retryButton = errorElement.querySelector('.retry-button');
          if (retryButton) {
            retryButton.addEventListener('click', () => this.verifyConnection(true));
          }
        }
      }
      
      return false;
    }
  },
  
  /**
   * Send a query to the API
   * @param {Object} queryData - The data to send
   * @returns {Promise<Object>} - The API response
   */
  async sendQuery(queryData) {
    const url = this.baseUrl.endsWith('/')
      ? `${this.baseUrl.slice(0, -1)}/answer`
      : `${this.baseUrl}/answer`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': window.location.origin,
      'Accept-Language': queryData.language || 'en',
    };
    const byokKey = BYOK.get();
    if (byokKey) headers['X-OpenRouter-Key'] = byokKey;

    const doFetch = () => fetch(url, {
      method: 'POST',
      headers,
      mode: 'cors',
      body: JSON.stringify(queryData),
    });

    console.log('Sending query to:', url);

    // Render free tier sleeps after inactivity; the first request after a cold
    // period can fail with a network error before the container is ready. Retry
    // once after a short delay to invisibly recover.
    let response;
    try {
      response = await doFetch();
    } catch (err) {
      console.warn('First /answer attempt failed, retrying after 5s (cold start?):', err);
      await new Promise(resolve => setTimeout(resolve, 5000));
      response = await doFetch();
    }

    // Cap-hit: backend returned 429 with byok_supported. Bubble a typed
    // error so the caller can offer the BYOK modal instead of a generic
    // failure message.
    if (response.status === 429) {
      const body = await response.json().catch(() => ({}));
      const detail = body.detail || body;  // FastAPI wraps in `detail`
      if (detail && detail.byok_supported) {
        throw new CapHitError(detail);
      }
    }

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Stream a query response via Server-Sent Events (SSE).
   *
   * Same backend model as sendQuery, but tokens arrive as they generate
   * so the user sees output start in <1s instead of waiting 6-8s.
   *
   * @param {Object} queryData - Same shape as sendQuery
   * @param {Object} callbacks - { onSources, onToken, onDone, onError }
   * @returns {Promise<void>} - Resolves when stream ends
   */
  async sendQueryStream(queryData, callbacks) {
    const url = this.baseUrl.endsWith('/')
      ? `${this.baseUrl.slice(0, -1)}/answer/stream`
      : `${this.baseUrl}/answer/stream`;

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Origin': window.location.origin,
      'Accept-Language': queryData.language || 'en',
    };
    const byokKey = BYOK.get();
    if (byokKey) headers['X-OpenRouter-Key'] = byokKey;

    const response = await fetch(url, {
      method: 'POST',
      headers,
      mode: 'cors',
      body: JSON.stringify(queryData),
    });

    // Cap-hit before the stream opens — backend rejects with 429 + JSON.
    if (response.status === 429) {
      const body = await response.json().catch(() => ({}));
      const detail = body.detail || body;
      if (detail && detail.byok_supported) {
        throw new CapHitError(detail);
      }
    }

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error('Response has no body (streaming not supported by this browser?)');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are delimited by a blank line (\n\n)
      const parts = buffer.split('\n\n');
      buffer = parts.pop();  // last possibly-incomplete event stays in buffer

      for (const part of parts) {
        const event = this._parseSSEEvent(part);
        if (!event) continue;
        switch (event.type) {
          case 'sources':
            if (callbacks.onSources) callbacks.onSources(event.data);
            break;
          case 'token':
            if (callbacks.onToken) callbacks.onToken(event.data.text || '');
            break;
          case 'done':
            if (callbacks.onDone) callbacks.onDone(event.data);
            break;
          case 'error':
            if (callbacks.onError) callbacks.onError(event.data.message || 'Stream error');
            break;
        }
      }
    }
  },

  /**
   * Find sermons by topic — no AI synthesis, just the matching sermon list.
   * Uses the /search backend endpoint. Returns SearchResponse shape:
   * { query, results: [SearchResult, ...], total_results, processing_time }
   */
  async searchSermons(query, opts) {
    opts = opts || {};
    const params = new URLSearchParams({
      query: query,
      top_k: String(opts.top_k || 15),
      min_score: String(opts.min_score || 0.55),
    });
    const url = this.baseUrl.endsWith('/')
      ? `${this.baseUrl.slice(0, -1)}/search?${params}`
      : `${this.baseUrl}/search?${params}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      mode: 'cors',
    });
    if (!response.ok) throw new Error(`Search request failed: ${response.status}`);
    return await response.json();
  },

  _parseSSEEvent(raw) {
    const lines = raw.split('\n');
    let type = 'message';
    const dataLines = [];
    for (const line of lines) {
      if (line.startsWith('event:')) type = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) return null;
    try {
      return { type, data: JSON.parse(dataLines.join('\n')) };
    } catch (e) {
      console.warn('Failed to parse SSE event JSON:', e);
      return null;
    }
  },

  /**
   * Fetch transcript for a video
   * @param {string} videoId - The video ID
   * @param {number} startTime - The start time
   * @param {string} language - The language
   * @returns {Promise<Object>} - The transcript data
   */
  async fetchTranscript(videoId, startTime = 0, language = 'en') {
    try {
      console.log(`Fetching transcript for video ${videoId} with language ${language}`);
      
      // Create the URL
      const url = this.baseUrl.endsWith('/')
        ? `${this.baseUrl.slice(0, -1)}/transcript/${videoId}?language=${language}`
        : `${this.baseUrl}/transcript/${videoId}?language=${language}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Origin': window.location.origin,
          'Accept-Language': language
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transcript:', error);
      throw error;
    }
  }
};

// Create a namespace to avoid global pollution
const SermonSearch = (function() {
  // Configuration
  const config = {
    apiUrl: SermonAPI.baseUrl, // Use the API module's baseUrl
    maxMemoryLength: 10,
    defaultLanguage: 'en',
    debounceTime: 300, // ms for debouncing events
    typingIndicatorTimeout: 60000, // 60s — covers OpenAI latency + occasional Render cold-start retry
    transitionDuration: 300 // ms for animations
  };

  // State management
  let state = {
    conversationHistory: [],
    persistedTurns: [],          // browser-only persistence; survives reload
    isFirstLoad: true,
    currentLanguage: config.defaultLanguage,
    currentMode: 'ask',          // 'ask' (AI synthesis) or 'find' (sermon list)
    isApiConnected: false,
    pendingRequests: 0,
    isScrolling: false,
    lastScrollTime: 0
  };

  // ===== Browser-only chat persistence =====
  // The conversation lives in memory and dies on page reload, which is a
  // real UX failure when users navigate away and come back. We persist
  // the last N turns to localStorage. No backend, no logging — just the
  // user's own browser remembering what they were doing.
  const CHAT_STORAGE_KEY = 'fellowship-chat-v1';
  const CHAT_STORAGE_MAX_TURNS = 10;

  function saveChatTurns(turns) {
    try {
      const trimmed = turns.slice(-CHAT_STORAGE_MAX_TURNS);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      // Silent — quota exceeded, private browsing, etc.
    }
  }

  function loadChatTurns() {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function clearChatTurnsStorage() {
    try { localStorage.removeItem(CHAT_STORAGE_KEY); } catch (e) {}
  }

  // ===== BYOK UI =====
  // The cap-hit message is rendered inline in the chat when the backend
  // returns 429. It explains the cap and offers a button that opens the
  // BYOK modal. The modal walks the user through OpenRouter signup; on
  // save, the original query is automatically re-submitted with the key.

  // The pending query is kept here so the BYOK modal's save handler can
  // retry the request after the key is stored.
  let pendingCapHitQuery = null;

  function renderCapHitMessage(query, capDetail, existingBotEl) {
    pendingCapHitQuery = query;

    const html = `
      <div class="cap-hit-message" role="alert">
        <strong>Today's question quota is used up</strong>
        <p>${capDetail && capDetail.message ? escapeHtml(capDetail.message) : "This is a personal-volunteer project running on a small daily budget, and it's been used up for today. The site will work again tomorrow."}</p>
        <p>Want to keep exploring now? You can use your own OpenRouter key — about 2 cents per question, stays in your browser only.</p>
        <div class="cap-hit-actions">
          <button type="button" class="cap-hit-primary" data-cap-action="byok">Use my own key</button>
          <button type="button" class="cap-hit-secondary" data-cap-action="dismiss">Maybe tomorrow</button>
        </div>
      </div>
    `;

    let containerEl;
    if (existingBotEl) {
      // Streaming bubble was already created with a placeholder — replace
      // its content rather than leaving a "Reviewing sermons…" dangling.
      const contentEl = existingBotEl.querySelector('.claude-message-content');
      if (contentEl) {
        contentEl.innerHTML = html;
        containerEl = contentEl;
      }
    }
    if (!containerEl) {
      // Non-streaming path: create a fresh bot bubble.
      const botEl = addMessage('<div class="error-container"></div>', 'bot', true);
      const contentEl = botEl.querySelector('.claude-message-content');
      contentEl.innerHTML = html;
      containerEl = contentEl;
    }

    // Wire the two action buttons.
    const byokBtn = containerEl.querySelector('[data-cap-action="byok"]');
    const dismissBtn = containerEl.querySelector('[data-cap-action="dismiss"]');
    if (byokBtn) byokBtn.addEventListener('click', () => openByokModal());
    if (dismissBtn) dismissBtn.addEventListener('click', () => {
      pendingCapHitQuery = null;
      // Replace the cap-hit block with a small acknowledgment.
      containerEl.innerHTML = '<p class="cap-hit-dismissed">No problem — try again tomorrow.</p>';
    });

    smoothScrollToBottom(elements.messagesContainer);
  }

  // Very small HTML-escape helper for interpolating server-supplied strings
  // into innerHTML. Used only for the cap-hit detail message.
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openByokModal() {
    if (!elements.byokSection) return;
    elements.byokSection.classList.add('active');
    elements.byokSection.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      if (elements.byokKeyInput) elements.byokKeyInput.focus();
    });
  }

  function closeByokModal() {
    if (!elements.byokSection) return;
    if (!elements.byokSection.classList.contains('active')) return;
    elements.byokSection.classList.remove('active');
    elements.byokSection.setAttribute('aria-hidden', 'true');
    if (elements.byokError) elements.byokError.textContent = '';
  }

  function updateByokIndicator() {
    const hasKey = !!BYOK.get();
    if (elements.byokIndicator) elements.byokIndicator.hidden = !hasKey;
    // The nudge is the inverse of the indicator — it disappears once
    // a key is in place since the indicator pill covers that state.
    if (elements.byokNudge) elements.byokNudge.hidden = hasKey;
  }

  function handleByokSave() {
    if (!elements.byokKeyInput) return;
    const raw = elements.byokKeyInput.value.trim();
    if (!BYOK.isValidShape(raw)) {
      if (elements.byokError) {
        elements.byokError.textContent =
          'That doesn\'t look like an OpenRouter key. Keys start with "sk-or-" — double-check that you copied the whole thing.';
      }
      return;
    }
    BYOK.set(raw);
    elements.byokKeyInput.value = '';
    if (elements.byokError) elements.byokError.textContent = '';
    updateByokIndicator();
    closeByokModal();

    // If we got here because of a cap-hit, automatically retry that query
    // so the user doesn't have to retype it.
    if (pendingCapHitQuery) {
      const q = pendingCapHitQuery;
      pendingCapHitQuery = null;
      elements.queryInput.value = q;
      elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }

  function handleByokRemove() {
    BYOK.clear();
    updateByokIndicator();
  }

  // DOM Elements - will be populated on init
  let elements = {};

  // Translations
  const translations = {
    en: {
      "welcome-title": "Welcome to the Sermon Search Tool",
      "welcome-intro": "Ask any question about the sermons and receive answers based on sermon content with timestamped video links.",
      "suggestion-heading": "Try asking about:",
      "example-1": "How can I be sure of heaven?",
      "example-2": "What does it mean to pour out your heart to God?",
      "example-3": "How do I raise godly children?",
      "example-4": "What does Elisha teach about God's power?",
      "example-5": "Why read the King James Bible?",
      "watch-video": "Watch Video",
      "hide-video": "Hide Video",
      "view-transcript": "View Transcript",
      "hide-transcript": "Hide Transcript",
      "open-youtube": "Open in YouTube",
      "loading-transcript": "Loading transcript...",
      "show-sources": "Show Sources",
      "hide-sources": "Hide Sources",
      "sources-found": "Sources Found",
      "view-all-sources": "View All Sources",
      "searching": "Searching sermon content...",
      "no-results": "No relevant sermon content found to answer this question.",
      "connection-error": "Sorry, I can't reach the sermon database right now. Please check your internet connection.",
      "try-again": "Try Again",
      "continue-conversation": "You can continue the conversation by asking follow-up questions.",
      "download-transcript": "Download Transcript",
      "search-in-transcript": "Search in transcript",
      "search": "Search",
      "what-does-pastor-teach": "What does the pastor teach about faith?",
      "view-full-text": "View full text",
      "match": "match",
      "matches-found": "matches found",
      "no-matches-found": "No matches found"
    },
    es: {
      "welcome-title": "Bienvenido a la Herramienta de Búsqueda de Sermones",
      "welcome-intro": "Haz cualquier pregunta sobre los sermones y recibirás respuestas basadas en el contenido con enlaces de video cronometrados.",
      "suggestion-heading": "Intenta preguntar sobre:",
      "example-1": "¿Cómo puedo estar seguro del cielo?",
      "example-2": "¿Qué significa derramar tu corazón delante de Dios?",
      "example-3": "¿Cómo puedo criar hijos piadosos?",
      "example-4": "¿Qué nos enseña Eliseo sobre el poder de Dios?",
      "example-5": "¿Por qué leer la Biblia Reina Valera?",
      "watch-video": "Ver Video",
      "hide-video": "Ocultar Video",
      "view-transcript": "Ver Transcripción",
      "hide-transcript": "Ocultar Transcripción",
      "open-youtube": "Abrir en YouTube",
      "loading-transcript": "Cargando transcripción...",
      "show-sources": "Mostrar Fuentes",
      "hide-sources": "Ocultar Fuentes",
      "sources-found": "Fuentes Encontradas",
      "view-all-sources": "Ver Todas las Fuentes",
      "searching": "Buscando contenido de sermones...",
      "no-results": "No se encontró contenido de sermón relevante para responder esta pregunta.",
      "connection-error": "Lo siento, no puedo acceder a la base de datos de sermones en este momento. Por favor, verifica tu conexión a internet.",
      "try-again": "Intentar de Nuevo",
      "continue-conversation": "Puedes continuar la conversación haciendo preguntas de seguimiento.",
      "download-transcript": "Descargar Transcripción",
      "search-in-transcript": "Buscar en la transcripción",
      "search": "Buscar",
      "what-does-pastor-teach": "¿Qué enseña el pastor sobre la fe?",
      "view-full-text": "Ver texto completo",
      "match": "coincidencia",
      "matches-found": "coincidencias encontradas",
      "no-matches-found": "No se encontraron coincidencias"
    },
    zh: {
      "welcome-title": "欢迎使用讲道搜索工具",
      "welcome-intro": "询问任何关于讲道的问题，您将获得基于讲道内容的答案，包含带有时间戳的视频链接。",
      "suggestion-heading": "尝试询问：",
      "example-1": "我如何能确信能进天堂？",
      "example-2": "在神面前倾心吐意是什么意思？",
      "example-3": "我如何培养敬虔的孩子？",
      "example-4": "以利沙关于神能力的教导是什么？",
      "example-5": "为什么要读和合本圣经？",
      "watch-video": "观看视频",
      "hide-video": "隐藏视频",
      "view-transcript": "查看文字稿",
      "hide-transcript": "隐藏文字稿",
      "open-youtube": "在YouTube中打开",
      "loading-transcript": "加载文字稿中...",
      "show-sources": "显示来源",
      "hide-sources": "隐藏来源",
      "sources-found": "找到的来源",
      "view-all-sources": "查看所有来源",
      "searching": "搜索讲道内容中...",
      "no-results": "未找到相关讲道内容来回答此问题。",
      "connection-error": "抱歉，我现在无法连接到讲道数据库。请检查您的互联网连接。",
      "try-again": "重试",
      "continue-conversation": "您可以通过提出后续问题继续对话。",
      "download-transcript": "下载文字稿",
      "search-in-transcript": "在文字稿中搜索",
      "search": "搜索",
      "what-does-pastor-teach": "牧师关于信心的教导是什么？",
      "view-full-text": "查看全文",
      "match": "匹配",
      "matches-found": "个匹配项",
      "no-matches-found": "未找到匹配项"
    }
  };

  // Bible reference regex for different languages
  const bibleRefRegexByLanguage = {
    en: /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi,
    es: /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi,
    zh: /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi
  };

  // Sample queries for suggestions
  const sampleQueries = [
    "example-1", "example-2", "example-3", "example-4", "example-5"
  ];

  // Define SERMON_TOPICS globally so it can be used across functions
  const SERMON_TOPICS = [
    "prayer", "faith", "forgiveness", "salvation", "holy spirit",
    "discipleship", "worship", "evangelism", "relationships", "suffering",
    "biblical interpretation", "theology", "christian living", "spiritual growth"
  ];

  // ======= UTILITY FUNCTIONS =======

  /**
   * Creates a debounced function that delays invoking func until after wait milliseconds
   * @param {Function} func - The function to debounce
   * @param {number} wait - The number of milliseconds to delay
   * @return {Function} - The debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  /**
   * Creates a throttled function that only invokes func at most once per every wait milliseconds
   * @param {Function} func - The function to throttle
   * @param {number} wait - The number of milliseconds to throttle invocations to
   * @return {Function} - The throttled function
   */
  function throttle(func, wait) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= wait) {
        lastCall = now;
        func.apply(this, args);
      }
    };
  }

  /**
   * Safely get a DOM element with error handling
   */
  function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with ID '${id}' not found`);
    }
    return element;
  }

  /**
   * Translate a key to the current language
   */
  function translate(key) {
    if (!translations[state.currentLanguage]) {
      return key;
    }
    return translations[state.currentLanguage][key] || key;
  }

  /**
   * Get Bible reference regex for current language
   */
  function getBibleReferenceRegex() {
    return bibleRefRegexByLanguage[state.currentLanguage] || bibleRefRegexByLanguage.en;
  }

  /**
   * Parse an English Bible reference ("Romans 8:28", "1 Cor 13", "John 3:16-17",
   * "Psalm 23") into the slug + chapter + verse the reference viewer's hash router
   * understands (see assets/js/reference-viewer.js).
   * Returns null if the reference isn't parseable in English (e.g. Spanish / Chinese
   * book names) — caller should fall back to the external Bible link.
   */
  function parseEnglishBibleReference(refText) {
    if (!refText) return null;
    // Book name: optional 1-3 prefix (Samuel/Kings/etc), then 1-3 word name
    // (covers "Song of Solomon"). Captures chapter and optional starting verse.
    const m = refText.trim().match(/^([1-3]?\s?[A-Za-z]+(?:\s+[A-Za-z]+){0,2})\s+(\d+)(?:\s*:\s*(\d+))?/);
    if (!m) return null;
    const slug = m[1].replace(/\s+/g, '');
    return {
      slug: slug,
      chapter: parseInt(m[2], 10),
      verse: m[3] ? parseInt(m[3], 10) : null
    };
  }

  /**
   * Build a same-origin URL into the reference viewer for a given English ref text.
   * Returns null if the ref can't be parsed.
   */
  function referenceViewerUrlFor(refText) {
    const parsed = parseEnglishBibleReference(refText);
    if (!parsed) return null;
    let hash = '#' + parsed.slug + '/' + parsed.chapter;
    if (parsed.verse) hash += '/' + parsed.verse;
    const u = new URL('reference-viewer.html' + hash, document.baseURI);
    return u.pathname + u.hash;
  }

  /**
   * Open a Bible reference inside our own reference viewer. Parseable English
   * refs deep-link straight into the chapter/verse; anything else (Spanish /
   * Chinese book names, malformed text) lands on the reference-viewer home
   * where the user can browse or use the lookup.
   */
  function openBibleReference(refText) {
    const localUrl = referenceViewerUrlFor(refText) ||
      new URL('reference-viewer.html', document.baseURI).pathname;
    window.open(localUrl, '_blank', 'noopener');
  }

  /**
   * Format timestamp to MM:SS
   */
  function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format sermon date from various formats
   */
  function formatSermonDate(dateStr) {
    if (!dateStr) return 'Date unknown';
    
    try {
      // Handle YYYYMMDD format
      if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr))) {
        const yearStr = String(dateStr).substring(0, 4);
        const monthStr = String(dateStr).substring(4, 6);
        const dayStr = String(dateStr).substring(6, 8);
        
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1;
        const day = parseInt(dayStr);
        
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return 'Date unknown';
        
        return new Intl.DateTimeFormat(state.currentLanguage, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Handle ISO date strings (YYYY-MM-DD)
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Date unknown';
        
        return new Intl.DateTimeFormat(state.currentLanguage, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      // Handle timestamp
      if (typeof dateStr === 'number') {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Date unknown';
        
        return new Intl.DateTimeFormat(state.currentLanguage, {
          year: 'numeric',
          month: 'long', 
          day: 'numeric'
        }).format(date);
      }
      
      return typeof dateStr === 'string' ? dateStr : 'Date unknown';
    } catch (e) {
      console.error(`Error parsing date: ${dateStr}`, e);
      return 'Date unknown';
    }
  }

  /**
   * Clean and format sermon title
   */
  function formatSermonTitle(title) {
    if (!title) return 'Unknown Sermon';
    return title.replace(/^["']|["']$/g, '');
  }

  /**
   * Escape HTML for safety
   */
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Format text for display with Bible references highlighted
   */
  function formatText(text) {
    if (!text) return '';
    // First escape HTML
    text = escapeHTML(text);
    // Then highlight Bible references
    return text.replace(getBibleReferenceRegex(), '<span class="bible-reference">$&</span>');
  }

  /**
   * Render Claude's markdown response to HTML.
   *
   * Claude (and most LLMs) returns answers as Markdown — headers, bold,
   * numbered/bulleted lists, blockquotes. We render via marked.js (loaded
   * from CDN in default.html) so users see formatted prose instead of
   * literal "##" and "**" tokens.
   *
   * Bible references like "Romans 3:23" still need to become clickable
   * spans. We post-process the rendered HTML's text nodes only (not tag
   * attributes) to wrap them in <span class="bible-reference">.
   */
  function formatResponse(text) {
    if (!text) return '';

    // Fallback if marked failed to load (CDN blocked, offline, etc.)
    let html;
    if (typeof marked !== 'undefined') {
      html = marked.parse(text, { breaks: true, gfm: true });
    } else {
      // Minimal fallback: escape + line breaks + bold
      html = escapeHTML(text)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    // Wrap the trailing "Bible-Based Questions You Might Find Helpful"
    // block in its own div so CSS can style it as a quieter, distinct
    // affordance (separated from the main answer).
    html = wrapSuggestionsBlock(html);

    return highlightBibleReferences(html);
  }

  /**
   * The backend appends `**Bible-Based Questions You Might Find Helpful:**\n\n1. ...`
   * to most answers. After markdown render that's a <p><strong>...</strong></p>
   * followed by an <ol>. Wrap both in a .suggested-questions-block div so
   * CSS can quietly separate them from the main answer body.
   */
  function wrapSuggestionsBlock(html) {
    const container = document.createElement('div');
    container.innerHTML = html;

    // Find the <strong> that contains the marker phrase
    const strongs = container.querySelectorAll('strong');
    let marker = null;
    for (const s of strongs) {
      if (/Bible[-\s]?Based Questions You Might Find Helpful/i.test(s.textContent)) {
        marker = s;
        break;
      }
    }
    if (!marker) return html;

    // The marker lives inside a <p>; the list follows as the next sibling
    const heading = marker.closest('p');
    if (!heading || !heading.parentNode) return html;
    const list = heading.nextElementSibling;

    const wrapper = document.createElement('div');
    wrapper.className = 'suggested-questions-block';
    heading.parentNode.insertBefore(wrapper, heading);
    wrapper.appendChild(heading);
    if (list && /^(ol|ul)$/i.test(list.tagName)) {
      wrapper.appendChild(list);
    }

    return container.innerHTML;
  }

  /**
   * Walk an HTML string's text nodes and wrap Bible references in spans.
   * Done DOM-side rather than via string regex so we never corrupt tag
   * attributes or break existing <a href> markup.
   */
  function highlightBibleReferences(html) {
    const regex = getBibleReferenceRegex();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const walker = document.createTreeWalker(wrapper, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) textNodes.push(node);

    for (const textNode of textNodes) {
      const original = textNode.nodeValue;
      if (!regex.test(original)) continue;
      // Reset lastIndex since /g regexes are stateful
      regex.lastIndex = 0;
      const replaced = original.replace(regex, '<span class="bible-reference">$&</span>');
      if (replaced === original) continue;
      const span = document.createElement('span');
      span.innerHTML = replaced;
      textNode.replaceWith(...span.childNodes);
    }
    return wrapper.innerHTML;
  }

  /**
   * Smooth scroll to the bottom of a container
   */
  function smoothScrollToBottom(container) {
    if (!container || state.isScrolling) return;
    
    const scrollHeight = container.scrollHeight;
    const currentScroll = container.scrollTop + container.clientHeight;
    const targetScroll = scrollHeight;
    
    // Only scroll if we're not already at the bottom
    if (scrollHeight - currentScroll > 20) {
      state.isScrolling = true;
      
      // Use requestAnimationFrame for smoother scrolling
      const startTime = performance.now();
      const startScroll = container.scrollTop;
      const duration = 300; // ms
      
      function scrollStep(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeOutCubic(progress);
        
        container.scrollTop = startScroll + (targetScroll - startScroll - container.clientHeight) * ease;
        
        if (progress < 1) {
          requestAnimationFrame(scrollStep);
        } else {
          state.isScrolling = false;
          state.lastScrollTime = Date.now();
        }
      }
      
      requestAnimationFrame(scrollStep);
    }
  }
  
  /**
   * Easing function for smooth scrolling
   */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ======= UI FUNCTIONS =======

  /**
   * Add a message to the chat
   */
function addMessage(text, sender, isError = false) {
  if (!elements.messagesContainer) return null;
  
  const messageElement = document.createElement('div');
  messageElement.className = `claude-message claude-message-${sender}`;
  messageElement.id = 'msg-' + Date.now();
  
  if (sender === 'bot') {
    messageElement.setAttribute('role', 'region');
    messageElement.setAttribute('aria-live', 'polite');
    messageElement.setAttribute('aria-atomic', 'true');
  }
  
  const messageContent = document.createElement('div');
  messageContent.className = 'claude-message-content';
  
  if (isError) {
    messageContent.classList.add('error');
    messageElement.setAttribute('role', 'alert');
  }
  
  // For bot messages, apply formatting
  if (sender === 'bot') {
    if (text.startsWith('<div class="welcome-message">')) {
      // Convert welcome message to enhanced Claude-style
      const welcomeContent = createWelcomeMessage();
      messageContent.appendChild(welcomeContent);
    } 
    else if (text.startsWith('<div class="error-container">') || 
             text.startsWith('<div class="connection-error">')) {
      // For pre-formatted HTML error content
      messageContent.innerHTML = text;
    } 
    else {
      // Regular text responses - NEVER add sources button here
      messageContent.innerHTML = formatResponse(text);
    }
    
    // Make Bible references clickable
    setupBibleReferenceClicks(messageContent);
  } else {
    // For user messages, use text content for security
    messageContent.textContent = text;
  }
  
  messageElement.appendChild(messageContent);
  elements.messagesContainer.appendChild(messageElement);
  
  // Add entrance animation class
  messageElement.classList.add('animating-in');
  
  // Apply staggered animation based on position
  const messages = elements.messagesContainer.querySelectorAll('.claude-message');
  const messageIndex = Array.from(messages).indexOf(messageElement);
  
  // Small stagger delay based on message index
  const staggerDelay = Math.min(messageIndex * 50, 200); // max 200ms delay
  
  // Set animation delay
  messageElement.style.animationDelay = `${staggerDelay}ms`;
  
  // Remove animation class after animation completes
  setTimeout(() => {
    messageElement.classList.remove('animating-in');
    messageElement.style.animationDelay = '';
  }, 500 + staggerDelay);
  
  // Smooth scroll to the bottom
  smoothScrollToBottom(elements.messagesContainer);
  
  return messageElement;
}

  /**
   * Add a typing indicator
   */
  function addTypingIndicator() {
    if (!elements.messagesContainer) return null;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'claude-typing claude-message-bot';
    typingElement.id = 'typing-' + Date.now();
    
    // ARIA for screen readers
    typingElement.setAttribute('aria-live', 'polite');
    typingElement.setAttribute('aria-label', translate('searching') || 'Searching sermon content...');
    
    // Create typing bubbles
    for (let i = 0; i < 3; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'claude-typing-bubble';
      bubble.style.animationDelay = `${i * 0.15}s`;
      typingElement.appendChild(bubble);
    }
    
    elements.messagesContainer.appendChild(typingElement);
    
    // Smooth scroll to bottom
    smoothScrollToBottom(elements.messagesContainer);
    
    // Auto-remove typing indicator after timeout (in case of network issues)
    const timeoutId = setTimeout(() => {
      if (document.getElementById(typingElement.id)) {
        removeMessage(typingElement.id);
      }
    }, config.typingIndicatorTimeout);
    
    // Store the timeout ID with the element
    typingElement.dataset.timeoutId = timeoutId;
    
    return typingElement.id;
  }

  /**
   * Remove a message by ID
   */
  function removeMessage(id) {
    const message = document.getElementById(id);
    if (!message) return;
    
    // Clear any associated timeout
    if (message.dataset.timeoutId) {
      clearTimeout(parseInt(message.dataset.timeoutId));
    }
    
    // Add animation class
    message.classList.add('animating-out');
    
    // Remove after animation
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, config.transitionDuration);
  }

/**
 * Create welcome message with suggestions
 */
function createWelcomeMessage() {
  const welcomeContainer = document.createElement('div');
  welcomeContainer.className = 'claude-welcome';
  welcomeContainer.setAttribute('role', 'region');
  welcomeContainer.setAttribute('aria-label', 'Welcome message');
  
  const title = document.createElement('h4');
  title.textContent = translate('welcome-title');
  
  const description = document.createElement('p');
  description.textContent = translate('welcome-intro');
  
  const suggestionLabel = document.createElement('p');
  suggestionLabel.className = 'claude-suggestion-label';
  suggestionLabel.textContent = translate('suggestion-heading');
  
  const suggestions = document.createElement('div');
  suggestions.className = 'claude-suggestions';
  suggestions.setAttribute('role', 'list');
  
  // Add suggestion chips with translated text
  sampleQueries.forEach(key => {
    const chip = document.createElement('button');
    chip.className = 'claude-suggestion';
    chip.textContent = translate(key);
    chip.setAttribute('role', 'listitem');
    chip.setAttribute('type', 'button');
    // Store the translation key for later reference
    chip.setAttribute('data-query-key', key);
    
    // Add click handler
    chip.addEventListener('click', function(e) {
      // Add visual feedback
      addRippleEffect(this, e);
      
      // Use the translated text from the button itself
      const translatedQuery = this.textContent;
      
      // Submit the query
      setTimeout(() => {
        elements.queryInput.value = translatedQuery;
        elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }, 300);
    });

    suggestions.appendChild(chip);
  });
  
  welcomeContainer.appendChild(title);
  welcomeContainer.appendChild(description);
  welcomeContainer.appendChild(suggestionLabel);
  welcomeContainer.appendChild(suggestions);
  
  return welcomeContainer;
}

/**
 * Update suggestions when language changes
 */
function updateSuggestions() {
  const suggestionChips = document.querySelectorAll('.claude-suggestion');
  
  suggestionChips.forEach(chip => {
    const queryKey = chip.getAttribute('data-query-key');
    if (queryKey && translations[state.currentLanguage] && translations[state.currentLanguage][queryKey]) {
      chip.textContent = translations[state.currentLanguage][queryKey];
    }
  });
}

  /**
   * Add ripple effect to element on click
   */
  function addRippleEffect(element, event) {
    if (!element) return;
    
    // Create ripple element
    const ripple = document.createElement('span');
    ripple.className = 'claude-ripple';
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.pointerEvents = 'none';
    ripple.style.left = (event.clientX - element.getBoundingClientRect().left - 50) + 'px';
    ripple.style.top = (event.clientY - element.getBoundingClientRect().top - 50) + 'px';
    ripple.style.transform = 'scale(0)';
    ripple.style.transition = 'transform 0.6s ease-out';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.style.transform = 'scale(2)';
    }, 1);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  /**
   * Add ripple effect to a newly added message
   */
  function addMessageRippleEffect(element) {
    if (!element) return;
    
    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'claude-ripple-container';
    ripple.style.position = 'absolute';
    ripple.style.top = '0';
    ripple.style.left = '0';
    ripple.style.right = '0';
    ripple.style.bottom = '0';
    ripple.style.overflow = 'hidden';
    ripple.style.pointerEvents = 'none';
    ripple.style.borderRadius = 'inherit';
    
    // Add to element
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    // Create the actual ripple
    const rippleInner = document.createElement('div');
    rippleInner.className = 'claude-ripple';
    rippleInner.style.position = 'absolute';
    rippleInner.style.borderRadius = '50%';
    rippleInner.style.backgroundColor = 'rgba(46, 163, 242, 0.15)';
    rippleInner.style.transformOrigin = 'center';
    rippleInner.style.transform = 'scale(0)';
    rippleInner.style.width = '100%';
    rippleInner.style.height = '100%';
    rippleInner.style.opacity = '1';
    rippleInner.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
    
    ripple.appendChild(rippleInner);
    
    // Trigger animation
    setTimeout(() => {
      rippleInner.style.transform = 'scale(2.5)';
      rippleInner.style.opacity = '0';
    }, 10);
    
    // Clean up
    setTimeout(() => {
      if (ripple.parentNode === element) {
        element.removeChild(ripple);
      }
    }, 1000);
  }

  /**
   * Setup Bible reference clicks for a DOM element
   */
  function setupBibleReferenceClicks(element) {
    if (!element) return;

    const bibleRefs = element.querySelectorAll('.bible-reference');

    bibleRefs.forEach(ref => {
      // Ensure it's accessible
      ref.setAttribute('role', 'button');
      ref.setAttribute('tabindex', '0');
      ref.setAttribute('aria-label', `Open Bible reference: ${ref.textContent.trim()}`);

      // Add click handler — routes English refs to our reference viewer.
      ref.addEventListener('click', function() {
        openBibleReference(this.textContent.trim());
      });

      // Add keyboard handler
      ref.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });

    // Asynchronously enrich each reference with a "N sermons →" chip
    // that links into the reference viewer. Best-effort: if the data
    // can't load, the refs still display + work as before.
    enrichBibleReferencesWithCounts(element);
  }

  // Cache the references_index across multiple message renders
  let _refsIndexPromise = null;
  function loadReferencesIndex() {
    if (!_refsIndexPromise) {
      _refsIndexPromise = fetch('/assets/data/analytics/references_index.json')
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}));
    }
    return _refsIndexPromise;
  }

  // "Romans 8:28" → "Romans 8"; "John 3:16-17" → "John 3"; "Hebrews 11" → "Hebrews 11"
  function chapterKeyFromReference(refText) {
    const m = refText.match(/^([1-3]?\s?[A-Za-z]+(?:\s[A-Za-z]+)?)\s+(\d+)/);
    return m ? `${m[1].trim()} ${m[2]}` : null;
  }

  async function enrichBibleReferencesWithCounts(element) {
    const refs = element.querySelectorAll('.bible-reference');
    if (!refs.length) return;

    let index;
    try {
      index = await loadReferencesIndex();
    } catch (e) {
      return;  // silent fallback — refs already work
    }
    if (!index || !Object.keys(index).length) return;

    refs.forEach(refEl => {
      // Avoid double-enriching if this DOM element is re-processed
      if (refEl.nextElementSibling && refEl.nextElementSibling.classList.contains('bible-ref-count')) {
        return;
      }
      const key = chapterKeyFromReference(refEl.textContent.trim());
      if (!key) return;
      const count = index[key];
      if (!count) return;

      const chip = document.createElement('a');
      chip.className = 'bible-ref-count';
      // Deep-link the chip into the same chapter so it lands on the
      // sermons-for-this-passage view, not the reference-viewer home.
      const refUrl = referenceViewerUrlFor(refEl.textContent.trim());
      chip.href = refUrl || new URL('reference-viewer.html', document.baseURI).pathname;
      chip.target = '_blank';
      chip.rel = 'noopener';
      const noun = count === 1 ? 'sermon' : 'sermons';
      chip.title = `${count} ${noun} reference ${key}`;
      chip.textContent = `${count} ${noun}`;
      refEl.parentNode.insertBefore(chip, refEl.nextSibling);
    });
  }

  /**
   * Update Bible references when language changes
   */
  function updateBibleReferencesForLanguage() {
    // Get all bot messages
    const botMessages = document.querySelectorAll('.claude-message-bot:not(.claude-typing)');
    
    botMessages.forEach(message => {
      // Find all Bible references in this message
      const bibleRefs = message.querySelectorAll('.bible-reference');
      
      bibleRefs.forEach(ref => {
        // Update the click handler to use the current language
        ref.addEventListener('click', function() {
          openBibleReference(this.textContent.trim());
        });
      });
    });
  }

  /**
   * Display welcome message
   */
  function displayWelcomeMessage() {
    // Add welcome message with instructions
    const welcomeMsg = `<div class="welcome-message"></div>`;
    const messageElement = addMessage(welcomeMsg, 'bot');
    
    state.isFirstLoad = false;
  }
  /**
   * Get translated sample queries
   */
  function getTranslatedQueries() {
    return sampleQueries.map(key => translate(key));
  }

  /**
   * Adjust textarea height based on content
   */
  function adjustTextareaHeight(textarea) {
    if (!textarea) return;
    
    // Reset height to default to correctly calculate scroll height
    textarea.style.height = 'auto';
    
    // Set new height based on content, with max height
    const maxHeight = window.innerHeight * 0.3; // 30% of viewport height
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
  }

  /**
   * Toggle sources panel visibility
   */
  function toggleSourcesPanel(show, fromPopstate = false) {
    if (!elements.sourcesPanel) return;
    
    if (show === undefined) {
      // Toggle based on current state
      show = !elements.sourcesPanel.classList.contains('active');
    }
    
    if (show) {
      // Show panel
      elements.sourcesPanel.classList.add('active');
      
      // Update backdrop
      if (elements.sourcesBackdrop) {
        elements.sourcesBackdrop.style.display = 'block';
        // Trigger reflow to enable transition
        elements.sourcesBackdrop.offsetHeight;
        elements.sourcesBackdrop.style.opacity = '1';
      }
      
      // ⬇ NEW: create a dummy history entry **once** per opening
      if (!fromPopstate) {
        history.pushState({ sourcesOpen: true }, '', '#sources');   // the hash is optional
      }
    } else {
      // Hide panel
      elements.sourcesPanel.classList.remove('active');
      
      // Update backdrop
      if (elements.sourcesBackdrop) {
        elements.sourcesBackdrop.style.opacity = '0';
        setTimeout(() => {
          elements.sourcesBackdrop.style.display = 'none';
        }, config.transitionDuration);
      }
      
      // ⬇ NEW: if we're closing by any means other than Back,
      //        quietly go one step back so the dummy entry disappears
      if (!fromPopstate && history.state?.sourcesOpen) {
        history.back();          // will trigger the popstate listener above
        return;                  // prevent double‑running close logic
      }
      
      // Update any active source toggle buttons
      document.querySelectorAll('.claude-sources-toggle[data-active="true"]').forEach(toggle => {
        toggle.setAttribute('data-active', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
      });
    }
  }

  /**
 * Create a source element
 */
function createSourceElement(source, index) {
  const sourceElement = document.createElement('div');
  sourceElement.className = 'claude-source-item';
  sourceElement.setAttribute('data-video-id', source.video_id);
  
  // Add ARIA attributes for accessibility
  sourceElement.setAttribute('role', 'region');
  sourceElement.setAttribute('aria-label', 'Sermon source ' + (index + 1));
  
  const similarity = Math.round(source.similarity * 100);
  
  // Format title and date for display
  const formattedTitle = formatSermonTitle(source.title);
  let formattedDate = 'Date unknown';
  if (source.publish_date) {
    formattedDate = formatSermonDate(source.publish_date);
  }
  
  // Create source header
  const header = document.createElement('div');
  header.className = 'claude-source-header';
  
  const title = document.createElement('div');
  title.className = 'claude-source-title';
  title.textContent = formattedTitle;
  
  const date = document.createElement('div');
  date.className = 'claude-source-date';
  date.textContent = formattedDate;
  
  header.appendChild(title);
  header.appendChild(date);
  
  // Create source content
  const content = document.createElement('div');
  content.className = 'claude-source-content';
  
  // Create collapsible text container
  const textPreview = document.createElement('div');
  textPreview.className = 'claude-source-text-preview';
  
  // Get a short preview of the text (first 100 characters + ellipsis)
  const previewText = source.text.length > 100 ? 
    source.text.substring(0, 100) + '...' : 
    source.text;
  
  textPreview.innerHTML = `"${formatText(previewText)}"`;
  
  // Create "View full text" button that opens modal
  const viewFullButton = document.createElement('button');
  viewFullButton.className = 'claude-source-text-view-button';
  viewFullButton.textContent = translate('view-full-text') || 'View full text';
  viewFullButton.setAttribute('aria-haspopup', 'dialog');
  
  // Add click handler for the view full text button ONLY if in English
  if (state.currentLanguage === 'en') {
    viewFullButton.addEventListener('click', function() {
      openSourceTextOverlay(source.text, formattedTitle);
    });
  } else {
    // Disable the button for non-English languages
    viewFullButton.disabled = true;
    viewFullButton.classList.add('disabled');
    viewFullButton.style.opacity = '0.5';
    viewFullButton.style.cursor = 'not-allowed';
    // Add a title attribute for tooltip on hover
    viewFullButton.setAttribute('title', 'Coming soon in ' + 
      (state.currentLanguage === 'es' ? 'Spanish' : 
      (state.currentLanguage === 'zh' ? 'Chinese' : 'this language')));
  }
  
  const meta = document.createElement('div');
  meta.className = 'claude-source-meta';
  
  const timestamp = document.createElement('div');
  timestamp.className = 'claude-source-timestamp';
  timestamp.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg> ${formatTimestamp(source.start_time)}`;
  
  const match = document.createElement('div');
  match.className = 'claude-source-match';
  match.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle; margin-right: 5px">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg> ${similarity}% ${translate('match') || 'match'}`;
  
  meta.appendChild(timestamp);
  meta.appendChild(match);
  
  // Create actions with improved accessibility and modal support
  const actions = document.createElement('div');
  actions.className = 'claude-source-actions';
  
  // Watch video button - opens modal overlay
  const watchButton = document.createElement('button');
  watchButton.className = 'claude-source-button claude-source-button-primary';
  watchButton.textContent = translate('watch-video') || 'Watch Video';
  watchButton.setAttribute('aria-haspopup', 'dialog');
  
  watchButton.onclick = function() {
    // Watch video works in all languages
    openVideoOverlay(source.video_id, Math.floor(source.start_time), formattedTitle);
  };
  
  // Transcript button - opens modal overlay
  const transcriptButton = document.createElement('button');
  transcriptButton.className = 'claude-source-button';
  transcriptButton.textContent = translate('view-transcript') || 'View Transcript';
  transcriptButton.setAttribute('aria-haspopup', 'dialog');
  
  // Add click handler for transcript ONLY if in English
  if (state.currentLanguage === 'en') {
    transcriptButton.onclick = function() {
      openTranscriptOverlay(source.video_id, source.start_time, formattedTitle);
    };
  } else {
    // Disable the button for non-English languages
    transcriptButton.disabled = true;
    transcriptButton.classList.add('disabled');
    transcriptButton.style.opacity = '0.5';
    transcriptButton.style.cursor = 'not-allowed';
    // Add a title attribute for tooltip on hover
    transcriptButton.setAttribute('title', 'Coming soon in ' + 
      (state.currentLanguage === 'es' ? 'Spanish' : 
      (state.currentLanguage === 'zh' ? 'Chinese' : 'this language')));
  }
  
  // YouTube button - opens in new tab
  const youtubeButton = document.createElement('button');
  youtubeButton.className = 'claude-source-button';
  youtubeButton.textContent = translate('open-youtube') || 'Open YouTube';
  youtubeButton.setAttribute('aria-label', 'Open video in YouTube at ' + formatTimestamp(source.start_time));
  
  youtubeButton.onclick = function() {
    window.open(`https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}`, '_blank');
  };
  
  // Add buttons to actions
  actions.appendChild(watchButton);
  actions.appendChild(transcriptButton);
  actions.appendChild(youtubeButton);
  
  // Assemble all components
  content.appendChild(textPreview);
  content.appendChild(viewFullButton);
  content.appendChild(meta);
  content.appendChild(actions);
  
  sourceElement.appendChild(header);
  sourceElement.appendChild(content);
  
  return sourceElement;
}

  // ======= OVERLAY/MODAL FUNCTIONS =======

  /**
   * Create and manage the overlay container
   */
  function ensureOverlayContainer() {
    if (!document.getElementById('claude-overlay-container')) {
      const overlayContainer = document.createElement('div');
      overlayContainer.id = 'claude-overlay-container';
      document.body.appendChild(overlayContainer);
      return overlayContainer;
    }
    return document.getElementById('claude-overlay-container');
  }

  /**
   * Close an overlay
   */
  function closeOverlay(overlay) {
    if (!overlay) return;
    
    // Animate closing
    overlay.classList.remove('active');
    
    // Remove after animation
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      
      // Restore body scrolling
      document.body.style.overflow = '';
    }, config.transitionDuration);
  }

  /**
   * Add keyboard handling for overlays
   */
  function addOverlayKeyboardHandling(overlay) {
    if (!overlay) return;
    
    // Handle ESC key to close
    overlay.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeOverlay(overlay);
      }
    });
    
    // Close when clicking outside content
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeOverlay(overlay);
      }
    });
    
    // Focus trap within overlay for accessibility
    const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusableElements.length > 0) {
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // Focus first element
      setTimeout(() => {
        firstElement.focus();
      }, 100);
      
      // Trap focus
      overlay.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  }

  /**
   * Open source text overlay
   */
  function openSourceTextOverlay(text, title) {
    const overlayContainer = ensureOverlayContainer();
    
    // Create overlay structure
    const overlay = document.createElement('div');
    overlay.className = 'claude-overlay claude-text-overlay';
    overlay.id = 'text-overlay-' + Date.now();
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'overlay-title-text-' + Date.now());
    
    const overlayContent = document.createElement('div');
    overlayContent.className = 'claude-overlay-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'claude-overlay-header';
    
    const overlayTitle = document.createElement('h2');
    overlayTitle.className = 'claude-overlay-title';
    overlayTitle.id = 'overlay-title-text-' + Date.now();
    overlayTitle.textContent = (title || 'Sermon Text');
    
    const closeButton = document.createElement('button');
    closeButton.className = 'claude-overlay-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close overlay');
    closeButton.onclick = function() {
      closeOverlay(overlay);
    };
    
    header.appendChild(overlayTitle);
    header.appendChild(closeButton);
    
    // Create body with text
    const body = document.createElement('div');
    body.className = 'claude-overlay-body';
    
    const textContainer = document.createElement('div');
    textContainer.className = 'claude-source-text claude-text-overlay-content';
    textContainer.innerHTML = `"${formatText(text)}"`;
    
    body.appendChild(textContainer);
    
    // Assemble overlay
    overlayContent.appendChild(header);
    overlayContent.appendChild(body);
    overlay.appendChild(overlayContent);
    
    // Add to container
    overlayContainer.innerHTML = ''; // Clear any existing overlays
    overlayContainer.appendChild(overlay);
    
    // Add keyboard handling
    addOverlayKeyboardHandling(overlay);
    
    // Activate with animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Open video overlay
   */
  function openVideoOverlay(videoId, startTime, title) {
    const overlayContainer = ensureOverlayContainer();
    
    // Create overlay structure
    const overlay = document.createElement('div');
    overlay.className = 'claude-overlay claude-video-overlay';
    overlay.id = 'video-overlay-' + videoId;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'overlay-title-' + videoId);
    
    const overlayContent = document.createElement('div');
    overlayContent.className = 'claude-overlay-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'claude-overlay-header';
    
    const overlayTitle = document.createElement('h2');
    overlayTitle.className = 'claude-overlay-title';
    overlayTitle.id = 'overlay-title-' + videoId;
    overlayTitle.textContent = title || 'Sermon Video';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'claude-overlay-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close overlay');
    closeButton.onclick = function() {
      closeOverlay(overlay);
    };
    
    header.appendChild(overlayTitle);
    header.appendChild(closeButton);
    
    // Create body with video
    const body = document.createElement('div');
    body.className = 'claude-overlay-body';
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'claude-video-container';
    videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1" 
                              frameborder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowfullscreen 
                              title="Sermon video at ${formatTimestamp(startTime)}"></iframe>`;
    
    body.appendChild(videoContainer);
    
    // Assemble overlay
    overlayContent.appendChild(header);
    overlayContent.appendChild(body);
    overlay.appendChild(overlayContent);
    
    // Add to container
    overlayContainer.innerHTML = ''; // Clear any existing overlays
    overlayContainer.appendChild(overlay);
    
    // Add keyboard handling
    addOverlayKeyboardHandling(overlay);
    
    // Activate with animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
  }

  /**
   * Open transcript overlay
   */
  function openTranscriptOverlay(videoId, startTime, title) {
    const overlayContainer = ensureOverlayContainer();
    
    // Create overlay structure
    const overlay = document.createElement('div');
    overlay.className = 'claude-overlay claude-transcript-overlay';
    overlay.id = 'transcript-overlay-' + videoId;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'overlay-title-transcript-' + videoId);
    
    const overlayContent = document.createElement('div');
    overlayContent.className = 'claude-overlay-content';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'claude-overlay-header';
    
    const overlayTitle = document.createElement('h2');
    overlayTitle.className = 'claude-overlay-title';
    overlayTitle.id = 'overlay-title-transcript-' + videoId;
    overlayTitle.textContent = (title ? title + ' - ' : '') + 'Transcript';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'claude-overlay-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close overlay');
    closeButton.onclick = function() {
      closeOverlay(overlay);
    };
    
    header.appendChild(overlayTitle);
    header.appendChild(closeButton);
    
    // Create body with loading indicator
    const body = document.createElement('div');
    body.className = 'claude-overlay-body';
    body.innerHTML = `<div class="claude-transcript-loading">${translate('loading-transcript') || 'Loading transcript...'}</div>`;
    
    // Assemble overlay
    overlayContent.appendChild(header);
    overlayContent.appendChild(body);
    overlay.appendChild(overlayContent);
    
    // Add to container and show
    overlayContainer.innerHTML = ''; // Clear any existing overlays
    overlayContainer.appendChild(overlay);
    
    // Add keyboard handling
    addOverlayKeyboardHandling(overlay);
    
    // Activate with animation
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Fetch transcript data
    fetchTranscript(videoId, startTime).then(transcriptData => {
      // Create transcript display
      updateTranscriptOverlay(body, transcriptData, startTime);
    }).catch(error => {
      body.innerHTML = `<div class="claude-transcript-error">Error loading transcript: ${error.message}</div>`;
    });
  }

  /**
   * Update transcript overlay with data
   */
  function updateTranscriptOverlay(container, data, startTime) {
    if (!container || !data) return;
    
    container.innerHTML = '';
    
    // Check if transcript data is valid
    if (!data.segments && !data.transcript) {
      container.innerHTML = '<div class="claude-transcript-error">Transcript data not available</div>';
      return;
    }
    
    // If there's a note (like language unavailability), display it
    if (data.note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'claude-transcript-note';
      noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
      container.appendChild(noteElement);
    }
    
    // Create overall container with flex layout
    const transcriptContainer = document.createElement('div');
    transcriptContainer.className = 'claude-transcript-container';
    
    // Add transcript search - STICKY POSITION
    const searchContainer = document.createElement('div');
    searchContainer.className = 'claude-transcript-search-sticky';
    searchContainer.innerHTML = `
      <div class="claude-transcript-search">
        <input type="text" class="claude-transcript-search-input" placeholder="${translate('search-in-transcript') || 'Search in transcript'}..." aria-label="${translate('search-in-transcript') || 'Search in transcript'}">
        <button class="claude-transcript-search-button" aria-label="${translate('search') || 'Search'}">${translate('search') || 'Search'}</button>
      </div>
    `;
    
    // Create transcript content area
    const transcriptElement = document.createElement('div');
    transcriptElement.className = 'claude-transcript';
    
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'claude-transcript-content';
    
    const videoId = container.closest('.claude-overlay')?.id?.replace('transcript-overlay-', '') || '';
    
    // Process segmented transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      let highlightedSegmentId = null;
      
      data.segments.forEach((segment, index) => {
        // Skip gap segments
        if (segment.is_gap) {
          const gapElement = document.createElement('div');
          gapElement.className = 'claude-transcript-gap';
          gapElement.innerHTML = '[...]';
          transcriptContent.appendChild(gapElement);
          return;
        }
        
        const segmentElement = document.createElement('div');
        segmentElement.className = 'claude-transcript-segment';
        segmentElement.id = `overlay-transcript-segment-${index}`;
        segmentElement.setAttribute('data-time', segment.start_time);
        
        // Highlight segments close to the start time
        if (Math.abs(segment.start_time - startTime) < 10) {
          segmentElement.classList.add('claude-transcript-highlight');
          highlightedSegmentId = segmentElement.id;
        }
        
        // Make timestamps clickable and linked to video
        const timestampElement = document.createElement('div');
        timestampElement.className = 'claude-transcript-timestamp';
        timestampElement.textContent = formatTimestamp(segment.start_time);
        timestampElement.setAttribute('role', 'button');
        timestampElement.setAttribute('tabindex', '0');
        timestampElement.setAttribute('aria-label', `Jump to ${formatTimestamp(segment.start_time)}`);
        timestampElement.setAttribute('data-time', segment.start_time);
        timestampElement.setAttribute('data-video-id', videoId);
        
        // Add click handler for timestamp - opens or updates video at timestamp
        timestampElement.addEventListener('click', function() {
          const time = this.getAttribute('data-time');
          const videoId = this.getAttribute('data-video-id');
          if (videoId && time) {
            // Check if video overlay already exists
            const existingVideoOverlay = document.querySelector('.claude-video-overlay.active');
            if (existingVideoOverlay) {
              // Update existing video iframe with new timestamp
              const iframe = existingVideoOverlay.querySelector('iframe');
              if (iframe) {
                iframe.src = `https://www.youtube.com/embed/${videoId}?start=${Math.floor(time)}&autoplay=1`;
              }
            } else {
              // Open new video overlay
              openVideoOverlay(videoId, Math.floor(time), '');
            }
          }
        });
        
        // Add keyboard handler
        timestampElement.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
          }
        });
        
        const textElement = document.createElement('div');
        textElement.className = 'claude-transcript-text';
        textElement.textContent = segment.text;
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        transcriptContent.appendChild(segmentElement);
      });
      
      // Add content to transcript element
      transcriptElement.appendChild(transcriptContent);
      
      // Add search and transcript to container
      transcriptContainer.appendChild(searchContainer);
      transcriptContainer.appendChild(transcriptElement);
      container.appendChild(transcriptContainer);
      
      // Set up search functionality
      const searchInput = searchContainer.querySelector('.claude-transcript-search-input');
      const searchButton = searchContainer.querySelector('.claude-transcript-search-button');
      
      // Add event listeners for search
      if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
          searchInTranscript(searchInput.value, transcriptContent);
        });
        
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            searchInTranscript(searchInput.value, transcriptContent);
          }
        });
      }
      
      // Scroll to highlighted segment
      if (highlightedSegmentId) {
        setTimeout(() => {
          const highlightedElement = document.getElementById(highlightedSegmentId);
          if (highlightedElement) {
            highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    } 
    else if (data.transcript) {
      // Handle plain text transcript
      const textContainer = document.createElement('div');
      textContainer.className = 'claude-transcript-content claude-transcript-plain-text';
      textContainer.innerHTML = data.transcript
        .split('\n\n')
        .map(para => `<p>${para}</p>`)
        .join('');
      
      transcriptElement.appendChild(textContainer);
      transcriptContainer.appendChild(searchContainer);
      transcriptContainer.appendChild(transcriptElement);
      container.appendChild(transcriptContainer);
      
      // Set up search functionality
      const searchInput = searchContainer.querySelector('.claude-transcript-search-input');
      const searchButton = searchContainer.querySelector('.claude-transcript-search-button');
      
      // Add event listeners for search
      if (searchInput && searchButton) {
        searchButton.addEventListener('click', function() {
          searchInTranscript(searchInput.value, textContainer);
        });
        
        searchInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            searchInTranscript(searchInput.value, textContainer);
          }
        });
      }
    } 
    else {
      container.innerHTML = '<div class="claude-transcript-error">Transcript format unknown</div>';
    }
    
    // Add download transcript button
    const downloadButton = document.createElement('button');
    downloadButton.className = 'claude-transcript-download';
    downloadButton.textContent = translate('download-transcript') || 'Download Transcript';
    downloadButton.setAttribute('aria-label', translate('download-transcript') || 'Download Transcript');
    
    downloadButton.addEventListener('click', function() {
      downloadTranscript(data, videoId);
    });
    
    container.appendChild(downloadButton);
  }

  /**
   * Search within transcript
   */
  function searchInTranscript(query, container) {
    if (!query || !container) return;
    
    // Remove existing highlights and match counts
    const existingHighlights = container.querySelectorAll('.search-highlight');
    existingHighlights.forEach(highlight => {
      const textNode = document.createTextNode(highlight.textContent);
      highlight.parentNode.replaceChild(textNode, highlight);
    });
    
    const existingCount = container.querySelector('.claude-transcript-match-count');
    if (existingCount) {
      existingCount.remove();
    }
    
    if (!query.trim()) return;
    
    // Create a case-insensitive regex
    try {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\    container.appendChild(downloadButton);'), 'gi');
      const segments = container.querySelectorAll('.claude-transcript-segment');
      let matchCount = 0;
      let firstMatchElement = null;
      
      segments.forEach(segment => {
        const textElement = segment.querySelector('.claude-transcript-text');
        if (!textElement) return;
        
        const originalText = textElement.textContent;
        let match;
        let lastIndex = 0;
        let hasMatches = false;
        let newHtml = '';
        
        while ((match = regex.exec(originalText)) !== null) {
          hasMatches = true;
          matchCount++;
          
          if (!firstMatchElement) {
            firstMatchElement = segment;
          }
          
          // Add text before match
          newHtml += originalText.substring(lastIndex, match.index);
          
          // Add highlighted match
          newHtml += `<span class="search-highlight" style="background-color: #ffeb3b; font-weight: bold;">${match[0]}</span>`;
          
          // Update lastIndex
          lastIndex = regex.lastIndex;
        }
        
        // Add remaining text
        if (lastIndex < originalText.length) {
          newHtml += originalText.substring(lastIndex);
        }
        
        // Update text element if matches found
        if (hasMatches) {
          textElement.innerHTML = newHtml;
        }
      });
      
      // Add match count
      const matchCountElement = document.createElement('div');
      matchCountElement.className = 'claude-transcript-match-count';
      matchCountElement.style.padding = '8px 16px';
      matchCountElement.style.backgroundColor = '#f0f0f0';
      matchCountElement.style.borderRadius = '4px';
      matchCountElement.style.margin = '0 0 16px 0';
      matchCountElement.style.fontWeight = '500';
      
      matchCountElement.textContent = matchCount > 0 
        ? `${matchCount} ${translate('matches-found') || 'matches found'}`
        : `${translate('no-matches-found') || 'No matches found'}`;
      
      // Insert count at top
      container.insertBefore(matchCountElement, container.firstChild);
      
      // Scroll to first match
      if (firstMatchElement) {
        firstMatchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error in search:', error);
    }
  }

  /**
   * Download transcript as text file
   */
  function downloadTranscript(data, videoId) {
    if (!data) return;
    
    let content = '';
    let filename = 'sermon-transcript.txt';
    
    // Try to get sermon title from the page
    const sourceItem = document.querySelector(`.claude-source-item[data-video-id="${videoId}"]`);
    if (sourceItem) {
      const titleElement = sourceItem.querySelector('.claude-source-title');
      if (titleElement && titleElement.textContent) {
        filename = titleElement.textContent.trim().replace(/[^\w\s-]/g, '') + '-transcript.txt';
      }
      
      if (videoId) {
        content += `Sermon ID: ${videoId}\n\n`;
      }
    }
    
    // Add date if available
    const dateElement = document.querySelector('.claude-source-date');
    if (dateElement && dateElement.textContent) {
      content += `Date: ${dateElement.textContent.trim()}\n\n`;
    }
    
    // Format transcript content
    if (data.segments && Array.isArray(data.segments)) {
      content += 'TRANSCRIPT:\n\n';
      
      data.segments.forEach(segment => {
        if (segment.is_gap) {
          content += '[...]\n\n';
        } else {
          content += `[${formatTimestamp(segment.start_time)}] ${segment.text}\n\n`;
        }
      });
    } else if (data.transcript) {
      content += data.transcript;
    } else {
      content += 'No transcript data available.';
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // ======= API FUNCTIONS =======

  /**
   * Verify API connection
   */
  async function verifyApiConnection(showFeedback = false) {
    // Use the SermonAPI module's verifyConnection method
    const isConnected = await SermonAPI.verifyConnection(showFeedback);
    state.isApiConnected = isConnected;
    return isConnected;
  }

  /**
   * Fetch transcript
   */
  async function fetchTranscript(videoId, startTime = 0) {
    // Use the SermonAPI module's fetchTranscript method
    return await SermonAPI.fetchTranscript(videoId, startTime, state.currentLanguage);
  }

  // ======= EVENT HANDLERS =======

  /**
   * Handle form submission
   */
  async function handleSubmit(event) {
    if (event) event.preventDefault();

    const query = elements.queryInput.value.trim();
    if (!query) {
      return;
    }
    
    // Add user message to the chat
    addMessage(query, 'user');
    
    // Add to conversation history
    state.conversationHistory.push({ role: 'user', content: query });
    
    // Limit history length
    if (state.conversationHistory.length > config.maxMemoryLength * 2) {
      state.conversationHistory = state.conversationHistory.slice(-config.maxMemoryLength * 2);
    }
    
    // Clear input field and reset height
    elements.queryInput.value = '';
    adjustTextareaHeight(elements.queryInput);
    
    // Increment pending requests counter
    state.pendingRequests++;

    // Prepare request data
    // top_k=8 (vs the backend default of 5) lets the source display adapt
    // to relevance: the backend filters out matches below similarity 0.5,
    // so narrow topics naturally show 2-3 strong matches while broad
    // topics show 6-8. No UI control needed — the count varies on its own.
    const requestData = {
      query: query,
      conversation_history: state.conversationHistory.slice(-config.maxMemoryLength * 2),
      language: state.currentLanguage,
      top_k: 8,
    };

    // Streaming is English-only on the backend (translation needs full buffer).
    // For non-English, fall straight through to the non-streaming path below.
    const useStreaming = state.currentLanguage === 'en';

    // Tracked across the try/catch so the cap-hit handler can replace the
    // streaming placeholder bubble (if one was created) in place rather than
    // leaving a dangling "Reviewing sermons…" indicator.
    let streamingBotEl = null;

    try {
      // === Find sermons mode (no AI synthesis) ===
      if (state.currentMode === 'find') {
        const typingId = addTypingIndicator();
        const searchData = await SermonAPI.searchSermons(query, { top_k: 15, min_score: 0.55 });
        removeMessage(typingId);
        displaySearchResults(searchData, query);

        // Persist (tagged with mode='find' so restore knows which renderer to use)
        state.persistedTurns.push({ user: query, mode: 'find', data: searchData });
        saveChatTurns(state.persistedTurns);
        smoothScrollToBottom(elements.messagesContainer);

      } else if (useStreaming) {
        // === Streaming path ===
        // Create the bot bubble empty, then fill it as tokens arrive.
        // No typing indicator — the streaming text itself is the indicator.
        const placeholder = '<div class="streaming-placeholder"><span>Reviewing sermons</span><span class="streaming-dots">…</span></div>';
        const botMessageEl = addMessage(placeholder, 'bot');
        streamingBotEl = botMessageEl;
        const contentEl = botMessageEl.querySelector('.claude-message-content');

        let accumulatedText = '';
        let sourcesData = [];
        let suggestedQueries = [];
        let firstTokenReceived = false;
        let renderTimer = null;

        // Debounced markdown re-render: avoids flicker on every token by
        // batching renders to ~10/sec. The Bible-reference chip enrichment
        // is deferred to the final render in onDone.
        const scheduleRender = () => {
          if (renderTimer) return;
          renderTimer = setTimeout(() => {
            contentEl.innerHTML = formatResponse(accumulatedText);
            renderTimer = null;
            smoothScrollToBottom(elements.messagesContainer);
          }, 100);
        };

        await SermonAPI.sendQueryStream(requestData, {
          onSources: (data) => {
            sourcesData = data.sources || [];
          },
          onToken: (text) => {
            if (!firstTokenReceived) {
              contentEl.innerHTML = '';  // clear placeholder once content starts
              firstTokenReceived = true;
            }
            accumulatedText += text;
            scheduleRender();
          },
          onDone: (data) => {
            // Cancel any pending debounced render — we're about to do the final one
            if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }

            // Final pass: full markdown render + Bible-reference enrichment
            contentEl.innerHTML = formatResponse(accumulatedText);
            setupBibleReferenceClicks(contentEl);

            suggestedQueries = data.suggested_queries || [];

            // Add sources panel + toggle button (mirrors displayAnswer's logic).
            // Also suppress sources when the backend's OFF-TOPIC POLICY fires:
            // weak Pinecone matches above the 0.6 floor can still slip through
            // for tangential queries, and showing them next to a refusal reads
            // as "here's the answer hidden in these sermons" — exactly the
            // wrong signal.
            const isNoResults = accumulatedText.includes(translate('no-results')) ||
                                accumulatedText.includes("I couldn't find sermon content") ||
                                accumulatedText.includes('this tool can answer questions about what was preached') ||
                                accumulatedText.includes('outside the scope of what I can help');
            if (sourcesData.length > 0 && !isNoResults) {
              populateSourcesPanelAndAddToggle(contentEl, sourcesData);
            }

            // Print this answer button (works regardless of whether there are sources)
            addPrintButton(botMessageEl);

            // Push to conversation history + persist for reload
            state.conversationHistory.push({ role: 'assistant', content: accumulatedText });

            const persistedTurn = {
              user: query,
              data: {
                query: requestData.query,
                answer: accumulatedText,
                sources: sourcesData,
                suggested_queries: suggestedQueries,
                processing_time: data.processing_time,
              },
            };
            state.persistedTurns.push(persistedTurn);
            saveChatTurns(state.persistedTurns);

            smoothScrollToBottom(elements.messagesContainer);
          },
          onError: (msg) => {
            contentEl.innerHTML = `<div class="error-container"><p>Error: ${msg}</p></div>`;
          },
        });
      } else {
        // === Non-streaming path (used for Spanish/Chinese — translation needs full buffer) ===
        const typingId = addTypingIndicator();
        const data = await SermonAPI.sendQuery(requestData);
        removeMessage(typingId);
        displayAnswer(data);
        state.persistedTurns.push({ user: query, data });
        saveChatTurns(state.persistedTurns);
      }

    } catch (error) {
      console.error('Error in API request:', error);

      // Clean up any leftover typing indicator from the non-streaming path
      document.querySelectorAll('.claude-typing').forEach((el) => removeMessage(el.id));

      // === Cap-hit branch ===
      // 429 with byok_supported: the user can keep going with their own
      // OpenRouter key. Replace the streaming placeholder (if any) with a
      // cap-hit message that opens the BYOK modal on click.
      if (error instanceof CapHitError) {
        renderCapHitMessage(query, error.detail, streamingBotEl);
      } else {
        // Generic error path (network failure, unexpected 5xx, etc.)
        const errorMsg = `
          <div class="error-container">
            <p>Sorry, an error occurred: ${error.message}</p>
            <button class="retry-button">${translate('try-again')}</button>
          </div>
        `;
        const errorElement = addMessage(errorMsg, 'bot', true);

        const retryButton = errorElement.querySelector('.retry-button');
        if (retryButton) {
          retryButton.addEventListener('click', function () {
            removeMessage(errorElement.id);
            elements.queryInput.value = query;
            elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
          });
        }
      }
    } finally {
      // Decrement pending requests counter
      state.pendingRequests--;
      
      // Re-enable input field
      if (elements.queryInput) {
        elements.queryInput.disabled = false;
        elements.queryInput.focus();
      }
    }
  }

  /**
 * Display answer from API
 */
/**
 * Display answer from API
 */
/**
 * Add a small "Print this answer" button to a bot message bubble.
 * Clicking marks the message + preceding user-question as print targets,
 * then triggers window.print(). Print stylesheet hides everything else.
 * Users can "Save as PDF" from the browser's print dialog.
 */
function addPrintButton(messageElement) {
  if (!messageElement || messageElement.querySelector('.message-print-button')) return;
  const contentEl = messageElement.querySelector('.claude-message-content');
  if (!contentEl) return;

  const btn = document.createElement('button');
  btn.className = 'message-print-button';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Print this answer');
  btn.title = 'Print this answer (or save as PDF)';
  btn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
    <span>Print</span>
  `;
  btn.addEventListener('click', () => printMessagePair(messageElement));
  contentEl.appendChild(btn);
}

function printMessagePair(botMessageEl) {
  // Walk back to find the user message that prompted this answer
  let userMsg = botMessageEl.previousElementSibling;
  while (userMsg && !userMsg.classList.contains('claude-message-user')) {
    userMsg = userMsg.previousElementSibling;
  }
  const questionText = userMsg
    ? (userMsg.querySelector('.claude-message-content')?.textContent || '').trim()
    : '';

  const answerContent = botMessageEl.querySelector('.claude-message-content');
  if (!answerContent) return;

  // Clone the answer DOM so we can strip interactive-only elements
  // without touching the live page
  const answerClone = answerContent.cloneNode(true);
  answerClone.querySelectorAll(
    '.message-print-button, .claude-sources-toggle, .bible-ref-count'
  ).forEach((el) => el.remove());

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);

  // Open a fresh window with a minimal stylesheet — no interference from
  // the chat page's complex CSS, which is what was clipping the previous
  // print attempt. The new window is a standalone printable document.
  const win = window.open('', '_blank', 'width=820,height=900');
  if (!win) {
    alert('Please allow pop-ups for this site to print the answer.');
    return;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fellowship Digital Ministry — Sermon search answer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    :root { --burgundy: #641c14; --text: #222; --muted: #666; }
    @page { margin: 1.5cm 2cm; }
    html, body { margin: 0; padding: 0; background: white; color: var(--text); }
    body {
      font-family: 'PT Serif', Georgia, 'Times New Roman', serif;
      font-size: 11pt; line-height: 1.55;
      padding: 2cm; max-width: 21cm;
    }
    .page-header {
      border-bottom: 1px solid #999;
      padding-bottom: 8pt; margin-bottom: 14pt;
    }
    .page-title { font-size: 13pt; font-weight: 700; color: var(--burgundy); margin: 0; }
    .page-sub { font-size: 9pt; color: var(--muted); margin-top: 2pt; }
    .question {
      font-weight: 700; font-size: 12pt;
      color: var(--burgundy);
      margin: 0 0 12pt;
    }
    .question::before { content: 'Question: '; }
    h1, h2, h3, h4 { color: var(--burgundy); page-break-after: avoid; line-height: 1.3; }
    h1 { font-size: 14pt; margin: 14pt 0 6pt; }
    h2 { font-size: 12pt; margin: 12pt 0 4pt; font-weight: 700; }
    h3 { font-size: 11pt; margin: 10pt 0 3pt; }
    p { margin: 0 0 7pt; }
    ul, ol { margin: 0 0 7pt; padding-left: 1.5em; }
    li { margin-bottom: 3pt; }
    strong { color: var(--burgundy); }
    em, i { font-style: italic; }
    blockquote {
      border-left: 3px solid var(--burgundy);
      padding-left: 10pt; margin: 8pt 0;
      font-style: italic; color: var(--muted);
      page-break-inside: avoid;
    }
    code {
      font-family: ui-monospace, Menlo, Consolas, monospace;
      font-size: 0.9em;
      background: #f4f0ea;
      padding: 0.1em 0.3em; border-radius: 3px;
    }
    .footer {
      margin-top: 18pt; padding-top: 8pt;
      border-top: 1px solid #ccc;
      font-size: 9pt; color: var(--muted);
    }
    .print-controls {
      position: fixed; top: 12px; right: 12px;
      background: white; padding: 6px 10px;
      border: 1px solid #ddd; border-radius: 4px;
      font-family: system-ui, sans-serif; font-size: 13px;
    }
    .print-controls button {
      background: var(--burgundy); color: white;
      border: none; padding: 4px 10px; border-radius: 3px;
      cursor: pointer; font-size: 13px;
    }
    @media print {
      body { padding: 0; }
      .print-controls { display: none; }
    }
  </style>
</head>
<body>
  <div class="print-controls" aria-hidden="true">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="page-header">
    <div class="page-title">Fellowship Digital Ministry</div>
    <div class="page-sub">Sermon search answer — ${escape(dateStr)}</div>
  </div>
  ${questionText ? `<div class="question">${escape(questionText)}</div>` : ''}
  <div class="answer">${answerClone.innerHTML}</div>
  <div class="footer">From the Fellowship Digital Ministry sermon search (unofficial study tool). Source sermons are publicly available on the church's YouTube channel.</div>
</body>
</html>`);
  win.document.close();

  // Give the new document a moment to render + fonts to load before
  // triggering the print dialog. The user can also click the Print
  // button if auto-print doesn't fire (some browsers block it).
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (_) {
      // Fallback: the in-window Print button is always available
    }
  }, 400);
}

/**
 * Populate the right-side sources panel with this answer's sources and
 * append a "Show sources" toggle button to the message bubble.
 *
 * Shared between displayAnswer (non-streaming + restore-from-storage path)
 * and the streaming flow (handleSubmit). Don't change one without the
 * other unless you're intentionally changing the source-card behavior.
 */
function populateSourcesPanelAndAddToggle(messageContent, sources) {
  if (!sources || !sources.length || !elements.sourcesPanelContent) return;
  try {
    elements.sourcesPanelContent.innerHTML = '';

    const sourcesTitle = document.createElement('h3');
    sourcesTitle.textContent = translate('sources-found') + ' (' + sources.length + ')';
    elements.sourcesPanelContent.appendChild(sourcesTitle);

    const sortedSources = [...sources].sort((a, b) => b.similarity - a.similarity);
    sortedSources.forEach((source, index) => {
      const sourceElement = createSourceElement(source, index);
      elements.sourcesPanelContent.appendChild(sourceElement);
      sourceElement.style.animationDelay = `${index * 50}ms`;
      sourceElement.classList.add('animating-in');
      setTimeout(() => {
        sourceElement.classList.remove('animating-in');
        sourceElement.style.animationDelay = '';
      }, 500 + (index * 50));
    });

    const sourcesToggle = document.createElement('button');
    sourcesToggle.className = 'claude-sources-toggle';
    sourcesToggle.innerHTML = '<span class="claude-sources-toggle-icon">⬆</span> ' + translate('show-sources');
    sourcesToggle.setAttribute('data-active', 'false');
    sourcesToggle.setAttribute('aria-expanded', 'false');
    sourcesToggle.setAttribute('aria-controls', 'sourcesPanel');

    sourcesToggle.addEventListener('click', function () {
      toggleSourcesPanel(true);
      this.setAttribute('data-active', 'true');
      this.setAttribute('aria-expanded', 'true');
    });

    messageContent.appendChild(sourcesToggle);
  } catch (error) {
    console.error('Error displaying sources:', error);
  }
}

/**
 * Render a "Find sermons" result list as a bot bubble — no AI synthesis,
 * just the matching sermons as cards. Reuses createSourceElement so the
 * cards look identical to the source cards shown alongside chat answers.
 */
function displaySearchResults(data, query) {
  const results = (data && data.results) || [];
  const messageElement = addMessage('', 'bot');
  messageElement.classList.add('claude-find-results');
  const contentEl = messageElement.querySelector('.claude-message-content');

  if (results.length === 0) {
    contentEl.innerHTML = `
      <div class="find-results-empty">
        <p>No sermons matched <strong>${escapeHTML(query)}</strong> closely enough.</p>
        <p class="find-results-empty-hint">Try a broader topic (e.g., "prayer" instead of "intercessory prayer for missionaries") or switch to <em>Ask a question</em> mode for AI-assisted synthesis.</p>
      </div>
    `;
    return messageElement;
  }

  const header = document.createElement('div');
  header.className = 'find-results-header';
  header.innerHTML = `<span class="find-results-count">${results.length}</span> sermon${results.length === 1 ? '' : 's'} matching <strong>${escapeHTML(query)}</strong>`;
  contentEl.appendChild(header);

  const list = document.createElement('div');
  list.className = 'find-results-list';
  results.forEach((source, index) => {
    const card = createSourceElement(source, index);
    list.appendChild(card);
  });
  contentEl.appendChild(list);

  addPrintButton(messageElement);
  return messageElement;
}

function escapeHTML(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function displayAnswer(data) {
  if (!data || !data.answer) {
    console.error('Invalid data received from API');
    addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
    return;
  }
  
  // Check if there are any sermon sources - STRICT CHECK
  const hasSermonContent = data.sources && Array.isArray(data.sources) && data.sources.length > 0;
  
  // Detect a "no results" or off-topic refusal response by checking for
  // specific phrases. Off-topic phrasing is sourced from the backend's
  // OFF-TOPIC POLICY block so suppressing the sources panel stays in sync
  // with the model's refusal language.
  const isNoResultsResponse = data.answer.includes(translate('no-results')) ||
                             data.answer.includes("I couldn't find sermon content") ||
                             data.answer.includes('this tool can answer questions about what was preached') ||
                             data.answer.includes('outside the scope of what I can help');
  
  // If no sermon content but we have conversation history, use the fallback logic
  if (!hasSermonContent && isNoResultsResponse && state.conversationHistory.length > 0) {
    // Generate a conversational response instead
    const conversationalResponse = handleConversationFallback(
      data.query, 
      state.conversationHistory
    );
    
    // Display the conversational response
    const messageElement = addMessage(conversationalResponse, 'bot');
    messageElement.classList.add('conversation-mode');
    
    // Add to conversation history
    state.conversationHistory.push({ 
      role: 'assistant', 
      content: conversationalResponse 
    });
    
    return;
  }
  
  // Regular processing for a response
  const messageElement = addMessage(data.answer, 'bot');
  
  // ONLY display sources button if there are ACTUAL sermon sources AND NOT a "no results" response
  if (hasSermonContent && !isNoResultsResponse) {
    const messageContent = messageElement.querySelector('.claude-message-content');
    populateSourcesPanelAndAddToggle(messageContent, data.sources);
  }

  // Print button works for every answer, sources or not
  addPrintButton(messageElement);

  // Add to conversation history
  state.conversationHistory.push({ role: 'assistant', content: data.answer });
  
  // Add ripple effect to new message for attention
  addMessageRippleEffect(messageElement);
}

  /**
   * Change the interface language
   */
/**
 * Change the interface language
 */
function changeLanguage(language) {
  if (!translations[language]) {
    console.error(`Translations for language "${language}" not found`);
    return;
  }
  
  state.currentLanguage = language;
  console.log(`Language changed to ${language}`);
  
  // Update direction for RTL languages (if needed in the future)
  document.documentElement.classList.remove('rtl');
  if (language === 'ar' || language === 'he') {
    document.documentElement.classList.add('rtl');
  }
  
  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[language][key]) {
      element.textContent = translations[language][key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[language][key]) {
      element.placeholder = translations[language][key];
    }
  });
  
  // Set static placeholder for query input
  if (elements.queryInput) {
    elements.queryInput.placeholder = translate('what-does-pastor-teach');
  }
  
  // Update welcome message if it exists
  if (state.isFirstLoad) {
    displayWelcomeMessage();
  } else {
    // Try to update existing welcome content without clearing conversation
    const welcomeTitle = document.querySelector('.claude-welcome h4');
    const welcomeIntro = document.querySelector('.claude-welcome p:first-of-type');
    const suggestionHeading = document.querySelector('.claude-suggestion-label');
    
    if (welcomeTitle) welcomeTitle.textContent = translate('welcome-title');
    if (welcomeIntro) welcomeIntro.textContent = translate('welcome-intro');
    if (suggestionHeading) suggestionHeading.textContent = translate('suggestion-heading');
    
    // Update suggestion chips with translated text
    updateSuggestions();
  }
  
  // Update any Bible references in existing messages
  updateBibleReferencesForLanguage();
  
  // Update any example question buttons in the UI
  setupExampleQuestionClicks();
}

  /**
   * Clear the conversation history
   */
  function clearConversation() {
    // Clear the conversation history array
    state.conversationHistory = [];

    // Wipe the persisted-turns array AND the localStorage backing it,
    // so a reload after Clear truly starts fresh.
    state.persistedTurns = [];
    clearChatTurnsStorage();

    // Show clearing animation
    const messages = document.querySelectorAll('.claude-message');
    
    // Animate out all messages sequentially
    messages.forEach((message, index) => {
      setTimeout(() => {
        message.classList.add('animating-out');
      }, index * 50);
    });
    
    // Clear messages after animation completes
    setTimeout(() => {
      // Clear the messages container
      if (elements.messagesContainer) {
        elements.messagesContainer.innerHTML = '';
        
        // Display welcome message again
        displayWelcomeMessage();
        
        // Focus the input field
        if (elements.queryInput) {
          elements.queryInput.focus();
        }
      }
    }, (messages.length * 50) + 300);
  }

  // ======= CONVERSATION FALLBACK FUNCTIONS =======

  /**
   * Main handler for conversation mode
   * Call this when the API returns no sermon content
   */
  function handleConversationFallback(query, conversationHistory) {
    // Extract topics from the current query
    const queryTopics = extractTopics(query, SERMON_TOPICS);
    
    // Extract topics from previous responses that had sermon content
    const previousSermonTopics = extractPreviousSermonTopics(conversationHistory);
    
    // Analyze conversation to determine the best fallback strategy
    const fallbackStrategy = determineFallbackStrategy(query, conversationHistory, queryTopics, previousSermonTopics);
    
    // Generate the appropriate fallback response
    return generateFallbackResponse(query, conversationHistory, fallbackStrategy, queryTopics, previousSermonTopics);
  }

  /**
   * Extract topics from the query text
   */
  function extractTopics(text, topicList) {
    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    // Check for explicit topic mentions
    topicList.forEach(topic => {
      if (lowerText.includes(topic.toLowerCase())) {
        foundTopics.push(topic);
      }
    });
    
    // Check for related words/synonyms
    const topicSynonyms = {
      "prayer": ["praying", "pray", "intercession", "supplication"],
      "faith": ["belief", "trust", "believing", "faithful"],
      "forgiveness": ["forgiving", "forgive", "pardon", "mercy"],
      "relationships": ["marriage", "family", "parenting", "friendship"]
      // Add more synonyms as needed
    };
    
    // Check for synonyms
    Object.entries(topicSynonyms).forEach(([topic, synonyms]) => {
      if (!foundTopics.includes(topic)) {
        for (const synonym of synonyms) {
          if (lowerText.includes(synonym.toLowerCase())) {
            foundTopics.push(topic);
            break;
          }
        }
      }
    });
    
    return foundTopics;
  }

  /**
   * Extract topics from previous sermon content
   */
  function extractPreviousSermonTopics(conversationHistory) {
    const topics = [];
    
    // Look through past assistant responses for sermon content
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      
      // Only process assistant messages
      if (message.role === 'assistant') {
        // Skip messages that indicate no sermon content was found
        if (message.content.includes("No relevant sermon content found")) {
          continue;
        }
        
        // Extract topics from the message content
        SERMON_TOPICS.forEach(topic => {
          if (message.content.toLowerCase().includes(topic.toLowerCase()) && !topics.includes(topic)) {
            topics.push(topic);
          }
        });
      }
    }
    
    return topics;
  }

  /**
   * Determine the appropriate fallback strategy
   */
  function determineFallbackStrategy(query, conversationHistory, queryTopics, previousSermonTopics) {
    // Default strategy
    let strategy = "suggest_related";
    
    // Check if this is a clarification question about previous content
    if (isClarificationQuestion(query, conversationHistory)) {
      strategy = "clarify_previous";
    }
    // Check if this is a follow-up question to previous content
    else if (isFollowUpQuestion(query, conversationHistory)) {
      strategy = "follow_up";
    }
    // Check if we should suggest related topics
    else if (queryTopics.length > 0) {
      strategy = "suggest_related";
    }
    // If completely new topic with no relation to previous, suggest search refinement
    else {
      strategy = "refine_search";
    }
    
    return strategy;
  }

  /**
   * Check if the query is asking for clarification about previous content
   */
  function isClarificationQuestion(query, conversationHistory) {
    const clarificationPatterns = {
      en: [
        "what do you mean", "can you explain", "what does that mean",
        "could you clarify", "i don't understand", "please explain"
      ],
      es: [
        "qué quieres decir", "puedes explicar", "qué significa eso",
        "podrías aclarar", "no entiendo", "por favor explica"
      ],
      zh: [
        "你是什么意思", "你能解释", "这是什么意思",
        "能否澄清", "我不明白", "请解释"
      ]
    };
    
    const referencePatterns = {
      en: ["you said", "you mentioned", "that sermon", "the pastor said"],
      es: ["dijiste", "mencionaste", "ese sermón", "el pastor dijo"],
      zh: ["你说", "你提到", "那个讲道", "牧师说"]
    };
    
    const patterns = clarificationPatterns[state.currentLanguage] || clarificationPatterns.en;
    const refPatterns = referencePatterns[state.currentLanguage] || referencePatterns.en;
    
    const lowerQuery = query.toLowerCase();
    
    // Check for clarification phrases
    for (const pattern of patterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    // Check if question refers to previous content
    for (const pattern of refPatterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if the query is a follow-up to previous content
   */
  function isFollowUpQuestion(query, conversationHistory) {
    if (conversationHistory.length < 2) return false;
    
    const followUpPatterns = {
      en: [
        "more about", "tell me more", "elaborate", "and what about",
        "what else", "in addition", "furthermore", "also"
      ],
      es: [
        "más sobre", "dime más", "elabora", "y qué hay de",
        "qué más", "además", "también", "asimismo"
      ],
      zh: [
        "更多关于", "告诉我更多", "详细说明", "那么关于",
        "还有什么", "此外", "而且", "也"
      ]
    };
    
    const patterns = followUpPatterns[state.currentLanguage] || followUpPatterns.en;
    const lowerQuery = query.toLowerCase();
    
    // Check for follow-up indicators
    for (const pattern of patterns) {
      if (lowerQuery.includes(pattern)) {
        return true;
      }
    }
    
    // Check if it's related to the last topic discussed
    const lastResponse = findLastSermonResponse(conversationHistory);
    if (lastResponse) {
      const lastResponseTopics = extractTopics(lastResponse, SERMON_TOPICS);
      const queryTopics = extractTopics(query, SERMON_TOPICS);
      
      // If there's topic overlap, it's likely a follow-up
      for (const topic of queryTopics) {
        if (lastResponseTopics.includes(topic)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Find the last response that contained sermon content
   */
  function findLastSermonResponse(conversationHistory) {
    for (let i = conversationHistory.length - 1; i >= 0; i--) {
      const message = conversationHistory[i];
      if (message.role === 'assistant' && !message.content.includes("No relevant sermon content found")) {
        return message.content;
      }
    }
    return null;
  }

  /**
   * Generate a conversational fallback response based on the determined strategy
   */
  function generateFallbackResponse(query, conversationHistory, fallbackStrategy, queryTopics, previousSermonTopics) {
    // First check if we have a language-specific message
    // For Spanish
    if (state.currentLanguage === 'es') {
      const spanishFallbacks = {
        clarify_previous: `No tengo contenido específico de sermones que responda a tu pregunta sobre ese tema. 

A partir del contenido del sermón que discutimos anteriormente, el pastor se centró más en la aplicación práctica que en explicaciones detalladas. ¿Te gustaría que sugiriera un aspecto diferente de este tema que podría estar cubierto en los sermones? ¿O quizás podrías reformular tu pregunta para centrarte en un pasaje bíblico específico o una aplicación práctica?`,

        follow_up: `No pude encontrar contenido de sermones que aborde específicamente ese aspecto en relación con tu pregunta de seguimiento. 

El pastor puede haber cubierto esto en otros sermones que no están en nuestra base de datos actual. ¿Te gustaría que te ayudara a explorar un tema relacionado que sí está cubierto en los sermones? Por ejemplo, podría buscar contenido de sermones sobre los fundamentos bíblicos o aplicaciones prácticas relacionadas con este tema.`,

        suggest_related: `No pude encontrar contenido de sermones que responda directamente a tu pregunta. 

Es posible que el pastor haya discutido esto en otros sermones o desde una perspectiva diferente a como formulaste tu pregunta. Podrías intentar buscar:
- Términos bíblicos más específicos
- Mencionar un pasaje de la Biblia que te interese
- Preguntar sobre la aplicación práctica de un principio espiritual

¿Te gustaría que te ayudara a reformular tu pregunta?`,

        refine_search: `No pude encontrar contenido de sermones que responda directamente a tu pregunta. El pastor puede haber abordado este tema usando una terminología diferente o desde un ángulo distinto.

Para ayudarme a encontrar contenido de sermones relevante, podrías:
- Intentar usar términos bíblicos más específicos
- Mencionar un pasaje de la Biblia que te interese
- Preguntar sobre la aplicación práctica de un principio espiritual
- Enfocarte en un aspecto específico de la vida cristiana

¿Te gustaría que te ayudara a reformular tu pregunta?`,

        generic: `No tengo contenido de sermones que responda directamente a tu pregunta. Sin embargo, estaría encantado de ayudarte a explorar otros temas de las enseñanzas del pastor.

Aquí hay algunos temas que están bien cubiertos en la base de datos de sermones:
- Oración y comunicación con Dios
- Fe y confianza en tiempos difíciles
- Interpretación bíblica y comprensión
- Vida cristiana práctica

¿Te gustaría que buscara contenido de sermones sobre alguno de estos temas en su lugar?`
      };

      switch (fallbackStrategy) {
        case "clarify_previous": return spanishFallbacks.clarify_previous;
        case "follow_up": return spanishFallbacks.follow_up;
        case "suggest_related": return spanishFallbacks.suggest_related;
        case "refine_search": return spanishFallbacks.refine_search;
        default: return spanishFallbacks.generic;
      }
    }
    
    // For Chinese
    if (state.currentLanguage === 'zh') {
      const chineseFallbacks = {
        clarify_previous: `我没有找到特定的讲道内容来回答你关于这个主题的问题。

从我们之前讨论的讲道内容来看，牧师更多地关注实际应用而不是详细解释。你想让我建议这个主题的其他方面，这些方面可能在讲道中有所涉及吗？或者，你可以重新表述你的问题，专注于特定的圣经段落或实际应用。`,

        follow_up: `我找不到特别针对你的后续问题的讲道内容。

牧师可能在我们当前数据库中没有的其他讲道中讲过这个内容。你想让我帮你探索讲道中涵盖的相关主题吗？例如，我可以搜索与此主题相关的圣经基础或实际应用的讲道内容。`,

        suggest_related: `我找不到直接回答你问题的讲道内容。

牧师可能在其他讲道中讨论过这个问题，或者从与你提问方式不同的角度讨论过。你可以尝试搜索：
- 更具体的圣经术语
- 提及你感兴趣的圣经段落
- 询问属灵原则的实际应用

你想让我帮你重新表述你的问题吗？`,

        refine_search: `我找不到直接回答你问题的讲道内容。牧师可能使用不同的术语或从不同的角度讨论过这个主题。

为了帮我找到相关的讲道内容，你可以：
- 尝试使用更具体的圣经术语
- 提及你感兴趣的圣经段落
- 询问属灵原则的实际应用
- 专注于基督徒生活的特定方面

你想让我帮你重新表述你的问题吗？`,

        generic: `我没有直接回答你问题的讲道内容。但是，我很乐意帮助你探索牧师教导中的其他主题。

以下是在讲道数据库中有详细介绍的一些主题：
- 祷告和与上帝沟通
- 在困难时期的信心和信任
- 圣经解释和理解
- 实际的基督徒生活

你想让我搜索关于这些主题的讲道内容吗？`
      };

      switch (fallbackStrategy) {
        case "clarify_previous": return chineseFallbacks.clarify_previous;
        case "follow_up": return chineseFallbacks.follow_up;
        case "suggest_related": return chineseFallbacks.suggest_related;
        case "refine_search": return chineseFallbacks.refine_search;
        default: return chineseFallbacks.generic;
      }
    }
    
    // For English, use more dynamic implementation
    let response = "";
    
    switch (fallbackStrategy) {
      case "clarify_previous":
        // Generate a response to clarify previous content
        const topicsPhrase = queryTopics.length > 0 ? 
          `about ${queryTopics.join(" and ")}` : 
          "on that topic";
        
        response = `I don't have specific sermon content that addresses your question ${topicsPhrase}. 

From the previous sermon content we discussed, the pastor focused more on the practical application rather than detailed explanations. Would you like me to suggest a different aspect of this topic that might be covered in the sermons? Or perhaps you could rephrase your question to focus on a specific biblical passage or practical application?`;
        break;
        
      case "follow_up":
        // Generate a response that follows up on previous content
        const topicPhrase = queryTopics.length > 0 ? 
          queryTopics.join(" and ") : 
          "that specific aspect";
        
        response = `I couldn't find sermon content that specifically addresses ${topicPhrase} in relation to your follow-up question. 

The pastor may have covered this in other sermons not in our current database. Would you like me to help you explore a related topic that is covered in the sermons? For example, I could search for sermon content about the biblical foundations or practical applications related to this topic.`;
        break;
        
      case "suggest_related":
        // Generate related topics based on current topics
        const allTopics = [...new Set([...queryTopics, ...previousSermonTopics])];
        const relatedTopics = generateRelatedTopics(allTopics);
        
        // Create a list of suggested search terms
        const suggestedSearches = relatedTopics.map(topic => {
          if (queryTopics.length > 0) {
            return `"${queryTopics[0]} and ${topic}"`;
          } else {
            return `"${topic}"`;
          }
        });
        
        // Format the suggested searches
        const suggestionsText = suggestedSearches.length > 0 ? 
          `You might want to try searching for:\n- ${suggestedSearches.join("\n- ")}` : 
          "You might want to try rephrasing your question to focus on specific biblical teachings or practical applications.";
        
        response = `I couldn't find sermon content that directly addresses your question about ${queryTopics.join(" and ")}. 

The pastor may have discussed this in other sermons or from a different perspective than how you phrased your question. ${suggestionsText}

Would you like me to search for any of these related topics?`;
        break;
        
      case "refine_search":
        response = `I couldn't find sermon content that directly answers your question. The pastor may have addressed this topic using different terminology or approached it from a different angle.

To help me find relevant sermon content, you could:
- Try using more specific biblical terms
- Mention a Bible passage you're interested in
- Ask about practical application of a spiritual principle
- Focus on a specific aspect of Christian living

Would you like me to help you rephrase your question?`;
        break;
        
      default:
        response = `I don't have sermon content that directly addresses your question. However, I'd be happy to help you explore other topics from the pastor's teachings.

Here are some topics that are well-covered in the sermon database:
- Prayer and communication with God
- Faith and trust in difficult times
- Biblical interpretation and understanding
- Practical Christian living

Would you like me to search for sermon content on any of these topics instead?`;
    }
    
    return response;
  }

  /**
   * Generate related topics based on given topics
   */
  function generateRelatedTopics(topics) {
    // Topic relationships - what topics are commonly related to others
    const topicRelationships = {
      "prayer": ["faith", "spiritual disciplines", "hearing from God"],
      "faith": ["trust", "doubt", "spiritual growth"],
      "forgiveness": ["reconciliation", "healing", "relationships"],
      "relationships": ["family", "marriage", "community"],
      "biblical interpretation": ["theology", "hermeneutics", "Bible study"],
      "spiritual growth": ["discipleship", "maturity", "sanctification"]
    };
    
    const relatedTopics = [];
    
    // Find related topics based on the topic relationships
    topics.forEach(topic => {
      if (topicRelationships[topic]) {
        topicRelationships[topic].forEach(relatedTopic => {
          if (!topics.includes(relatedTopic) && !relatedTopics.includes(relatedTopic)) {
            relatedTopics.push(relatedTopic);
          }
        });
      }
    });
    
    // If we still don't have enough related topics, add some general ones
    if (relatedTopics.length < 3) {
      const generalTopics = ["prayer", "faith", "biblical teaching", "spiritual growth"];
      generalTopics.forEach(topic => {
        if (!topics.includes(topic) && !relatedTopics.includes(topic)) {
          relatedTopics.push(topic);
        }
      });
    }
    
    // Return at most 3 related topics
    return relatedTopics.slice(0, 3);
  }

  // ======= INITIALIZATION =======

  /**
   * Initialize the application
   */
  function init() {
    // Get DOM elements
    elements = {
      chatForm: getElement('chatForm'),
      queryInput: getElement('queryInput'),
      messagesContainer: getElement('messages'),
      sourcesPanel: getElement('sourcesPanel'),
      sourcesPanelContent: getElement('sourcesPanelContent'),
      closeSourcesButton: getElement('closeSourcesPanel'),
      apiStatusBanner: getElement('api-status-banner'),
      apiStatusMessage: getElement('api-status-message'),
      retryConnectionButton: getElement('retry-connection'),
      languageSelect: getElement('languageSelect'),
      clearConversationBtn: getElement('clearConversation'),
      infoToggle: getElement('infoToggle'),
      infoSection: getElement('infoSection'),
      closeInfoSection: getElement('closeInfoSection'),
      // BYOK modal + indicator
      byokSection: getElement('byokSection'),
      closeByokSection: getElement('closeByokSection'),
      byokKeyInput: getElement('byokKeyInput'),
      byokSaveButton: getElement('byokSaveButton'),
      byokError: getElement('byokError'),
      byokIndicator: getElement('byokIndicator'),
      byokRemove: getElement('byokRemove'),
      byokNudge: getElement('byokNudge'),
    };
    
    // Create backdrop for mobile sources panel
    if (elements.sourcesPanel) {
      const backdrop = document.createElement('div');
      backdrop.className = 'claude-sources-backdrop';
      backdrop.style.display = 'none';
      backdrop.style.position = 'fixed';
      backdrop.style.top = '0';
      backdrop.style.left = '0';
      backdrop.style.right = '0';
      backdrop.style.bottom = '0';
      backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      backdrop.style.zIndex = '50';
      backdrop.style.opacity = '0';
      backdrop.style.transition = 'opacity 0.3s ease';
      document.body.appendChild(backdrop);
      
      elements.sourcesBackdrop = backdrop;
      
      // Close panel when backdrop is clicked
      backdrop.addEventListener('click', function() {
        toggleSourcesPanel(false);
      });
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Make sure overlay container exists
    ensureOverlayContainer();
    
    // Verify API connection
    verifyApiConnection(false);

    // Restore any previous conversation from localStorage. If anything
    // is restored, we skip the welcome message. The restore re-runs the
    // same addMessage + displayAnswer code paths a live conversation uses,
    // so source panels + bible chips + markdown all come back correctly.
    const savedTurns = loadChatTurns();
    if (savedTurns.length > 0) {
      state.persistedTurns = savedTurns.slice();
      state.isFirstLoad = false;
      for (const turn of savedTurns) {
        try {
          addMessage(turn.user, 'user');
          state.conversationHistory.push({ role: 'user', content: turn.user });
          if (turn.mode === 'find') {
            displaySearchResults(turn.data, turn.user);
          } else {
            // displayAnswer also pushes the assistant message to conversationHistory
            displayAnswer(turn.data);
          }
        } catch (e) {
          // If a saved turn fails to restore (e.g., shape changed), skip it
          // rather than break the whole restore.
          console.warn('Failed to restore one chat turn:', e);
        }
      }
      // Trim conversationHistory to the API context cap
      if (state.conversationHistory.length > config.maxMemoryLength * 2) {
        state.conversationHistory = state.conversationHistory.slice(-config.maxMemoryLength * 2);
      }
    }

    // Display welcome message only if nothing was restored
    if (state.isFirstLoad) {
      displayWelcomeMessage();
    }
    
    // Set initial language
    if (elements.languageSelect) {
      changeLanguage(elements.languageSelect.value);
    }
    
    console.log('Sermon Search application initialized');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Form submission
    if (elements.chatForm) {
      elements.chatForm.addEventListener('submit', function(event) {
        try {
          handleSubmit(event);
        } catch (error) {
          console.error('Error in form submission handler:', error);
          // Show error to user
          const errorMsg = `
            <div class="error-container">
              <p>Sorry, an error occurred: ${error.message}</p>
            </div>
          `;
          addMessage(errorMsg, 'bot', true);
        }
      });
    }
    
    // Input field enhancements
    if (elements.queryInput) {
      // Auto-resize textarea
      adjustTextareaHeight(elements.queryInput);
      
      // Create a debounced version of the height adjustment function for better performance
      const debouncedAdjustHeight = debounce(function() {
        adjustTextareaHeight(elements.queryInput);
      }, config.debounceTime);
      
      elements.queryInput.addEventListener('input', debouncedAdjustHeight);
      
      // Better keyboard handling
      elements.queryInput.addEventListener('keydown', function(e) {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey && !state.pendingRequests) {
          e.preventDefault();
          if (elements.chatForm) elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
        
        // Handle Escape key to blur the textarea
        if (e.key === 'Escape') {
          this.blur();
        }
      });
      
      // Visual feedback for focus
      elements.queryInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
      });
      
      elements.queryInput.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
      });
      
      // Focus on load
      setTimeout(() => elements.queryInput.focus(), 500);
    }
    
    // Sources panel close button
    if (elements.closeSourcesButton) {
      elements.closeSourcesButton.addEventListener('click', function() {
        toggleSourcesPanel(false);
      });
    }
    
    // Language selector
    if (elements.languageSelect) {
      elements.languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
      });
    }
    
  // Mode toggle — switches between AI synthesis (ask) and sermon list (find).
  // Updates placeholder text so the user sees what each mode is for.
  const modeButtons = document.querySelectorAll('.mode-option');
  if (modeButtons.length && elements.queryInput) {
    const PLACEHOLDERS = {
      ask: 'Ask a question about the sermons...',
      find: 'Find sermons by topic (e.g., "prayer", "Romans 8")',
    };
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', function () {
        const mode = this.getAttribute('data-mode');
        if (!mode || mode === state.currentMode) return;
        state.currentMode = mode;
        modeButtons.forEach((b) => {
          const isActive = b.getAttribute('data-mode') === mode;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
        elements.queryInput.placeholder = PLACEHOLDERS[mode] || PLACEHOLDERS.ask;
      });
    });
  }

  // Clear conversation button
  if (elements.clearConversationBtn) {
    elements.clearConversationBtn.addEventListener('click', function() {
      // Add confirmation dialog as an alert popup
      if (state.conversationHistory.length > 1) {
        // Create alert overlay
        const overlay = document.createElement('div');
        overlay.className = 'claude-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'clear-conversation-title');
        
        // Create alert content
        const overlayContent = document.createElement('div');
        overlayContent.className = 'claude-overlay-content';
        
        // Add alert header and body
        overlayContent.innerHTML = `
          <div class="claude-overlay-header">
            <h2 id="clear-conversation-title" class="claude-overlay-title">Clear Conversation</h2>
          </div>
          <div class="claude-overlay-body">
            <p>Are you sure you want to clear the entire conversation history?</p>
            <div class="claude-confirmation-buttons" style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
              <button class="claude-cancel-button control-button">Cancel</button>
              <button class="claude-confirm-button control-button" style="background-color: var(--primary-color); color: white;">Clear</button>
            </div>
          </div>
        `;
        
        overlay.appendChild(overlayContent);
        document.body.appendChild(overlay);
        
        // Activate with animation
        setTimeout(() => {
          overlay.classList.add('active');
        }, 10);
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Add event listeners
        const cancelButton = overlay.querySelector('.claude-cancel-button');
        const confirmButton = overlay.querySelector('.claude-confirm-button');
        
        // Close when clicking outside content
        overlay.addEventListener('click', function(e) {
          if (e.target === overlay) {
            closeOverlay(overlay);
          }
        });
        
        // Close on ESC key
        overlay.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            closeOverlay(overlay);
          }
        });
        
        cancelButton.addEventListener('click', function() {
          closeOverlay(overlay);
        });
        
        confirmButton.addEventListener('click', function() {
          closeOverlay(overlay);
          clearConversation();
        });
        
        // Focus the cancel button for accessibility
        setTimeout(() => {
          cancelButton.focus();
        }, 100);
        } else {
          // If conversation is very short, just clear without confirmation
          clearConversation();
        }
      });
    }
    
    // Retry connection button
    if (elements.retryConnectionButton) {
      elements.retryConnectionButton.addEventListener('click', function() {
        verifyApiConnection(true);
      });
    }
    
    // About modal — open-only trigger plus three explicit close paths
    // (X button, backdrop tap, Escape key). Returns focus to the trigger
    // when closed.
    if (elements.infoToggle && elements.infoSection) {
      const openInfo = () => {
        elements.infoSection.classList.add('active');
        elements.infoSection.setAttribute('aria-hidden', 'false');
        // Defer focus until the modal is visible so screen readers
        // announce it properly.
        requestAnimationFrame(() => {
          if (elements.closeInfoSection) elements.closeInfoSection.focus();
        });
      };

      const closeInfo = () => {
        if (!elements.infoSection.classList.contains('active')) return;
        elements.infoSection.classList.remove('active');
        elements.infoSection.setAttribute('aria-hidden', 'true');
        elements.infoToggle.focus();
      };

      elements.infoToggle.addEventListener('click', openInfo);

      if (elements.closeInfoSection) {
        elements.closeInfoSection.addEventListener('click', closeInfo);
      }

      // Tap on the dimmed backdrop (the overlay element itself, not its
      // content card) closes the modal.
      elements.infoSection.addEventListener('click', function(event) {
        if (event.target === elements.infoSection) closeInfo();
      });

      // Escape closes the modal when it's open.
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' &&
            elements.infoSection.classList.contains('active')) {
          closeInfo();
        }
      });
    }

    // BYOK modal — same open/close pattern as About modal. The modal is
    // opened by the cap-hit message (via openByokModal) rather than a
    // dedicated trigger button, since it should only surface when needed.
    if (elements.byokSection) {
      if (elements.closeByokSection) {
        elements.closeByokSection.addEventListener('click', closeByokModal);
      }
      // Backdrop click closes.
      elements.byokSection.addEventListener('click', function(event) {
        if (event.target === elements.byokSection) closeByokModal();
      });
      // Escape closes when active.
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' &&
            elements.byokSection.classList.contains('active')) {
          closeByokModal();
        }
      });
      // Save button + Enter-to-save inside the input.
      if (elements.byokSaveButton) {
        elements.byokSaveButton.addEventListener('click', handleByokSave);
      }
      if (elements.byokKeyInput) {
        elements.byokKeyInput.addEventListener('keydown', function(event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            handleByokSave();
          }
        });
      }
    }
    // BYOK indicator's remove button.
    if (elements.byokRemove) {
      elements.byokRemove.addEventListener('click', handleByokRemove);
    }
    // Modest nudge below the input opens the BYOK modal without waiting
    // for the cap to be hit — gives daily users an opt-in entry point.
    if (elements.byokNudge) {
      elements.byokNudge.addEventListener('click', () => openByokModal());
    }
    // Show indicator on initial load if a key is already stored.
    updateByokIndicator();

    // Make example questions clickable
    setupExampleQuestionClicks();
    
    // Global event listener for overlay close via escape key.
    // Skips #infoSection because that's a static modal — closeOverlay()
    // removes the element from the DOM, which would break subsequent opens.
    // #infoSection has its own Escape handler above.
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const activeOverlay = document.querySelector('.claude-overlay.active:not(#infoSection)');
        if (activeOverlay) {
          closeOverlay(activeOverlay);
        }
      }
    });
    
    // Add touch swipe‑down to close Sources panel on mobile
    if (elements.sourcesPanel) {
      const scrollable = elements.sourcesPanelContent || elements.sourcesPanel;

      let touchStartY = 0;
      let touchMoveY  = 0;
      let atTop       = false;          // NEW

      elements.sourcesPanel.addEventListener('touchstart', e => {
        touchStartY = e.touches[0].clientY;
        atTop       = (scrollable.scrollTop === 0);   // remember if we were at top
      }, { passive: true });

      elements.sourcesPanel.addEventListener('touchmove', e => {
        touchMoveY = e.touches[0].clientY;
        const deltaY = touchMoveY - touchStartY;

        // Intercept **only** when:
        //  – pulling down (deltaY > 0)
        //  – panel is already scrolled to top
        if (deltaY > 0 && atTop && window.innerWidth <= 768) {
          e.preventDefault();
          const translateY = Math.min(deltaY * 0.5, 100);
          elements.sourcesPanel.style.transform = `translateY(${translateY}px)`;
        }
      }, { passive: false });

      elements.sourcesPanel.addEventListener('touchend', () => {
        const deltaY = touchMoveY - touchStartY;

        // Close only if we started at the top **and** pulled far enough
        if (atTop && deltaY > 80 && window.innerWidth <= 768) {
          toggleSourcesPanel(false);
        }

        // Reset
        elements.sourcesPanel.style.transform = '';
        touchStartY = touchMoveY = 0;
        atTop = false;
      }, { passive: true });
    }
    
    // Handle window resize for mobile transitions
    const throttledResize = throttle(function() {
      if (window.innerWidth > 768) {
        // If transitioning from mobile to desktop, reset transitions
        if (elements.sourcesPanel && elements.sourcesPanel.classList.contains('active')) {
          elements.sourcesPanel.style.transform = '';
        }
      }
    }, 100);
    
    window.addEventListener('resize', throttledResize);

    // Light-only site. The previous code flipped data-theme="dark" based on
    // prefers-color-scheme, which activated the partial dark CSS and produced
    // unreadable black-text-on-dark-blue rendering for users whose phones are
    // in system dark mode. The site is designed as light-only (color-scheme:
    // only light, plus the matching <meta> tag), so we no longer toggle the
    // theme attribute here.
    
    // Add visibility change listener to handle page focus/blur
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        // When the page becomes visible, check API connection
        if (!state.isApiConnected) {
          verifyApiConnection(false);
        }
      }
    });
  }

  function setupExampleQuestionClicks() {
  // Target both info section examples and welcome message examples
  const allExampleQuestions = document.querySelectorAll('.info-section-list li, .claude-suggestions .claude-suggestion');
  
  allExampleQuestions.forEach(item => {
    // Remove previous event listeners by cloning and replacing
    const newItem = item.cloneNode(true);
    if (item.parentNode) {
      item.parentNode.replaceChild(newItem, item);
    }
    
    newItem.style.cursor = 'pointer';
    
    newItem.addEventListener('click', function(e) {
      // Add ripple effect
      addRippleEffect(this, e);
      
      // Get the translated text from the button itself
      const query = this.textContent.trim();
      
      if (elements.queryInput) {
        elements.queryInput.value = query;
        
        // Smoothly scroll to chat section if needed
        const chatSection = document.querySelector('.chat-section-wrapper');
        if (chatSection && window.innerWidth <= 768) {
          chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Short delay before submitting
        setTimeout(() => {
          elements.chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }, 300);
      }
    });
    
    // Add hover effects for better UX
    newItem.addEventListener('mouseenter', function() {
      this.classList.add('hover');
    });
    
    newItem.addEventListener('mouseleave', function() {
      this.classList.remove('hover');
    });
  });
}

  // ======= PUBLIC API =======
  
  // Return the public API
  return {
    init: init,
    changeLanguage: changeLanguage,
    clearConversation: clearConversation,
    toggleSourcesPanel: toggleSourcesPanel,
    handleSubmit: handleSubmit,
    
    // Add some additional utility methods for potential public usage
    verifyApiConnection: verifyApiConnection,
    addMessage: addMessage
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  SermonSearch.init();
  
  // Add responsive CSS class to body based on screen size
  function updateResponsiveClass() {
    if (window.innerWidth <= 768) {
      document.body.classList.add('claude-mobile');
    } else {
      document.body.classList.remove('claude-mobile');
    }
  }
  
  // Set initial class
  updateResponsiveClass();
  
  // Update on resize
  window.addEventListener('resize', updateResponsiveClass);
  
  // Add popstate listener for handling browser Back button with Sources panel
  window.addEventListener('popstate', () => {
    // If the Sources panel is showing, close it instead of leaving the page
    if (SermonSearch.toggleSourcesPanel && document.getElementById('sourcesPanel')?.classList.contains('active')) {
      // Close without pushing a *new* history entry
      SermonSearch.toggleSourcesPanel(false, /*fromPopstate=*/true);
    }
  });
});
