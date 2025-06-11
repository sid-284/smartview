// Global variable to store current product information for Gemini context
let currentProductInfo = null;

// Store for products to compare
let productsToCompare = [];
const MAX_COMPARE_PRODUCTS = 10; // Maximum products to keep in the list

// Currently selected products for comparison
let selectedProductsForCompare = [];
const MAX_SELECTED_PRODUCTS = 5; // Increase from 2 to 5 products for comparison

// Current comparison product IDs
let currentComparisonIds = [];

// Theme functionality
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update theme attribute
    html.setAttribute('data-theme', newTheme);
    
    // Update toggle buttons
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
        toggle.setAttribute('data-theme', newTheme);
    });
    
    // Store preference in localStorage
    localStorage.setItem('theme', newTheme);
}

// Check for saved theme preference
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        const html = document.documentElement;
        html.setAttribute('data-theme', savedTheme);
        
        // Update toggle buttons
        const toggles = document.querySelectorAll('.theme-toggle');
        toggles.forEach(toggle => {
            toggle.setAttribute('data-theme', savedTheme);
        });
    }
}

// Function to show a specific page and hide others
// This is now a basic placeholder function that gets overridden by
// the PageTransitionManager in animations.js
function showPage(pageId) {
    // This function is overridden by our animation manager
    // The implementation below is just a fallback in case animations fail

    // Hide all pages
    document.getElementById('welcome-page').classList.add('hidden');
    document.getElementById('analyzer-page').classList.add('hidden');
    document.getElementById('comparison-page').classList.add('hidden');
    document.getElementById('chatbot-page').classList.add('hidden');
    
    // Show the selected page
    document.getElementById(`${pageId}-page`).classList.remove('hidden');
    
    // Close mobile menu if open
    document.getElementById('mobileMenu').classList.add('hidden');
}

// Function to add the current product to comparison and go to compare page
function addProductToCompareAndGoToCompare() {
    if (currentProductInfo) {
        // Make sure the product is selected for comparison
        const isSelected = selectedProductsForCompare.some(p => p.product_id === currentProductInfo.product_id);
        if (!isSelected) {
            toggleProductSelection(currentProductInfo.product_id);
        }
        
        // Switch to comparison page
        showPage('comparison');
    }
}

// Initialize mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    // Load theme preference
    loadThemePreference();
    
    // Show welcome page by default
    showPage('welcome');
});

async function scrapeProduct() {
    let productName = document.getElementById('productName').value.trim();
    if (!productName) {
        showError('Please enter a product name or URL');
        return;
    }

    // Handle special case where URL starts with @
    if (productName.startsWith('@')) {
        productName = productName.substring(1);
    }

    // Show loading state
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('comparisonResults').classList.add('hidden');

    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_name: productName })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch product information');
        }

        // Store the product info for Gemini context
        currentProductInfo = data;
        
        // Add to products to compare list
        addProductToCompareList(data);
        
        displayResults(data);
    } catch (error) {
        showError(error.message);
    } finally {
        document.getElementById('loading').classList.add('hidden');
    }
}

function displayResults(data) {
    // Product Details
    document.getElementById('productNameResult').textContent = data['Product Name'];
    document.getElementById('priceResult').textContent = data['Price'];
    document.getElementById('ratingResult').textContent = data['Rating'];
    document.getElementById('numReviewsResult').textContent = data['Number of Reviews'];
    document.getElementById('availabilityResult').textContent = data['Availability'];
    
    // Set product image
    const imageElem = document.getElementById('productImage');
    if (data['Image URL'] && data['Image URL'] !== 'N/A') {
        imageElem.src = data['Image URL'];
        imageElem.classList.remove('hidden');
    } else {
        imageElem.src = '';
        imageElem.classList.add('hidden');
    }
    
    // Display product description
    document.getElementById('productDescription').innerHTML = formatDescription(data['Detailed Description']);

    // Sentiment Analysis
    const sentiment = data['Sentiment Analysis'];
    
    // Add animation class to summaries to indicate they're AI-generated
    document.getElementById('overallSummary').classList.add('ai-generated');
    document.getElementById('positiveSummary').classList.add('ai-generated');
    document.getElementById('negativeSummary').classList.add('ai-generated');
    document.getElementById('neutralSummary').classList.add('ai-generated');
    
    // Overall Summary
    document.getElementById('overallSummary').textContent = sentiment.summaries.overall;
    
    // Sentiment percentages with fallbacks
    const positivePercent = sentiment.sentiment_percentages.POSITIVE || 0;
    const negativePercent = sentiment.sentiment_percentages.NEGATIVE || 0;
    const neutralPercent = sentiment.sentiment_percentages.NEUTRAL || 0;
    
    // Update sentiment percentages display
    document.getElementById('positivePercent').textContent = `${positivePercent.toFixed(1)}%`;
    document.getElementById('negativePercent').textContent = `${negativePercent.toFixed(1)}%`;
    document.getElementById('neutralPercent').textContent = `${neutralPercent.toFixed(1)}%`;
    
    // Update sentiment bars
    document.getElementById('positiveBar').style.width = `${positivePercent}%`;
    document.getElementById('negativeBar').style.width = `${negativePercent}%`;
    document.getElementById('neutralBar').style.width = `${neutralPercent}%`;
    
    // Review Summaries
    document.getElementById('positiveSummary').textContent = sentiment.summaries.positive;
    document.getElementById('negativeSummary').textContent = sentiment.summaries.negative;
    document.getElementById('neutralSummary').textContent = sentiment.summaries.neutral;

    // Show results
    document.getElementById('results').classList.remove('hidden');

    // Get product recommendations
    getProductRecommendations();
}

function formatDescription(description) {
    if (!description) return "No description available";
    
    // Replace newlines with <br> tags
    let formatted = description.replace(/\n/g, '<br>');
    
    // Convert markdown-style headers to HTML (avoid ** formatting)
    formatted = formatted.replace(/## (.*?)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/# (.*?)$/gm, '<h2>$1</h2>');
    
    // Replace markdown bold with HTML strong (avoid ** rendering issues)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Replace markdown italic with HTML em
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return formatted;
}

function addProductToCompareList(product) {
    // Check if product already exists in the list
    const existingIndex = productsToCompare.findIndex(p => p.product_id === product.product_id);
    if (existingIndex !== -1) {
        // Update existing product
        productsToCompare[existingIndex] = product;
    } else {
        // Add new product
        productsToCompare.push(product);
        
        // Keep only the most recent MAX_COMPARE_PRODUCTS
        if (productsToCompare.length > MAX_COMPARE_PRODUCTS) {
            productsToCompare.shift(); // Remove oldest product
        }
    }
    
    // Update the compare list UI
    updateCompareList();
}

function updateCompareList() {
    const listElement = document.getElementById('productCompareList');
    
    if (productsToCompare.length === 0) {
        listElement.innerHTML = '<p class="text-gray-400 text-sm">Search for products to compare them</p>';
        document.getElementById('compareButton').disabled = true;
        document.getElementById('compareButton').classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }
    
    // Clear the list
    listElement.innerHTML = '';
    
    // Add each product
    productsToCompare.forEach(product => {
        const isSelected = selectedProductsForCompare.some(p => p.product_id === product.product_id);
        
        const itemElement = document.createElement('div');
        itemElement.className = `product-compare-item ${isSelected ? 'selected' : ''}`;
        itemElement.dataset.productId = product.product_id;
        
        itemElement.innerHTML = `
            <div class="flex-1">
                <div class="font-medium text-white">${product['Product Name'].substring(0, 50)}${product['Product Name'].length > 50 ? '...' : ''}</div>
                <div class="text-sm text-gray-400">${product['Price']} | ${product['Rating']}</div>
            </div>
            <div class="flex items-center">
                <button class="mr-3 px-2 py-1 bg-gray-700 hover:bg-blue-700 text-xs rounded text-white" onclick="toggleProductSelection('${product.product_id}')">
                    ${isSelected ? '<i class="fas fa-check mr-1"></i>Selected' : '<i class="fas fa-plus mr-1"></i>Select'}
                </button>
                <button class="text-gray-400 hover:text-red-400" onclick="removeProductFromCompare('${product.product_id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Add click handler for the whole item (except buttons)
        itemElement.addEventListener('click', (e) => {
            // Only trigger if the click is not on a button
            if (!e.target.closest('button')) {
                toggleProductSelection(product.product_id);
            }
        });
        
        listElement.appendChild(itemElement);
    });
    
    // Add selection counter
    const selectionCounter = document.createElement('div');
    selectionCounter.className = 'mt-3 mb-2 text-sm';
    selectionCounter.innerHTML = `<span class="text-blue-400 font-medium">${selectedProductsForCompare.length} of ${MAX_SELECTED_PRODUCTS}</span> products selected`;
    listElement.appendChild(selectionCounter);
    
    // Enable/disable compare button based on selected products
    const compareButton = document.getElementById('compareButton');
    if (selectedProductsForCompare.length >= 2) {
        compareButton.disabled = false;
        compareButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        compareButton.disabled = true;
        compareButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    // Update button text to show how many products are being compared
    if (selectedProductsForCompare.length > 0) {
        compareButton.innerHTML = `<i class="fas fa-balance-scale mr-2"></i>Compare ${selectedProductsForCompare.length} Selected Products`;
    } else {
        compareButton.innerHTML = `<i class="fas fa-balance-scale mr-2"></i>Compare Selected Products`;
    }
    
    // Add selection instructions if needed
    if (productsToCompare.length >= 2 && selectedProductsForCompare.length < 2) {
        const instructionElement = document.createElement('p');
        instructionElement.className = 'text-blue-400 text-sm mt-2';
        instructionElement.innerHTML = `<i class="fas fa-info-circle mr-1"></i> Please select at least 2 products to compare`;
        listElement.appendChild(instructionElement);
    }
}

function toggleProductSelection(productId) {
    const product = productsToCompare.find(p => p.product_id === productId);
    if (!product) return;
    
    const isAlreadySelected = selectedProductsForCompare.some(p => p.product_id === productId);
    
    if (isAlreadySelected) {
        // Remove from selection
        selectedProductsForCompare = selectedProductsForCompare.filter(p => p.product_id !== productId);
    } else {
        // Add to selection if we haven't reached the maximum
        if (selectedProductsForCompare.length < MAX_SELECTED_PRODUCTS) {
            selectedProductsForCompare.push(product);
        } else {
            // Show error message that max products are selected
            showError(`You can select a maximum of ${MAX_SELECTED_PRODUCTS} products for comparison`);
        }
    }
    
    updateCompareList();
}

function removeProductFromCompare(productId) {
    productsToCompare = productsToCompare.filter(p => p.product_id !== productId);
    selectedProductsForCompare = selectedProductsForCompare.filter(p => p.product_id !== productId);
    updateCompareList();
}

async function compareProducts() {
    if (selectedProductsForCompare.length < 2) {
        showError('Please select at least 2 products to compare');
        return;
    }
    
    // Show loading state - using enhanced comparison loading animation
    document.getElementById('comparisonLoading').classList.remove('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('comparisonResults').classList.add('hidden');
    
    try {
        // Store current comparison IDs
        currentComparisonIds = selectedProductsForCompare.map(p => p.product_id);
        
        // Create a list of product IDs to send to the server
        const productIds = selectedProductsForCompare.map(p => p.product_id);
        
        const response = await fetch('/compare_multiple_products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_ids: productIds })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to compare products');
        }
        
        // Display comparison results
        document.getElementById('comparisonProductCount').textContent = selectedProductsForCompare.length;
        
        // Create product name list
        const productNamesList = document.getElementById('comparedProductsList');
        productNamesList.innerHTML = '';
        data.product_names.forEach((name, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'mb-1';
            listItem.innerHTML = `<span class="text-blue-400">${index + 1}.</span> ${name}`;
            productNamesList.appendChild(listItem);
        });
        
        // Display the comparison text
        document.getElementById('comparisonText').innerHTML = formatDescription(data.comparison);
        
        // Show comparison results
        document.getElementById('comparisonResults').classList.remove('hidden');
        
    } catch (error) {
        showError(error.message);
        // Show the last product's details if comparison fails
        if (currentProductInfo) {
            document.getElementById('results').classList.remove('hidden');
        }
    } finally {
        document.getElementById('comparisonLoading').classList.add('hidden');
    }
}

async function askComparisonQuestion() {
    const question = document.getElementById('comparisonQuestion').value.trim();
    if (!question) {
        showComparisonQuestionError('Please enter a question');
        return;
    }
    
    if (!currentComparisonIds.length) {
        showComparisonQuestionError('Product comparison information not available');
        return;
    }
    
    // Show loading state
    document.getElementById('comparisonQuestionLoading').classList.remove('hidden');
    document.getElementById('comparisonQuestionError').classList.add('hidden');
    document.getElementById('comparisonQuestionAnswer').classList.add('hidden');
    
    try {
        const response = await fetch('/ask_comparison', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                question: question,
                product_ids: currentComparisonIds
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get answer');
        }
        
        // Display the answer
        document.getElementById('comparisonQuestionText').innerHTML = formatDescription(data.answer);
        document.getElementById('comparisonQuestionAnswer').classList.remove('hidden');
        
    } catch (error) {
        showComparisonQuestionError(error.message);
    } finally {
        document.getElementById('comparisonQuestionLoading').classList.add('hidden');
    }
}

function backToResults() {
    document.getElementById('comparisonResults').classList.add('hidden');
    if (currentProductInfo) {
        document.getElementById('results').classList.remove('hidden');
    }
}

async function askGemini() {
    const question = document.getElementById('geminiQuestion').value.trim();
    if (!question) {
        showGeminiError('Please enter a question');
        return;
    }
    
    if (!currentProductInfo) {
        showGeminiError('Please search for a product first');
        return;
    }
    
    // Show loading state
    document.getElementById('geminiLoading').classList.remove('hidden');
    document.getElementById('geminiError').classList.add('hidden');
    document.getElementById('geminiAnswer').classList.add('hidden');
    
    // Create a simplified context from the product info
    const productContext = `
    Product Name: ${currentProductInfo['Product Name']}
    Price: ${currentProductInfo['Price']}
    Rating: ${currentProductInfo['Rating']}
    Number of Reviews: ${currentProductInfo['Number of Reviews']}
    Availability: ${currentProductInfo['Availability']}
    
    Product Description: ${currentProductInfo['Detailed Description'].substring(0, 500)}
    
    Overall Review Summary: ${currentProductInfo['Sentiment Analysis'].summaries.overall}
    
    Positive Reviews Summary: ${currentProductInfo['Sentiment Analysis'].summaries.positive}
    
    Negative Reviews Summary: ${currentProductInfo['Sentiment Analysis'].summaries.negative}
    
    Sentiment Analysis: 
    - Positive: ${currentProductInfo['Sentiment Analysis'].sentiment_percentages.POSITIVE || 0}%
    - Negative: ${currentProductInfo['Sentiment Analysis'].sentiment_percentages.NEGATIVE || 0}%
    - Neutral: ${currentProductInfo['Sentiment Analysis'].sentiment_percentages.NEUTRAL || 0}%
    
    Overall Sentiment: ${currentProductInfo['Sentiment Analysis'].overall_sentiment}
    `;
    
    try {
        const response = await fetch('/ask_gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                question: question,
                product_context: productContext
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get answer from Gemini');
        }
        
        // Display the answer
        document.getElementById('geminiAnswerText').innerHTML = formatDescription(data.answer);
        document.getElementById('geminiAnswer').classList.remove('hidden');
        
    } catch (error) {
        showGeminiError(error.message);
    } finally {
        document.getElementById('geminiLoading').classList.add('hidden');
    }
}

function formatGeminiResponse(text) {
    // Replace newlines with <br> tags
    return text.replace(/\n/g, '<br>');
}

function showGeminiError(message) {
    const errorDiv = document.getElementById('geminiError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showComparisonQuestionError(message) {
    const errorDiv = document.getElementById('comparisonQuestionError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Add event listener for Enter key on Gemini question input
document.getElementById('geminiQuestion')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        askGemini();
    }
});

// Add event listener for Enter key on product name input
document.getElementById('productName')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        scrapeProduct();
    }
});

// Add event listener for Enter key on comparison question input
document.getElementById('comparisonQuestion')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        askComparisonQuestion();
    }
});

// Function to search for products to add to comparison
async function searchProductForComparison() {
    let productName = document.getElementById('comparisonProductName').value.trim();
    if (!productName) {
        showError('Please enter a product name or URL');
        return;
    }

    // Handle special case where URL starts with @
    if (productName.startsWith('@')) {
        productName = productName.substring(1);
    }

    // Show the dedicated product search loading animation
    document.getElementById('productSearchLoading').classList.remove('hidden');
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('comparisonLoading').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    document.getElementById('results').classList.add('hidden');
    document.getElementById('comparisonResults').classList.add('hidden');

    try {
        const response = await fetch('/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ product_name: productName })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch product information');
        }

        // Add to products to compare list
        addProductToCompareList(data);
        
        // Clear the input field
        document.getElementById('comparisonProductName').value = '';
        
    } catch (error) {
        showError(error.message);
    } finally {
        // Hide the product search loading animation
        document.getElementById('productSearchLoading').classList.add('hidden');
    }
}

// Add event listener for Enter key on comparison product search input
document.getElementById('comparisonProductName')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchProductForComparison();
    }
});

// Function to get product recommendations
async function getProductRecommendations() {
    if (!currentProductInfo || !currentProductInfo.product_id) {
        showError('No product information available');
        return;
    }
    
    // Show loading state
    document.getElementById('recommendationsLoading').classList.remove('hidden');
    document.getElementById('recommendationsError').classList.add('hidden');
    document.getElementById('recommendationsResults').classList.add('hidden');
    
    try {
        const response = await fetch('/recommend_products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                product_id: currentProductInfo.product_id
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recommendations');
        }
        
        // Display recommendations
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';
        
        data.recommendations.forEach((rec, index) => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <div class="recommendation-number">${index + 1}</div>
                <div class="recommendation-content">
                    <h3 class="recommendation-title">${rec.name}</h3>
                    <p class="recommendation-reason">${rec.reason}</p>
                    <div class="recommendation-price">${rec.price_range}</div>
                    <button class="recommendation-search-btn" onclick="searchProduct('${rec.name}')">
                        <i class="fas fa-search mr-2"></i>Analyze This Product
                    </button>
                </div>
            `;
            recommendationsList.appendChild(card);
        });
        
        // Show results
        document.getElementById('recommendationsResults').classList.remove('hidden');
        
    } catch (error) {
        document.getElementById('recommendationsError').textContent = error.message;
        document.getElementById('recommendationsError').classList.remove('hidden');
    } finally {
        document.getElementById('recommendationsLoading').classList.add('hidden');
    }
}

// Helper function to search for a recommended product
function searchProduct(productName) {
    // Set the product name in the search input
    document.getElementById('productName').value = productName;
    
    // Trigger the search
    scrapeProduct();
    
    // Scroll to the top of the results
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Chatbot functionality
let chatMessages = [];

// Function to add a message to the chat UI
function addMessageToChat(message, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'assistant-message');
    messageElement.textContent = message;
    messagesContainer.appendChild(messageElement);
    
    // Scroll to the bottom of the chat
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Add to messages array
    chatMessages.push({
        content: message,
        sender: sender
    });
    
    // Add a small delay before scrolling to ensure the DOM has updated
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
}

// Function to send a message to the chatbot
async function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input
    chatInput.value = '';
    
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('chat-message', 'assistant-message', 'chat-loading');
    loadingElement.textContent = 'Thinking...';
    document.getElementById('chatMessages').appendChild(loadingElement);
    
    try {
        const response = await fetch('/chatbot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get response from chatbot');
        }
        
        // Remove loading indicator
        document.getElementById('chatMessages').removeChild(loadingElement);
        
        // Add assistant response to chat
        addMessageToChat(data.answer, 'assistant');
        
    } catch (error) {
        // Remove loading indicator
        document.getElementById('chatMessages').removeChild(loadingElement);
        
        // Add error message
        addMessageToChat('Sorry, I encountered an error: ' + error.message, 'assistant');
    }
}

// Add event listener for Enter key on chat input
document.getElementById('chatInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
});

// Add event listener for chat send button
document.getElementById('chatSendBtn')?.addEventListener('click', sendChatMessage);

// Initialize chatbot with welcome message when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the chatbot page and initialize if needed
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages && chatMessages.children.length === 0) {
        addMessageToChat('Hello! I am your AI assistant. How can I help you today?', 'assistant');
    }
});