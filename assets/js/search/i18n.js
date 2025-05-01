/**
 * i18n.js
 * Handles internationalization and translations
 */

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
  
  // Bible reference regex for different languages
  const bibleRefRegexByLanguage = {
    en: /\b(Genesis|Exodus|Leviticus|Numbers|Deuteronomiy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Psalm|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation)\s+\d+(?::\d+(?:-\d+)?)?/gi,
    
    es: /\b(Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|1 Samuel|2 Samuel|1 Reyes|2 Reyes|1 Crónicas|2 Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Salmo|Proverbios|Eclesiastés|Cantares|Cantar de los Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías|Mateo|Marcos|Lucas|Juan|Hechos|Romanos|1 Corintios|2 Corintios|Gálatas|Efesios|Filipenses|Colosenses|1 Tesalonicenses|2 Tesalonicenses|1 Timoteo|2 Timoteo|Tito|Filemón|Hebreos|Santiago|1 Pedro|2 Pedro|1 Juan|2 Juan|3 Juan|Judas|Apocalipsis)\s+\d+(?::\d+(?:-\d+)?)?/gi,
    
    zh: /\b(创世记|出埃及记|利未记|民数记|申命记|约书亚记|士师记|路得记|撒母耳记上|撒母耳记下|列王纪上|列王纪下|历代志上|历代志下|以斯拉记|尼希米记|以斯帖记|约伯记|诗篇|箴言|传道书|雅歌|以赛亚书|耶利米书|耶利米哀歌|以西结书|但以理书|何西阿书|约珥书|阿摩司书|俄巴底亚书|约拿书|弥迦书|那鸿书|哈巴谷书|西番雅书|哈该书|撒迦利亚书|玛拉基书|马太福音|马可福音|路加福音|约翰福音|使徒行传|罗马书|哥林多前书|哥林多后书|加拉太书|以弗所书|腓立比书|歌罗西书|帖撒罗尼迦前书|帖撒罗尼迦后书|提摩太前书|提摩太后书|提多书|腓利门书|希伯来书|雅各书|彼得前书|彼得后书|约翰一书|约翰二书|约翰三书|犹大书|启示录)\s*\d+(?::\d+(?:-\d+)?)?/gi
  };
  
  // Current language
  let currentLanguage = 'en';
  
  // Translate a key to the current language
  function translate(key) {
    if (!translations[currentLanguage]) {
      return key;
    }
    
    return translations[currentLanguage][key] || key;
  }
  
  // Get appropriate Bible reference regex for current language
  function getBibleReferenceRegexForLanguage() {
    return bibleRefRegexByLanguage[currentLanguage] || bibleRefRegexByLanguage.en;
  }
  
  // Change the interface language
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
    
    // Event for other modules to respond to language change
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: currentLanguage }
    }));
    
    return currentLanguage;
  }
  
  // Highlight Bible references in text
  function highlightBibleReferences(text) {
    // Use the appropriate regex based on current language
    const regex = getBibleReferenceRegexForLanguage();
    
    return text.replace(regex, '<span class="bible-reference">$&</span>');
  }
  
  // Format text (e.g., highlight Bible references)
  function formatText(text) {
    if (!text) return '';
    // First escape HTML
    text = Utils.escapeHTML(text);
    // Then highlight Bible references
    return highlightBibleReferences(text);
  }
  
  // Export the i18n module
  const I18n = {
    translate,
    changeLanguage,
    highlightBibleReferences,
    formatText,
    getBibleReferenceRegexForLanguage,
    get currentLanguage() { return currentLanguage; },
    bibleWebsites
  };