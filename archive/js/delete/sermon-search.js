/**
 * Enhanced Multilingual Sermon Search with Conversation Memory
 * Supports English, Spanish, and Chinese
 * Improved for better user experience across devices
 */

// API Configuration
const API_URL = '{{ site.api_url }}' || 'https://sermon-search-api-8fok.onrender.com';

// Safely get DOM elements with error handling
function safeGetElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.warn(`Element with ID '${id}' not found`);
  }
  return element;
}

// DOM Elements - Using safe getter
const chatForm = safeGetElement('chatForm');
const queryInput = safeGetElement('queryInput');
const messagesContainer = safeGetElement('messages');
const apiStatusBanner = safeGetElement('api-status-banner');
const apiStatusMessage = safeGetElement('api-status-message');
const retryConnectionButton = safeGetElement('retry-connection');
const languageSelect = safeGetElement('languageSelect');
const clearConversationBtn = safeGetElement('clearConversation');

// Bible reference regex for different languages
const bibleRefRegexByLanguage = {
  en: /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi,
  
  es: /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi,
  
  zh: /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi
};

// Get appropriate Bible reference regex for current language
function getBibleReferenceRegexForLanguage() {
  return bibleRefRegexByLanguage[currentLanguage] || bibleRefRegexByLanguage.en;
}

// Translations - Same as original code
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
    "example-1": "How does a person get to heaven?",
    "example-2": "What is the Trinity?",
    "example-3": "How should Christians live?",
    "example-4": "Why read the King James Bible?",
    "example-5": "Who is Melchizedek?",
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
    "example-1": "¿Cómo puede una persona ir al cielo?",
    "example-2": "¿Qué es la Trinidad?",
    "example-3": "¿Cómo deben vivir los cristianos?",
    "example-4": "¿Por qué leer la Biblia Reina Valera?",
    "example-5": "¿Quién es Melquisedec?",
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
    "example-1": "一个人如何才能上天堂？",
    "example-2": "三位一体是什么？",
    "example-3": "基督徒应该如何生活？",
    "example-4": "为什么要读钦定版圣经？",
    "example-5": "麦基洗德是谁？",
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

// Bible website configurations for different languages
const bibleWebsites = {
  en: {
    site: "https://www.biblegateway.com/passage/",
    version: "KJV"
  },
  es: {
    site: "https://www.biblegateway.com/passage/",
    version: "RVR1960"
  },
  zh: {
    site: "https://www.biblegateway.com/passage/",
    version: "CUVS"
  }
};

// Spanish conversational fallbacks - Same as original code
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

// Chinese conversational fallbacks - Same as original code
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

// Add global error handler
window.addEventListener('error', function(event) {
  console.error('Global error caught:', event.error);
  
  // Try to show error in the UI if possible
  if (messagesContainer) {
    const errorMsg = `
      <div class="error-container">
        <p>A script error occurred: ${event.error.message}. Try refreshing the page.</p>
      </div>
    `;
    
    try {
      addMessage(errorMsg, 'bot', true);
    } catch (e) {
      console.error('Could not display error message:', e);
    }
  }
  
  // Prevent the error from causing more issues
  event.preventDefault();
});

// Enable textarea auto-resize
function enableTextareaAutoResize() {
  if (queryInput && queryInput.tagName === 'TEXTAREA') {
    // Auto-resize functionality for the textarea
    queryInput.addEventListener('input', function() {
      this.style.height = 'auto';
      const maxHeight = 120; // Maximum height before scrollbar appears
      const newHeight = Math.min(this.scrollHeight, maxHeight);
      this.style.height = newHeight + 'px';
    });
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing sermon search...');
  
  // Check if the form exists on this page before attaching events
  if (chatForm) {
    console.log('Chat form found, adding event listeners');
    
    chatForm.addEventListener('submit', function(event) {
      try {
        handleSubmit(event);
      } catch (error) {
        console.error('Error in form submission handler:', error);
        if (messagesContainer) {
          // Show error to user
          const errorMsg = `
            <div class="error-container">
              <p>Sorry, an error occurred: ${error.message}</p>
            </div>
          `;
          addMessage(errorMsg, 'bot', true);
        }
      }
    });
    
    if (queryInput) {
      // Set a static placeholder instead of cycling
      queryInput.placeholder = "Ask a question about the sermons...";
      
      // Enable textarea auto-resize
      enableTextareaAutoResize();
      
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
  if (queryInput) {
    // Clear existing interval if any
    if (queryInput.dataset.cycleInterval && queryInput.dataset.cycleInterval !== 'null') {
      clearInterval(parseInt(queryInput.dataset.cycleInterval));
    }
    // Set static placeholder with translated text
    queryInput.placeholder = translate('what-does-pastor-teach');
  }
  
  // Update welcome message if it exists - Try to update existing welcome message
  if (isFirstLoad) {
    displayWelcomeMessage();
  } else {
    // Try to update existing content without clearing conversation
    const welcomeTitle = document.querySelector('.welcome-message h4');
    const welcomeIntro = document.querySelector('.welcome-message p:first-of-type');
    const suggestionHeading = document.querySelector('.suggestion-heading');
    
    if (welcomeTitle) welcomeTitle.textContent = translate('welcome-title');
    if (welcomeIntro) welcomeIntro.textContent = translate('welcome-intro');
    if (suggestionHeading) suggestionHeading.textContent = translate('suggestion-heading');
    
    // Update suggestion chips text
    document.querySelectorAll('.suggestion-chip').forEach((chip, index) => {
      if (index < sampleQueries.length) {
        const translatedQuery = translate(sampleQueries[index]);
        chip.textContent = translatedQuery;
        chip.setAttribute('data-query', translatedQuery);
      }
    });
  }
  
  // Update any Bible references in existing messages
  updateBibleReferencesForLanguage();
}

/**
 * Update Bible references when language changes
 */
function updateBibleReferencesForLanguage() {
  // Get all bot messages
  const botMessages = document.querySelectorAll('.message.bot:not(.typing-indicator)');
  
  botMessages.forEach(message => {
    // Find all Bible references in this message
    const bibleRefs = message.querySelectorAll('.bible-reference');
    
    bibleRefs.forEach(ref => {
      // Get current text
      const currentReference = ref.textContent.trim();
      
      // Update the click handler to use the current language
      ref.addEventListener('click', function() {
        // Open Bible reference in a Bible website with current language
        const bibleConfig = bibleWebsites[currentLanguage] || bibleWebsites.en;
        window.open(`${bibleConfig.site}?search=${encodeURIComponent(currentReference)}&version=${bibleConfig.version}`, '_blank');
      });
    });
  });
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
 * Format the text with markdown-like syntax - IMPROVED VERSION for multilingual
 */
function formatResponse(text) {
  if (!text) return '';
  
  // Convert line breaks to HTML breaks for proper rendering
  text = text.replace(/\n/g, '<br>');
  
  // Replace section headers (text between ** **)
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Format numbered lists (more robust pattern)
  text = text.replace(/(\d+\.\s+)([^\n<]+)(<br>|$)/g, '<div class="list-item"><span class="list-number">$1</span>$2</div>$3');
  
  // Highlight Bible references with the appropriate language regex
  const regex = getBibleReferenceRegexForLanguage();
  text = text.replace(regex, '<span class="bible-reference">$&</span>');
  
  // Wrap paragraphs in <p> tags, but not if they're already in a div or other block element
  text = text.replace(/(^|<\/div>)([^<]+)(<br>|$)/g, '$1<p>$2</p>$3');
  
  // Clean up any extra <br> tags after </p> tags
  text = text.replace(/<\/p><br>/g, '</p>');
  
  return text;
}

/**
 * Add a message to the chat - IMPROVED VERSION with Bible reference handling
 */
function addMessage(text, sender, isError = false) {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${sender}`;
  messageElement.id = 'msg-' + Date.now(); // Add an ID to each message for reference
  
  if (isError) {
    messageElement.classList.add('error');
  }
  
  // For bot messages, apply formatting
  if (sender === 'bot') {
    if (text.startsWith('<div class="welcome-message">') || 
        text.startsWith('<div class="error-container">') ||
        text.startsWith('<div class="connection-error">')) {
      // For pre-formatted HTML content, use it directly
      messageElement.innerHTML = text;
    } else {
      // For regular text responses, apply the formatting
      const formattedText = formatResponse(text);
      messageElement.innerHTML = formattedText;
    }
    
    // Make all links open in new tab
    const links = messageElement.querySelectorAll('a');
    links.forEach(link => {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
      }
    });
    
    // Make Bible references clickable
    setupBibleReferenceClicks(messageElement);
    
  } else {
    // For user messages, use text content for safety
    messageElement.textContent = text;
  }
  
  messagesContainer.appendChild(messageElement);
  
  // Scroll to the bottom
  smoothScrollToBottom(messagesContainer);
  
  return messageElement;
}

/**
 * Setup Bible reference clicks for a DOM element
 */
function setupBibleReferenceClicks(element) {
  if (!element) return;
  
  const bibleRefs = element.querySelectorAll('.bible-reference');
  
  bibleRefs.forEach(ref => {
    ref.addEventListener('click', function() {
      const reference = this.textContent.trim();
      const bibleConfig = bibleWebsites[currentLanguage] || bibleWebsites.en;
      
      window.open(`${bibleConfig.site}?search=${encodeURIComponent(reference)}&version=${bibleConfig.version}`, '_blank');
    });
  });
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
      
      // Verify the date is valid
      if (isNaN(date.getTime())) {
        return 'Date unknown';
      }
      
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle ISO date strings (YYYY-MM-DD)
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const date = new Date(dateStr);
      
      // Verify the date is valid
      if (isNaN(date.getTime())) {
        return 'Date unknown';
      }
      
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Handle timestamp (milliseconds since epoch)
    if (typeof dateStr === 'number') {
      const date = new Date(dateStr);
      
      // Verify the date is valid
      if (isNaN(date.getTime())) {
        return 'Date unknown';
      }
      
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // For any other format, try a direct Date parsing as last resort
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(currentLanguage, {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      }).format(date);
    }
    
    // Return as is if we can't parse it
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
  
  // Remove quotes that might be in the title
  return title.replace(/^["']|["']$/g, '');
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
 * Topic categories to help classify questions
 */
const SERMON_TOPICS = [
  "prayer", "faith", "forgiveness", "salvation", "holy spirit",
  "discipleship", "worship", "evangelism", "relationships", "suffering",
  "biblical interpretation", "theology", "christian living", "spiritual growth"
];

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
  
  const patterns = clarificationPatterns[currentLanguage] || clarificationPatterns.en;
  const refPatterns = referencePatterns[currentLanguage] || referencePatterns.en;
  
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
  
  const patterns = followUpPatterns[currentLanguage] || followUpPatterns.en;
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
  if (currentLanguage === 'es') {
    switch (fallbackStrategy) {
      case "clarify_previous":
        return spanishFallbacks.clarify_previous;
      case "follow_up":
        return spanishFallbacks.follow_up;
      case "suggest_related":
        return spanishFallbacks.suggest_related;
      case "refine_search":
        return spanishFallbacks.refine_search;
      default:
        return spanishFallbacks.generic;
    }
  }
  
  // For Chinese
  if (currentLanguage === 'zh') {
    switch (fallbackStrategy) {
      case "clarify_previous":
        return chineseFallbacks.clarify_previous;
      case "follow_up":
        return chineseFallbacks.follow_up;
      case "suggest_related":
        return chineseFallbacks.suggest_related;
      case "refine_search":
        return chineseFallbacks.refine_search;
      default:
        return chineseFallbacks.generic;
    }
  }
  
  // For English, we use the original implementation
  let response = "";
  
  switch (fallbackStrategy) {
    case "clarify_previous":
      response = generateClarificationResponse(query, conversationHistory);
      break;
    case "follow_up":
      response = generateFollowUpResponse(query, conversationHistory, queryTopics);
      break;
    case "suggest_related":
      response = generateRelatedTopicsResponse(query, queryTopics, previousSermonTopics);
      break;
    case "refine_search":
      response = generateSearchRefinementResponse(query);
      break;
    default:
      response = generateGenericFallbackResponse(query);
  }
  
  return response;
}

/**
 * Generate a response to clarify previous content
 */
function generateClarificationResponse(query, conversationHistory) {
  const lastResponse = findLastSermonResponse(conversationHistory);
  if (!lastResponse) {
    return generateGenericFallbackResponse(query);
  }
  
  // Extract topic of the clarification
  const topics = extractTopics(query, SERMON_TOPICS);
  let topicPhrase = topics.length > 0 ? 
    `about ${topics.join(" and ")}` : 
    "on that topic";
  
  return `I don't have specific sermon content that addresses your question ${topicPhrase}. 

From the previous sermon content we discussed, the pastor focused more on the practical application rather than detailed explanations. Would you like me to suggest a different aspect of this topic that might be covered in the sermons? Or perhaps you could rephrase your question to focus on a specific biblical passage or practical application?`;
}

/**
 * Generate a response that follows up on previous content
 */
function generateFollowUpResponse(query, conversationHistory, queryTopics) {
  // Get topic from query or from previous conversation
  const topicPhrase = queryTopics.length > 0 ? 
    queryTopics.join(" and ") : 
    "that specific aspect";
  
  return `I couldn't find sermon content that specifically addresses ${topicPhrase} in relation to your follow-up question. 

The pastor may have covered this in other sermons not in our current database. Would you like me to help you explore a related topic that is covered in the sermons? For example, I could search for sermon content about the biblical foundations or practical applications related to this topic.`;
}

/**
 * Generate a response suggesting related topics
 */
function generateRelatedTopicsResponse(query, queryTopics, previousSermonTopics) {
  // Combine query topics with previous topics, removing duplicates
  const allTopics = [...new Set([...queryTopics, ...previousSermonTopics])];
  
  // Generate related topics based on current topics
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
  
  return `I couldn't find sermon content that directly addresses your question about ${queryTopics.join(" and ")}. 

The pastor may have discussed this in other sermons or from a different perspective than how you phrased your question. ${suggestionsText}

Would you like me to search for any of these related topics?`;
}

/**
 * Generate a response suggesting search refinement
 */
function generateSearchRefinementResponse(query) {
  return `I couldn't find sermon content that directly answers your question. The pastor may have addressed this topic using different terminology or approached it from a different angle.

To help me find relevant sermon content, you could:
- Try using more specific biblical terms
- Mention a Bible passage you're interested in
- Ask about practical application of a spiritual principle
- Focus on a specific aspect of Christian living

Would you like me to help you rephrase your question?`;
}

/**
 * Generate a generic fallback response when other strategies don't apply
 */
function generateGenericFallbackResponse(query) {
  return `I don't have sermon content that directly addresses your question. However, I'd be happy to help you explore other topics from the pastor's teachings.

Here are some topics that are well-covered in the sermon database:
- Prayer and communication with God
- Faith and trust in difficult times
- Biblical interpretation and understanding
- Practical Christian living

Would you like me to search for sermon content on any of these topics instead?`;
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
    // Add more relationships as needed
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

/**
 * Display the answer and sources from the API - With conversation fallback
 */
function displayAnswer(data) {
  if (!data || !data.answer) {
    console.error('Invalid data received from API');
    addMessage("Sorry, I received an invalid response from the API. Please try again.", 'bot');
    return;
  }
  
  // Check if there are any sermon sources
  const hasSermonContent = data.sources && data.sources.length > 0;
  
  // If no sermon content was found but we have conversation history
  if (!hasSermonContent && data.answer.includes(translate('no-results')) && conversationHistory.length > 0) {
    
    // Generate a conversational response instead
    const conversationalResponse = handleConversationFallback(
      data.query, 
      conversationHistory
    );
    
    // Display the conversational response
    const messageElement = addMessage(conversationalResponse, 'bot');
    messageElement.classList.add('conversation-mode'); // Add this class to style conversation mode differently if desired
    
    // Add to conversation history
    conversationHistory.push({ 
      role: 'assistant', 
      content: conversationalResponse 
    });
    
    return;
  }
  
  // Regular processing for when sermon content is found
  const messageElement = addMessage(data.answer, 'bot');
  
  // Display sources if available
  if (hasSermonContent) {
    try {
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
      if (messageElement && messageElement.parentNode) {
        messageElement.parentNode.insertBefore(sourcesContainer, messageElement.nextSibling);
      } else {
        console.warn('Could not find messageElement parent for sources, adding to messages container');
        messagesContainer.appendChild(sourcesContainer);
      }
      
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
      
      // Add to conversation history
      conversationHistory.push({ role: 'assistant', content: data.answer });
      
    } catch (error) {
      console.error('Error displaying sources:', error);
      // Continue without displaying sources
      
      // Still add to conversation history
      conversationHistory.push({ role: 'assistant', content: data.answer });
    }
  }
}

// Make global functions available to be called from HTML
window.toggleVideo = toggleVideo;
window.toggleTranscript = toggleTranscript;

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
  
  // Handle date formatting properly
  let formattedDate = 'Date unknown';
  if (source.publish_date) {
    formattedDate = formatSermonDate(source.publish_date);
  }
  
  // Create collapsed view first (default)
  sourceElement.innerHTML = `
    <div class="source-header">
      <div class="source-title">${escapeHTML(formattedTitle)}</div>
      <div class="source-date">${formattedDate}</div>
    </div>
    <div class="source-text">"${formatText(source.text.substring(0, 200))}${source.text.length > 200 ? '...' : ''}"</div>
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
      <iframe src="${videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    </div>
  `;
  
  return sourceElement;
}

/**
 * Download transcript as a text file with proper sermon title
 */
function downloadTranscript(videoId, segments) {
  if (!segments || !segments.length) return;
  
  // Try to find the sermon title
  const sourceContainer = document.querySelector(`.source-container[data-video-id="${videoId}"]`);
  let sermonTitle = "Unknown Sermon";
  
  if (sourceContainer) {
    const titleElement = sourceContainer.querySelector('.source-title');
    if (titleElement) {
      sermonTitle = titleElement.textContent.trim();
    }
  }
  
  // Create the text content with proper title
  let textContent = `${sermonTitle} (ID: ${videoId})\n\n`;
  
  segments.forEach(segment => {
    if (segment.is_gap) {
      textContent += '[...]\n\n';
    } else {
      textContent += `[${formatTimestamp(segment.start_time)}] ${segment.text}\n\n`;
    }
  });
  
  // Create a blob with the text content
  const blob = new Blob([textContent], { type: 'text/plain' });
  
  // Create an object URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sermonTitle.replace(/[^\w\s-]/g, '')}-transcript.txt`;
  
  // Append the link to the body, click it, and then remove it
  document.body.appendChild(a);
  a.click();
  
  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
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
    // Use the appropriate regex based on current language
    const regex = getBibleReferenceRegexForLanguage();
    
    // Simply wrap matches in a span with bible-reference class
    return text.replace(regex, '<span class="bible-reference">$&</span>');
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
    
    console.log(`Fetching transcript for video ${videoId} with language ${currentLanguage}`);
    
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
      throw new Error(`Failed to fetch transcript: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Received transcript data:', data);
    
    // Remove loading element
    loadingElement.remove();
    
    // Create transcript content
    const transcriptContent = document.createElement('div');
    transcriptContent.className = 'transcript-content';
    
    // If there's a note (like language unavailability), display it
    if (data.note) {
      const noteElement = document.createElement('div');
      noteElement.className = 'transcript-note';
      noteElement.innerHTML = `<p><em>${data.note}</em></p>`;
      transcriptContainer.appendChild(noteElement);
    }
    
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
    
    // Add download transcript option
    const downloadButton = document.createElement('button');
    downloadButton.className = 'transcript-download-button';
    downloadButton.textContent = 'Download Transcript';
    downloadButton.addEventListener('click', () => {
      downloadTranscript(videoId, data.segments);
    });
    searchContainer.appendChild(downloadButton);
    
    // If the API returns segments with timestamps
    if (data.segments && Array.isArray(data.segments)) {
      // Add transcript info
      const infoElement = document.createElement('div');
      infoElement.className = 'transcript-info';
      infoElement.innerHTML = `<p>Full transcript (${data.total_segments} segments)</p>`;
      transcriptContainer.appendChild(infoElement);
      
      // Handle segmented transcript with timestamps
      data.segments.forEach(segment => {
        const segmentElement = document.createElement('div');
        
        // Check if this is a gap segment
        if (segment.is_gap) {
          segmentElement.className = 'transcript-gap';
          segmentElement.innerHTML = '<span class="transcript-gap-indicator">[...]</span>';
          transcriptContent.appendChild(segmentElement);
          return;
        }
        
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
        if (Math.abs(segment.start_time - startTime) < 10) {
          segmentElement.classList.add('transcript-highlight-segment');
        }
        
        segmentElement.appendChild(timestampElement);
        segmentElement.appendChild(textElement);
        transcriptContent.appendChild(segmentElement);
      });
    } else if (data.transcript) {
      // Handle plain text transcript (fallback)
      transcriptContent.innerHTML = data.transcript
        .split('\n\n') // Split paragraphs
        .map(para => `<p>${para}</p>`)
        .join('');
    } else {
      // Fallback for unexpected format
      transcriptContent.innerHTML = '<p>Transcript is available but in an unexpected format. Please try again later.</p>';
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
    
    // Add retry button
    const retryButton = document.createElement('button');
    retryButton.className = 'retry-button';
    retryButton.textContent = translate('retry');
    retryButton.onclick = () => fetchTranscript(videoId, startTime);
    transcriptContainer.appendChild(retryButton);
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
  let firstMatchNode = null;
  
  while (node = walker.nextNode()) {
    if (highlightMatches(node, regex)) {
      matchCount++;
      if (!firstMatchNode) {
        firstMatchNode = node.parentNode;
      }
    }
  }
  
  // Scroll to first highlight if any found
  if (firstMatchNode) {
    firstMatchNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  try {
    if (!videoId) {
      console.error('Invalid videoId for toggleTranscript');
      return;
    }
    
    const transcriptContainer = document.getElementById(`transcript-${videoId}`);
    const button = document.querySelector(`.view-transcript-btn[onclick*="toggleTranscript('${videoId}')"]`);
    
    if (!transcriptContainer) {
      // Transcript hasn't been loaded yet, fetch it
      fetchTranscript(videoId, startTime);
      // Update button text if found
      if (button) {
        button.textContent = typeof translate === 'function' ? 
          translate('hide-transcript') : 'Hide Transcript';
      }
      return;
    }
    
    // Toggle visibility
    const isHidden = transcriptContainer.style.display === 'none';
    transcriptContainer.style.display = isHidden ? 'block' : 'none';
    
    // Update button text
    if (button) {
      const hideText = typeof translate === 'function' ? translate('hide-transcript') : 'Hide Transcript';
      const showText = typeof translate === 'function' ? translate('view-transcript') : 'View Transcript';
      button.textContent = isHidden ? hideText : showText;
    }
    
    // Scroll into view if showing
    if (isHidden) {
      setTimeout(() => {
        transcriptContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  } catch (error) {
    console.error('Error in toggleTranscript:', error);
  }
}

/**
 * Toggle video display
 */
function toggleVideo(button) {
  try {
    if (!button || !button.parentElement) {
      console.error('Invalid button element for toggleVideo');
      return;
    }
    
    const videoEmbed = button.parentElement.nextElementSibling;
    if (!videoEmbed || !videoEmbed.classList.contains('video-embed')) {
      console.error('Could not find video embed element');
      return;
    }
    
    const isHidden = videoEmbed.style.display === 'none';
    
    // Toggle the video display
    videoEmbed.style.display = isHidden ? 'block' : 'none';
    
    // Update the button text safely
    const hideText = typeof translate === 'function' ? translate('hide-video') : 'Hide Video';
    const showText = typeof translate === 'function' ? translate('watch-video') : 'Watch Video';
    button.textContent = isHidden ? hideText : showText;
    
    // Scroll to make video visible if showing
    if (isHidden) {
      setTimeout(() => {
        videoEmbed.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  } catch (error) {
    console.error('Error in toggleVideo:', error);
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
  
  // Reset textarea height
  if (queryInput.tagName === 'TEXTAREA') {
    queryInput.style.height = 'auto';
  }
  
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
    
    // Create API request payload with language
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
    
    // Send language in both header and payload
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
    
    // Display AI response (with conversation fallback if needed)
    displayAnswer(data);
    
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