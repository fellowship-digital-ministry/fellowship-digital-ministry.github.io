
/**
 * Enhanced Multilingual Sermon Search with Conversation Memory
 * Supports English, Spanish, and Chinese
 */

// API Configuration
const API_URL = '{{ site.api_url }}' || 'https://sermon-search-api-8fok.onrender.com';

// DOM Elements
const chatForm = document.getElementById('chatForm');
const queryInput = document.getElementById('queryInput');
const messagesContainer = document.getElementById('messages');
const apiStatusBanner = document.getElementById('api-status-banner');
const apiStatusMessage = document.getElementById('api-status-message');
const retryConnectionButton = document.getElementById('retry-connection');
const languageSelect = document.getElementById('languageSelect');
const clearConversationBtn = document.getElementById('clearConversation');

// Bible reference regex for highlighting in responses
const bibleRefRegex = /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi;

// Translations
const translations = {
  en: {
    "sermon-search-tool": "Sermon Search Tool",
    "tool-description": "This interactive tool uses AI to search through sermon transcripts and provide relevant answers to your questions about the pastor's teachings.",
    "api-connection-issue": "API connection issue detected. Check your internet connection or try again later.",
    "retry": "Retry",
    "send": "Send",
    "clear-conversation": "Clear Conversation",
    "how-to-use": "How to Use This Tool",
    "sample-questions": "Sample Questions",
    "examples-intro": "Here are some examples of questions you can ask:",
    "example-1": "What does the pastor teach about prayer?",
    "example-2": "How does the pastor interpret John 3:16?",
    "example-3": "What are the pastor's views on forgiveness?",
    "example-4": "Explain the sermon series on Revelation",
    "example-5": "Find references to the Holy Spirit",
    "about-tool": "About This Tool",
    "search-explanation": "This search tool uses artificial intelligence to analyze sermon transcripts and provide relevant information.",
    "ai-features": "When you ask a question, the AI will:",
    "feature-1": "Search through the entire sermon library",
    "feature-2": "Find the most relevant content to your question",
    "feature-3": "Provide direct links to video timestamps",
    "feature-4": "Show you the exact context where information was found",
    "answers-source": "All answers are based solely on the pastor's actual sermon content.",
    "tips": "Tips for Better Results",
    "tip-1": "Be specific in your questions",
    "tip-2": "Include Bible references if relevant",
    "tip-3": "Ask about specific topics or passages",
    "tip-4": "Try reformulating if you don't get a helpful answer",
    "tip-5": "You can ask follow-up questions for clarification",
    "tip-6": "Check the video links to hear the full context",
    "what-does-pastor-teach": "What does the pastor teach about faith?",
    "welcome-title": "Welcome to the Sermon Search Tool! 👋",
    "welcome-intro": "Ask any question about the pastor's sermons, and I'll provide answers based on the sermon content with timestamped video links.",
    "suggestion-heading": "Try asking about:",
    "watch-video": "Watch Video Clip",
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
    "continue-conversation": "You can continue the conversation by asking follow-up questions."
  },
  es: {
    "sermon-search-tool": "Herramienta de Búsqueda de Sermones",
    "tool-description": "Esta herramienta interactiva utiliza IA para buscar en las transcripciones de sermones y proporcionar respuestas relevantes a sus preguntas sobre las enseñanzas del pastor.",
    "api-connection-issue": "Se detectó un problema de conexión con la API. Compruebe su conexión a Internet o inténtelo de nuevo más tarde.",
    "retry": "Reintentar",
    "send": "Enviar",
    "clear-conversation": "Borrar Conversación",
    "how-to-use": "Cómo Usar Esta Herramienta",
    "sample-questions": "Preguntas de Ejemplo",
    "examples-intro": "Aquí hay algunos ejemplos de preguntas que puede hacer:",
    "example-1": "¿Qué enseña el pastor sobre la oración?",
    "example-2": "¿Cómo interpreta el pastor Juan 3:16?",
    "example-3": "¿Cuáles son los puntos de vista del pastor sobre el perdón?",
    "example-4": "Explica la serie de sermones sobre Apocalipsis",
    "example-5": "Encuentra referencias al Espíritu Santo",
    "about-tool": "Acerca de Esta Herramienta",
    "search-explanation": "Esta herramienta de búsqueda utiliza inteligencia artificial para analizar transcripciones de sermones y proporcionar información relevante.",
    "ai-features": "Cuando hace una pregunta, la IA:",
    "feature-1": "Busca en toda la biblioteca de sermones",
    "feature-2": "Encuentra el contenido más relevante para su pregunta",
    "feature-3": "Proporciona enlaces directos a marcas de tiempo de video",
    "feature-4": "Le muestra el contexto exacto donde se encontró la información",
    "answers-source": "Todas las respuestas se basan únicamente en el contenido real de los sermones del pastor.",
    "tips": "Consejos para Mejores Resultados",
    "tip-1": "Sea específico en sus preguntas",
    "tip-2": "Incluya referencias bíblicas si es relevante",
    "tip-3": "Pregunte sobre temas o pasajes específicos",
    "tip-4": "Intente reformular si no obtiene una respuesta útil",
    "tip-5": "Puede hacer preguntas de seguimiento para aclaración",
    "tip-6": "Consulte los enlaces de video para escuchar el contexto completo",
    "what-does-pastor-teach": "¿Qué enseña el pastor sobre la fe?",
    "welcome-title": "¡Bienvenido a la Herramienta de Búsqueda de Sermones! 👋",
    "welcome-intro": "Haga cualquier pregunta sobre los sermones del pastor, y le proporcionaré respuestas basadas en el contenido del sermón con enlaces de video con marca de tiempo.",
    "suggestion-heading": "Intente preguntar sobre:",
    "watch-video": "Ver Clip de Video",
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
    "no-results": "No se encontró contenido de sermón relevante para responder a esta pregunta.",
    "connection-error": "Lo siento, no puedo acceder a la base de datos de sermones en este momento. Por favor, compruebe su conexión a Internet.",
    "try-again": "Intentar de Nuevo",
    "continue-conversation": "Puede continuar la conversación haciendo preguntas de seguimiento."
  },
  zh: {
    "sermon-search-tool": "讲道搜索工具",
    "tool-description": "这个交互式工具使用人工智能搜索讲道文稿，并根据牧师的教导为您的问题提供相关答案。",
    "api-connection-issue": "检测到API连接问题。请检查您的互联网连接或稍后再试。",
    "retry": "重试",
    "send": "发送",
    "clear-conversation": "清除对话",
    "how-to-use": "如何使用此工具",
    "sample-questions": "示例问题",
    "examples-intro": "以下是一些您可以提问的示例问题：",
    "example-1": "牧师关于祷告有什么教导？",
    "example-2": "牧师如何解释约翰福音3:16？",
    "example-3": "牧师对宽恕的看法是什么？",
    "example-4": "解释关于启示录的讲道系列",
    "example-5": "查找关于圣灵的参考",
    "about-tool": "关于此工具",
    "search-explanation": "这个搜索工具使用人工智能分析讲道文稿并提供相关信息。",
    "ai-features": "当您提出问题时，人工智能将：",
    "feature-1": "搜索整个讲道库",
    "feature-2": "找到与您问题最相关的内容",
    "feature-3": "提供直接链接到视频时间戳",
    "feature-4": "向您展示找到信息的确切上下文",
    "answers-source": "所有答案完全基于牧师的实际讲道内容。",
    "tips": "获得更好结果的提示",
    "tip-1": "在问题中具体明确",
    "tip-2": "如果相关，请包含圣经引用",
    "tip-3": "询问特定主题或段落",
    "tip-4": "如果没有得到有用的答案，请尝试重新表述",
    "tip-5": "您可以提出后续问题以获取澄清",
    "tip-6": "查看视频链接以听取完整上下文",
    "what-does-pastor-teach": "牧师关于信心有什么教导？",
    "welcome-title": "欢迎使用讲道搜索工具！👋",
    "welcome-intro": "询问任何关于牧师讲道的问题，我将根据讲道内容提供带有时间戳视频链接的答案。",
    "suggestion-heading": "尝试询问关于：",
    "watch-video": "观看视频片段",
    "hide-video": "隐藏视频",
    "view-transcript": "查看文稿",
    "hide-transcript": "隐藏文稿",
    "open-youtube": "在YouTube上打开",
    "loading-transcript": "正在加载文稿...",
    "show-sources": "显示来源",
    "hide-sources": "隐藏来源",
    "sources-found": "找到的来源",
    "view-all-sources": "查看所有来源",
    "searching": "正在搜索讲道内容...",
    "no-results": "没有找到相关讲道内容来回答这个问题。",
    "connection-error": "抱歉，我现在无法访问讲道数据库。请检查您的互联网连接。",
    "try-again": "重试",
    "continue-conversation": "您可以通过提出后续问题继续对话。"
  }
};

// Conversation memory
let conversationHistory = [];
const MAX_MEMORY_LENGTH = 10; // Maximum number of exchanges to remember

// Example queries for the user (will be translated)
const sampleQueries = [
  "example-1",
  "example-2", 
  "example-3",
  "example-4", 
  "example-5"
];

// Keep track of whether this is first load
let isFirstLoad = true;

// Current language
let currentLanguage = 'en';

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing sermon search...');
  
  // Check if the form exists on this page before attaching events
  if (chatForm) {
    console.log('Chat form found, adding event listeners');
    
    chatForm.addEventListener('submit', handleSubmit);
    
    if (queryInput) {
      // Add placeholder text cycling
      setupPlaceholderCycling(queryInput, getTranslatedQueries());
      
      queryInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          chatForm.dispatchEvent(new Event('submit'));
        }
      });
      
      // Focus the input field on page load
      setTimeout(() => queryInput.focus(), 500);
    }
    
    // Add language change handler
    if (languageSelect) {
      languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
      });
    }
    
    // Add clear conversation handler
    if (clearConversationBtn) {
      clearConversationBtn.addEventListener('click', clearConversation);
    }
    
    // Add retry connection button handler
    if (retryConnectionButton) {
      retryConnectionButton.addEventListener('click', function() {
        verifyApiConnection(true);
      });
    }
    
    // Verify API connection on page load
    verifyApiConnection(false);
    
    // Add suggested queries for first-time users
    if (isFirstLoad) {
      displayWelcomeMessage();
    }
    
    // Make example questions clickable
    setupExampleQuestionClicks();
    
    // Set initial language
    changeLanguage(languageSelect.value);
  } else {
    console.error('Chat form not found on this page');
  }
});

/**
 * Display welcome message with instructions
 */
function displayWelcomeMessage() {
  // Add welcome message with instructions
  const welcomeMsg = `
    <div class="welcome-message">
      <h4>${translate('welcome-title')}</h4>
      <p>${translate('welcome-intro')}</p>
      <p class="suggestion-heading">${translate('suggestion-heading')}</p>
      <div class="suggestion-chips">
        ${getTranslatedQueries().map(query => 
          `<button class="suggestion-chip" data-query="${query}">${query}</button>`
        ).join('')}
      </div>
    </div>
  `;
  
  addMessage(welcomeMsg, 'bot');
  
  // Add click handlers for suggestion chips
  document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', function() {
      const query = this.getAttribute('data-query');
      queryInput.value = query;
      chatForm.dispatchEvent(new Event('submit'));
    });
  });
  
  isFirstLoad = false;
}

/**
 * Get translated sample queries
 */
function getTranslatedQueries() {
  return sampleQueries.map(key => translate(key));
}

/**
 * Setup placeholder text cycling for input field
 */
function setupPlaceholderCycling(inputElement, suggestions) {
  let currentIndex = 0;
  
  // Set initial placeholder
  inputElement.placeholder = suggestions[0];
  
  // Change placeholder text every 3 seconds
  const cycleInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % suggestions.length;
    
    // Animate the placeholder change
    inputElement.style.opacity = 0;
    
    setTimeout(() => {
      inputElement.placeholder = suggestions[currentIndex];
      inputElement.style.opacity = 1;
    }, 200);
  }, 3000);
  
  // Store interval ID for cleanup
  inputElement.dataset.cycleInterval = cycleInterval;
  
  // Reset opacity on focus
  inputElement.addEventListener('focus', () => {
    inputElement.style.opacity = 1;
  });
}

/**
 * Setup click handlers for example questions in the info section
 */
function setupExampleQuestionClicks() {
  const exampleQuestions = document.querySelectorAll('.example-questions li');
  console.log('Setting up', exampleQuestions.length, 'example questions');
  
  exampleQuestions.forEach(item => {
    item.style.cursor = 'pointer';
    
    item.addEventListener('click', function() {
      const query = this.textContent.trim();
      console.log('Example question clicked:', query);
      
      if (queryInput) {
        queryInput.value = query;
        
        // Smoothly scroll to chat section
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
          chatContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        // Short delay before submitting to let scroll complete
        setTimeout(() => {
          chatForm.dispatchEvent(new Event('submit'));
        }, 500);
      }
    });
  });
}

/**
 * Change the interface language
 */
function changeLanguage(language) {
  if (!translations[language]) {
    console.error(`Translations for language "${language}" not found`);
    return;
  }
  
  currentLanguage = language;
  
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
  
  // Reset placeholder cycling with new language
  if (queryInput) {
    // Clear existing interval
    if (queryInput.dataset.cycleInterval) {
      clearInterval(parseInt(queryInput.dataset.cycleInterval));
    }
    // Setup new cycling with translated queries
    setupPlaceholderCycling(queryInput, getTranslatedQueries());
  }
  
  // Update welcome message if it exists
  if (isFirstLoad) {
    displayWelcomeMessage();
  }
  
  console.log(`Language changed to ${language}`);
}

/**
 * Translate a key to the current language
 */
function translate(key) {
  if (!translations[currentLanguage]) {
    return key;
  }
  
  return translations[currentLanguage][key] || key;
}

/**
 * Verify API connection
 */
async function verifyApiConnection(showFeedback = false) {
  console.log('Verifying API connection to:', API_URL);
  
  if (showFeedback) {
    // Show checking message
    if (apiStatusBanner) {
      apiStatusBanner.style.display = 'block';
      apiStatusBanner.style.backgroundColor = '#f0f9ff';
      apiStatusBanner.style.color = '#2ea3f2';
      apiStatusMessage.textContent = 'Checking connection...';
    }
  } else {
    // Hide banner initially
    if (apiStatusBanner) {
      apiStatusBanner.style.display = 'none';
    }
  }
  
  try {
    // Try the root endpoint first
    const rootResponse = await fetch(`${API_URL}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      mode: 'cors'
    });
    
    if (!rootResponse.ok) {
      throw new Error(`API connection failed with status: ${rootResponse.status}`);
    }
    
    console.log('API connection successful');
    
    // Show success message if feedback was requested
    if (showFeedback) {
      if (apiStatusBanner) {
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
    
    if (apiStatusBanner && apiStatusMessage) {
      apiStatusBanner.style.display = 'block';
      apiStatusBanner.style.backgroundColor = '#fef2f2';
      apiStatusBanner.style.color = '#b91c1c';
      apiStatusMessage.textContent = translate('api-connection-issue');
    }
    
    return false;
  }
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
  event.preventDefault();
  console.log('Form submitted');
  
  const query = queryInput.value.trim();
  if (!query) {
    console.log('Empty query, ignoring');
    return;
  }
  
  // Add user message to the chat
  addMessage(query, 'user');
  
  // Add to conversation history
  conversationHistory.push({ role: 'user', content: query });
  
  // Limit history length
  if (conversationHistory.length > MAX_MEMORY_LENGTH * 2) {
    conversationHistory = conversationHistory.slice(-MAX_MEMORY_LENGTH * 2);
  }
  
  // Clear input field
  queryInput.value = '';
  
  // Add typing indicator
  const typingId = addTypingIndicator();
  
  try {
    // Check API connection first
    const isConnected = await verifyApiConnection(false);
    
    if (!isConnected) {
      removeMessage(typingId);
      addMessage(`
        <div class="connection-error">
          <p>${translate('connection-error')}</p>
          <button class="retry-button">${translate('retry')}</button>
        </div>
      `, 'bot', true);
      
      // Add click handler for retry button
      document.querySelector('.retry-button').addEventListener('click', function() {
        verifyApiConnection(true);
      });
      
      return;
    }
    
    // Send request to API with conversation history for context
    const url = `${API_URL}/answer`;
    console.log('Sending request to:', url);
    
    // Create API request payload
    const payload = {
      query: query,
      top_k: 5,
      include_sources: true,
      language: currentLanguage // Send language preference to API
    };
    
    // Add conversation history if available
    if (conversationHistory.length > 1) {
      payload.conversation_history = conversationHistory.slice(0, -1); // Exclude current query
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'Accept-Language': currentLanguage // Language header
      },
      mode: 'cors',
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received response:', data);
    
    // Remove typing indicator
    removeMessage(typingId);
    
    // Display AI response
    displayAnswer(data);
    
    // Add to conversation history
    conversationHistory.push({ role: 'assistant', content: data.answer });
    
    // Check if there was a previous message to connect this one with
    const messages = messagesContainer.querySelectorAll('.message.bot:not(.typing-indicator)');
    if (messages.length > 1) {
      // Mark the previous bot message as having a follow-up
      messages[messages.length - 2].classList.add('followed-up');
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // Remove typing indicator
    removeMessage(typingId);
    
    // Show error message with retry option
    addMessage(`
      <div class="error-container">
        <p>Sorry, there was an error processing your question (${error.message}).</p>
        <button class="retry-button">${translate('try-again')}</button>
      </div>
    `, 'bot', true);
    
    // Add click handler for retry button
    document.querySelector('.retry-button').addEventListener('click', function() {
      // Put the query back in the input
      queryInput.value = query;
      // Focus the input
      queryInput.focus();
    });
  }
}

/**
 * Clear the conversation history
 */
function clearConversation() {
  // Clear the conversation history array
  conversationHistory = [];
  
  // Clear the messages container
  messagesContainer.innerHTML = '';
  
  // Display welcome message again
  displayWelcomeMessage();
  
  // Focus the input field
  if (queryInput) {
    queryInput.focus();
  }
}

/**
 * Add a message to the chat
 */
function addMessage(text, sender, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  
  if (isError) {
    messageElement.classList.add('error');
  }
  
  // Add animation classes
  messageElement.classList.add('message-appear');
  
  // For bot messages, process and render HTML properly
  if (sender === 'bot') {
    // First highlight Bible references
    text = highlightBibleReferences(text);
    
    // Set the HTML content directly to properly render HTML tags
    messageElement.innerHTML = text;
    
    // Make all links open in new tab
    const links = messageElement.querySelectorAll('a');
    links.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    });
  } else {
    // For user messages, escape HTML
    messageElement.textContent = text;
  }
  
  messageElement.id = 'msg-' + Date.now();
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom
  smoothScrollToBottom(messagesContainer);
  
  return messageElement.id;
}

/**
 * Add a typing indicator
 */
function addTypingIndicator() {
  const typingElement = document.createElement('div');
  typingElement.className = 'message bot typing-indicator message-appear';
  typingElement.id = 'typing-' + Date.now();
  
  typingElement.innerHTML = `
    <div class="typing-dots">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
  
  messagesContainer.appendChild(typingElement);
  
  // Scroll to the bottom
  smoothScrollToBottom(messagesContainer);
  
  return typingElement.id;
}

/**
 * Smooth scroll to the bottom of a container
 */
function smoothScrollToBottom(container) {
  const scrollHeight = container.scrollHeight;
  const currentScroll = container.scrollTop + container.clientHeight;
  const targetScroll = scrollHeight;
  
  // Only smooth scroll if we're reasonably close to the bottom already
  // This avoids jarring scrolling when lots of content is added
  if (targetScroll - currentScroll < 500) {
    container.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
  } else {
    container.scrollTop = targetScroll;
  }
}

/**
 * Remove a message by ID
 */
function removeMessage(id) {
  const message = document.getElementById(id);
  if (message) {
    // Add fade-out animation
    message.classList.add('message-disappear');
    
    // Remove after animation completes
    setTimeout(() => {
      message.remove();
    }, 300);
  }
}

/**
 * Format a date string from various possible formats
 */
function formatSermonDate(dateStr) {
  if (!dateStr) return 'Date unknown';
  
  try {
    // Handle YYYYMMDD format (common in the metadata)
    if (typeof dateStr === 'number' || (typeof dateStr === 'string' && /^\d{8}$/.test(dateStr))) {
      const yearStr = String(dateStr).substring(0, 4);
      const monthStr = String(dateStr).substring(4, 6);
      const dayStr = String(dateStr).substring(6, 8);
      
      const year = parseInt(yearStr);
      const month = parseInt(monthStr) - 1; // JavaScript months are 0-indexed
      const day = parseInt(dayStr);
      
      const date = new Date(year, month, day);
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle ISO date strings
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle timestamp
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Return as is if we can't parse it
    return dateStr;
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
  
  // Remove quotes that might be in the title
  return title.replace(/^["']|["']$/g, '');
}

/**
 * Display the answer and sources from the API
 */
function displayAnswer(data) {
  // Add the answer to the chat - allow HTML rendering
  const answerId = addMessage(data.answer, 'bot');
  
  // Display sources if available
  if (data.sources && data.sources.length > 0) {
    // Sort sources by similarity score
    const sortedSources = [...data.sources].sort((a, b) => b.similarity - a.similarity);
// Create a sources container
    const sourcesContainer = document.createElement('div');
    sourcesContainer.className = 'sources-container';
    sourcesContainer.innerHTML = `
      <div class="sources-header">
        <h4>${translate('sources-found')} (${sortedSources.length})</h4>
        <div class="sources-toggle">${translate('show-sources')}</div>
      </div>
      <div class="sources-content" style="display: none;"></div>
    `;
    
    // Add sources container after the answer
    const answerElement = document.getElementById(answerId);
    answerElement.after(sourcesContainer);
    
    // Get the sources content container
    const sourcesContent = sourcesContainer.querySelector('.sources-content');
    
    // Add toggle functionality
    const sourcesToggle = sourcesContainer.querySelector('.sources-toggle');
    sourcesToggle.addEventListener('click', function() {
      const isHidden = sourcesContent.style.display === 'none';
      
      // Toggle the content display
      sourcesContent.style.display = isHidden ? 'block' : 'none';
      
      // Update the toggle text
      this.textContent = isHidden ? translate('hide-sources') : translate('show-sources');
      
      // Scroll into view if showing
      if (isHidden) {
        setTimeout(() => {
          sourcesContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
      }
    });
    
    // Display top sources
    const sourceLimit = Math.min(sortedSources.length, 3); // Limit to top 3 sources
    const topSources = sortedSources.slice(0, sourceLimit);
    
    // Add sources to the content container
    topSources.forEach((source, index) => {
      const sourceElement = createSourceElement(source, index);
      sourcesContent.appendChild(sourceElement);
    });
    
    // If there are more sources, add a "View all sources" button
    if (sortedSources.length > sourceLimit) {
      const viewAllButton = document.createElement('button');
      viewAllButton.className = 'view-all-sources';
      viewAllButton.textContent = `${translate('view-all-sources')} (${sortedSources.length})`;
      viewAllButton.addEventListener('click', function() {
        // Clear existing sources
        sourcesContent.innerHTML = '';
        
        // Add all sources
        sortedSources.forEach((source, index) => {
          const sourceElement = createSourceElement(source, index);
          sourcesContent.appendChild(sourceElement);
        });
        
        // Remove self
        this.remove();
      });
      
      sourcesContent.appendChild(viewAllButton);
    }
    
    // Add a "continue conversation" hint if this is the first answer
    if (conversationHistory.length <= 2) {
      const continueHint = document.createElement('div');
      continueHint.className = 'continue-hint';
      continueHint.innerHTML = `<p><em>${translate('continue-conversation')}</em></p>`;
      messagesContainer.appendChild(continueHint);
    }
  }
}

/**
 * Create a source element with translated UI
 */
function createSourceElement(source, index) {
  const sourceElement = document.createElement('div');
  sourceElement.className = 'source-container';
  sourceElement.setAttribute('data-video-id', source.video_id);
  
  const similarity = Math.round(source.similarity * 100);
  const videoUrl = `https://www.youtube.com/embed/${source.video_id}?start=${Math.floor(source.start_time)}`;
  
  // Format title and date for display
  const formattedTitle = formatSermonTitle(source.title);
  const formattedDate = formatSermonDate(source.publish_date);
  
  // Create collapsed view first (default)
  sourceElement.innerHTML = `
    <div class="source-header">
      <div class="source-title">${escapeHTML(formattedTitle)}</div>
      <div class="source-date">${formattedDate}</div>
    </div>
    <div class="source-text">"${formatText(source.text.substring(0, 150))}${source.text.length > 150 ? '...' : ''}"</div>
    <div class="source-meta">
      <span class="source-time">Timestamp: ${formatTimestamp(source.start_time)}</span>
      <span class="source-match">${similarity}% match</span>
    </div>
    <div class="source-actions">
      <button class="watch-video-btn" onclick="toggleVideo(this)">${translate('watch-video')}</button>
      <button class="view-transcript-btn" onclick="toggleTranscript('${source.video_id}', ${source.start_time})">${translate('view-transcript')}</button>
      <a href="https://www.youtube.com/watch?v=${source.video_id}&t=${Math.floor(source.start_time)}" target="_blank" class="open-youtube-btn">
        ${translate('open-youtube')}
      </a>
    </div>
    <div class="video-embed" style="display: none;">
      <iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen height="215"></iframe>
    </div>
  `;
  
  return sourceElement;
}

/**
 * Toggle video display
 */
function toggleVideo(button) {
  const videoEmbed = button.parentElement.nextElementSibling;
  const isHidden = videoEmbed.style.display === 'none';
  
  // Toggle the video display
  videoEmbed.style.display = isHidden ? 'block' : 'none';
  
  // Update the button text
  button.textContent = isHidden ? translate('hide-video') : translate('watch-video');
  
  // Scroll to make video visible if showing
  if (isHidden) {
    setTimeout(() => {
      videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
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
 * Format text (e.g., highlight Bible references)
 */
function formatText(text) {
  if (!text) return '';
  // First escape HTML
  text = escapeHTML(text);
  // Then highlight Bible references
  return highlightBibleReferences(text);
}

/**
 * Highlight Bible references in text
 */
function highlightBibleReferences(text) {
  // Use a different regex based on the current language
  let regex = bibleRefRegex;
  
  if (currentLanguage === 'es') {
    // Spanish Bible book names
    regex = /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi;
  } else if (currentLanguage === 'zh') {
    // Chinese Bible book names
    regex = /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi;
  }
  
  return text.replace(regex, '<span class="bible-reference">$&</span>');
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
 * Fetch and display a sermon transcript with translation
 */
async function fetchTranscript(videoId, startTime = 0) {
  try {
    // Show loading state
    const loadingElement = document.createElement('div');
    loadingElement.className = 'transcript-loading';
    loadingElement.textContent = translate('loading-transcript');
    
    // Find or create the transcript container for this source
    let transcriptContainer = document.getElementById(`transcript-${videoId}`);
    
    if (!transcriptContainer) {
      // If no container exists yet, create one
      transcriptContainer = document.createElement('div');
      transcriptContainer.id = `transcript-${videoId}`;
      transcriptContainer.className = 'transcript-container';
      transcriptContainer.style.display = 'block';
      
      // Find the source container to append to
      const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
      if (sourceContainer) {
        sourceContainer.appendChild(transcriptContainer);
      } else {
        console.error('Could not find source container for video ID:', videoId);
        return;
      }
    }
    
    // Clear and show loading
    transcriptContainer.innerHTML = '';
    transcriptContainer.appendChild(loadingElement);
    
    // Fetch the transcript from the API
    const response = await fetch(`${API_URL}/transcript/${videoId}?language=${currentLanguage}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': window.location.origin,
        'Accept-Language': currentLanguage
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove loading element
    loadingElement.remove();
    
    // Create transcript content
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'transcript-content';
    
    // Add search functionality
    const searchContainer = document.createElement('div');
    searchContainer.className = 'transcript-search';
    searchContainer.innerHTML = `
      <input type="text" placeholder="Search in transcript..." class="transcript-search-input">
      <button class="transcript-search-button">Search</button>
    `;
    
    // Add event listeners for search
    const searchInput = searchContainer.querySelector('.transcript-search-input');
    const searchButton = searchContainer.querySelector('.transcript-search-button');
    
    searchButton.addEventListener('click', () => {
      searchTranscript(searchInput.value, transcriptContent);
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchTranscript(searchInput.value, transcriptContent);
      }
    });
    
    // If the API returns formatted transcript with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      // Handle segmented transcript with timestamps
      data.segments.forEach(segment => {
        const segmentElement = document.createElement('div');
        segmentElement.className = 'transcript-segment';
        
        const timestampElement = document.createElement('span');
        timestampElement.className = 'transcript-timestamp';
        timestampElement.textContent = formatTimestamp(segment.start_time);
        
        const textElement = document.createElement('span');
        textElement.className = 'transcript-text';
        textElement.textContent = segment.text;
        
        // Apply highlighting to this segment if it contains our search terms
        segmentElement.setAttribute('data-time', segment.start_time);
        
        // Highlight the segment closest to our start time
        if (Math.abs(segment.start_time - startTime) < 5) {
          segmentElement.classList.add('transcript-highlight-segment');
        }
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        transcriptContent.appendChild(segmentElement);
      });
    } else if (data.transcript) {
      // Handle plain text transcript
      transcriptContent.innerHTML = data.transcript
        .split('\n\n') // Split paragraphs
        .map(para => `<p>${para}</p>`)
        .join('');
    } else {
      // Fallback
      transcriptContent.textContent = 'Transcript format not recognized.';
    }
    
    // Add timestamp navigation helper
    const timestampHelper = document.createElement('div');
    timestampHelper.className = 'transcript-timestamp-helper';
    timestampHelper.innerHTML = `
      <small>Click on timestamps to jump to that part of the sermon</small>
    `;
    
    // Add content to container
    transcriptContainer.appendChild(searchContainer);
    transcriptContainer.appendChild(timestampHelper);
    transcriptContainer.appendChild(transcriptContent);
    
    // Add timestamp click handling
    const timestamps = transcriptContainer.querySelectorAll('.transcript-timestamp');
    timestamps.forEach(timestamp => {
      timestamp.style.cursor = 'pointer';
      timestamp.setAttribute('title', 'Click to jump to this part of the sermon');
      
      timestamp.addEventListener('click', function() {
        const segment = this.closest('.transcript-segment');
        if (segment) {
          const time = segment.getAttribute('data-time');
          if (time) {
            // Find the YouTube embed and update its time
            const sourceContainer = transcriptContainer.closest('.source-container');
            if (sourceContainer) {
              // Make sure video is visible
              const videoEmbed = sourceContainer.querySelector('.video-embed');
              const watchButton = sourceContainer.querySelector('.watch-video-btn');
              
              if (videoEmbed && videoEmbed.style.display === 'none') {
                // Show the video if it's hidden
                videoEmbed.style.display = 'block';
                if (watchButton) {
                  watchButton.textContent = translate('hide-video');
                }
              }
              
              // Update iframe src to jump to timestamp
              const iframe = sourceContainer.querySelector('iframe');
              if (iframe) {
                const currentSrc = iframe.src;
                const baseUrl = currentSrc.split('?')[0];
                iframe.src = `${baseUrl}?start=${Math.floor(time)}`;
                
                // Scroll to make video visible
                videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            }
          }
        }
      });
    });
    
    // Scroll to highlighted segment if it exists
    const highlightedSegment = transcriptContainer.querySelector('.transcript-highlight-segment');
    if (highlightedSegment) {
      setTimeout(() => {
        highlightedSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    
  } catch (error) {
    console.error('Error fetching transcript:', error);
    
    // Show error in container
    const errorElement = document.createElement('div');
    errorElement.className = 'transcript-error';
    errorElement.textContent = `Could not load transcript: ${error.message}`;
    
    // Find the transcript container
    let transcriptContainer = document.getElementById(`transcript-${videoId}`);
    
    if (!transcriptContainer) {
      // If no container exists yet, create one
      transcriptContainer = document.createElement('div');
      transcriptContainer.id = `transcript-${videoId}`;
      transcriptContainer.className = 'transcript-container';
      
      // Find the source container to append to
      const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
      if (sourceContainer) {
        sourceContainer.appendChild(transcriptContainer);
      } else {
        console.error('Could not find source container for video ID:', videoId);
        return;
      }
    }
    
    transcriptContainer.innerHTML = '';
    transcriptContainer.appendChild(errorElement);
  }
}

/**
 * Search within a transcript and highlight matches
 */
function searchTranscript(query, transcriptContent) {
  if (!query || !transcriptContent) return;
  
  // Remove existing highlights
  const existingHighlights = transcriptContent.querySelectorAll('.transcript-highlight');
  existingHighlights.forEach(el => {
    const parent = el.parentNode;
    parent.replaceChild(document.createTextNode(el.textContent), el);
    // Normalize to combine adjacent text nodes
    parent.normalize();
  });
  
  if (!query.trim()) return;
  
  // Function to highlight matches in a text node
  function highlightMatches(textNode, regex) {
    const parent = textNode.parentNode;
    const content = textNode.textContent;
    
    let match;
    let lastIndex = 0;
    let hasMatches = false;
    
    // Create a document fragment to hold the new content
    const fragment = document.createDocumentFragment();
    
    // Find all matches in this text node
    while ((match = regex.exec(content)) !== null) {
      hasMatches = true;
      
      // Add the text up to this match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(
          content.substring(lastIndex, match.index)
        ));
      }
      
      // Create a highlight span for the match
      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'transcript-highlight';
      highlightSpan.textContent = match[0];
      fragment.appendChild(highlightSpan);
      
      // Update lastIndex
      lastIndex = regex.lastIndex;
    }
    
    // Add any remaining text
    if (lastIndex < content.length) {
      fragment.appendChild(document.createTextNode(
        content.substring(lastIndex)
      ));
    }
    
    // Only replace if we found matches
    if (hasMatches) {
      parent.replaceChild(fragment, textNode);
      return true;
    }
    
    return false;
  }
  
  // Create a case-insensitive regex for the search term
  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Process all text nodes in the transcript
  const walker = document.createTreeWalker(
    transcriptContent,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let node;
  let matchCount = 0;
  
  while (node = walker.nextNode()) {
    if (highlightMatches(node, regex)) {
      matchCount++;
    }
  }
  
  // Scroll to first highlight if any found
  const firstHighlight = transcriptContent.querySelector('.transcript-highlight');
  if (firstHighlight) {
    firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // Show match count
  const matchCountElement = document.createElement('div');
  matchCountElement.className = 'transcript-match-count';
  matchCountElement.textContent = matchCount > 0 
    ? `Found ${matchCount} matches` 
    : 'No matches found';
  
  // Replace existing count or add new one
  const existingCount = transcriptContent.parentNode.querySelector('.transcript-match-count');
  if (existingCount) {
    existingCount.replaceWith(matchCountElement);
  } else {
    transcriptContent.parentNode.insertBefore(matchCountElement, transcriptContent);
  }
}

/**
 * Toggle transcript visibility and load if needed
 */
function toggleTranscript(videoId, startTime = 0) {
  const transcriptContainer = document.getElementById(`transcript-${videoId}`);
  const button = document.querySelector(`.view-transcript-btn[onclick="toggleTranscript('${videoId}')"]`) ||
                document.querySelector(`.view-transcript-btn[onclick="toggleTranscript('${videoId}', ${startTime})"]`);
  
  if (!transcriptContainer) {
    // Transcript hasn't been loaded yet, fetch it
    fetchTranscript(videoId, startTime);
    // Update button text if found
    if (button) {
      button.textContent = translate('hide-transcript');
    }
    return;
  }
  
  // Toggle visibility
  const isHidden = transcriptContainer.style.display === 'none';
  transcriptContainer.style.display = isHidden ? 'block' : 'none';
  
  // Update button text
  if (button) {
    button.textContent = isHidden ? translate('hide-transcript') : translate('view-transcript');
  }
  
  // Scroll into view if showing
  if (isHidden) {
    setTimeout(() => {
      transcriptContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}