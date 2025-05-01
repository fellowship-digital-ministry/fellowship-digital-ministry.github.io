/**
 * search.js
 * Handles search functionality and conversation fallbacks
 */

// Topic categories to help classify questions
const SERMON_TOPICS = [
    "prayer", "faith", "forgiveness", "salvation", "holy spirit",
    "discipleship", "worship", "evangelism", "relationships", "suffering",
    "biblical interpretation", "theology", "christian living", "spiritual growth"
  ];
  
  // Spanish conversational fallbacks
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
  
  // Chinese conversational fallbacks
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
  
  /**
   * Extract topics from the query text
   * @param {string} text - Query text
   * @param {Array} topicList - List of topics to extract
   * @returns {Array} - Extracted topics
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
   * @param {Array} conversationHistory - Conversation history
   * @returns {Array} - Extracted topics
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @returns {string} - Fallback response
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @param {Array} queryTopics - Topics extracted from query
   * @param {Array} previousSermonTopics - Topics from previous sermon content
   * @returns {string} - Fallback strategy
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @returns {boolean} - True if query is a clarification question
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
    
    const patterns = clarificationPatterns[I18n.currentLanguage] || clarificationPatterns.en;
    const refPatterns = referencePatterns[I18n.currentLanguage] || referencePatterns.en;
    
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @returns {boolean} - True if query is a follow-up question
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
    
    const patterns = followUpPatterns[I18n.currentLanguage] || followUpPatterns.en;
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
   * @param {Array} conversationHistory - Conversation history
   * @returns {string|null} - Last sermon response
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @param {string} fallbackStrategy - Fallback strategy
   * @param {Array} queryTopics - Topics extracted from query
   * @param {Array} previousSermonTopics - Topics from previous sermon content
   * @returns {string} - Fallback response
   */
  function generateFallbackResponse(query, conversationHistory, fallbackStrategy, queryTopics, previousSermonTopics) {
    // First check if we have a language-specific message
    // For Spanish
    if (I18n.currentLanguage === 'es') {
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
    if (I18n.currentLanguage === 'zh') {
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
    
    // For English, generate specific responses
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @returns {string} - Clarification response
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
   * @param {string} query - User query
   * @param {Array} conversationHistory - Conversation history
   * @param {Array} queryTopics - Topics extracted from query
   * @returns {string} - Follow-up response
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
   * @param {string} query - User query
   * @param {Array} queryTopics - Topics extracted from query
   * @param {Array} previousSermonTopics - Topics from previous sermon content
   * @returns {string} - Response with related topics
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
   * @param {string} query - User query
   * @returns {string} - Search refinement response
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
   * @param {string} query - User query
   * @returns {string} - Generic fallback response
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
   * @param {Array} topics - Base topics
   * @returns {Array} - Related topics
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
   * Handle form submission for search
   * @param {Event} event - Form submit event
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
    UI.addMessage(query, 'user');
    
    // Add to conversation history
    API.addToConversationHistory('user', query);
    
    // Clear input field
    queryInput.value = '';
    
    // Add typing indicator
    const typingId = UI.addTypingIndicator();
    
    try {
      // Check API connection first
      const isConnected = await API.verifyApiConnection(false);
      
      if (!isConnected) {
        UI.removeMessage(typingId);
        UI.addMessage(`
          <div class="connection-error">
            <p>${I18n.translate('connection-error')}</p>
            <button class="retry-button">${I18n.translate('retry')}</button>
          </div>
        `, 'bot', true);
        
        // Add click handler for retry button
        document.querySelector('.retry-button').addEventListener('click', function() {
          API.verifyApiConnection(true);
        });
        
        return;
      }
      
      // Send request to API
      const data = await API.sendQuery(query);
      
      // Remove typing indicator
      UI.removeMessage(typingId);
      
      // Display AI response
      UI.displayAnswer(data);
      
    } catch (error) {
      console.error('Error:', error);
      
      // Remove typing indicator
      UI.removeMessage(typingId);
      
      // Show error message with retry option
      UI.addMessage(`
        <div class="error-container">
          <p>Sorry, there was an error processing your question (${error.message}).</p>
          <button class="retry-button">${I18n.translate('try-again')}</button>
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
  
  // Export Search module
  const Search = {
    handleSubmit,
    handleConversationFallback,
    extractTopics,
    generateRelatedTopics
  };