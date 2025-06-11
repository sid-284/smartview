from flask import Flask, render_template, request, jsonify
from amazon_review_scraper import scrape_amazon_product, GEMINI_API_KEY, compare_products
import json
import requests

app = Flask(__name__)
# API key is imported from amazon_review_scraper.py

# Store for product data to enable comparison
product_cache = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/scrape', methods=['POST'])
def scrape():
    query = request.json.get('product_name')
    if not query:
        return jsonify({'error': 'Product name or URL is required'}), 400
    
    try:
        # This will now use Gemini API for enhanced review summaries
        product_info = scrape_amazon_product(query)
        if product_info:
            # Store product in cache for comparison
            product_id = f"product_{len(product_cache) + 1}"
            product_cache[product_id] = product_info
            
            # Add product_id to the response
            product_info['product_id'] = product_id
            
            return jsonify(product_info)
        else:
            return jsonify({'error': 'Could not find product information'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/ask_gemini', methods=['POST'])
def ask_gemini():
    user_question = request.json.get('question')
    product_context = request.json.get('product_context')
    
    if not user_question:
        return jsonify({'error': 'Question is required'}), 400
    
    if not product_context:
        return jsonify({'error': 'Product context is required'}), 400
    
    try:
        # Prepare the prompt with product context
        prompt = f"""
        Product Information:
        {product_context}
        
        User Question: {user_question}
        
        Please answer the user's question about this product based on the information provided.
        Avoid using markdown formatting like ** for bold or * for italic in your response.
        """
        
        # Call Gemini API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
        )
        
        response_data = response.json()
        
        # Extract the text response from Gemini
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            answer = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({"answer": answer})
        else:
            return jsonify({"error": "No response from Gemini API"}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/compare_multiple_products', methods=['POST'])
def compare_multiple_products():
    product_ids = request.json.get('product_ids', [])
    
    if not product_ids or len(product_ids) < 2:
        return jsonify({'error': 'At least two product IDs are required'}), 400
    
    # Check if all products exist in cache
    missing_products = [pid for pid in product_ids if pid not in product_cache]
    if missing_products:
        return jsonify({'error': f'Products not found in cache: {", ".join(missing_products)}'}), 404
    
    try:
        # Get all products from cache
        products = [product_cache[pid] for pid in product_ids]
        product_names = [p['Product Name'] for p in products]
        
        # Create a comparison prompt for Gemini
        products_info = []
        for i, product in enumerate(products):
            # Shorten description length when comparing many products
            description_length = 300 if len(products) <= 5 else 150
            
            product_info = f"""
            PRODUCT {i+1}: {product['Product Name']}
            Price: {product['Price']}
            Rating: {product['Rating']}
            Description: {product['Detailed Description'][:description_length]}...
            Overall Review Summary: {product['Sentiment Analysis']['summaries']['overall']}
            """
            products_info.append(product_info)
        
        products_text = "\n\n".join(products_info)
        
        # Adjust prompt based on number of products
        if len(products) <= 5:
            comparison_instruction = """
            Provide a comprehensive comparison including:
            1. Price comparison across all products
            2. Feature comparison highlighting strengths of each product
            3. Quality and performance comparison based on reviews
            4. Pros and cons of each product
            5. Overall recommendation
            """
        else:
            comparison_instruction = """
            Provide a concise comparison focusing on:
            1. Price comparison with a short table format
            2. Key features comparison highlighting main differences
            3. Main pros and cons for each product
            4. Overall recommendation
            """
        
        prompt = f"""
        Compare the following {len(products)} products:
        
        {products_text}
        
        {comparison_instruction}
        
        Format the response in a clear, structured way with sections.
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        Use clear section headings and structured content instead.
        """
        
        # Calculate token count and adjust max_output_tokens
        # Roughly estimate 4 tokens per word
        estimated_input_tokens = len(prompt.split()) * 1.5
        max_output_tokens = 2000 if len(products) <= 5 else 1000
        
        # Ensure we don't exceed Gemini's max token limits
        if estimated_input_tokens + max_output_tokens > 30000:
            max_output_tokens = min(max_output_tokens, 30000 - estimated_input_tokens)
        
        # Call Gemini API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "maxOutputTokens": int(max_output_tokens),
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            comparison = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({
                'comparison': comparison,
                'product_names': product_names
            })
        else:
            print("Error generating product comparison:", response_data)
            return jsonify({"error": "Could not generate product comparison."}), 500
            
    except Exception as e:
        print(f"Error in compare_multiple_products: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/ask_comparison', methods=['POST'])
def ask_comparison():
    user_question = request.json.get('question')
    product_ids = request.json.get('product_ids', [])
    
    if not user_question:
        return jsonify({'error': 'Question is required'}), 400
    
    if not product_ids or len(product_ids) < 2:
        return jsonify({'error': 'At least two product IDs are required'}), 400
    
    # Check if all products exist in cache
    missing_products = [pid for pid in product_ids if pid not in product_cache]
    if missing_products:
        return jsonify({'error': f'Products not found in cache: {", ".join(missing_products)}'}), 404
    
    try:
        # Get all products from cache
        products = [product_cache[pid] for pid in product_ids]
        product_names = [p['Product Name'] for p in products]
        
        # Create context for all products
        products_info = []
        for i, product in enumerate(products):
            # Adjust description length based on number of products
            description_length = 200 if len(products) <= 5 else 100
            
            product_info = f"""
            PRODUCT {i+1}: {product['Product Name']}
            Price: {product['Price']}
            Rating: {product['Rating']}
            Description: {product['Detailed Description'][:description_length]}...
            Overall Review Summary: {product['Sentiment Analysis']['summaries']['overall']}
            """
            products_info.append(product_info)
        
        context = "\n\n".join(products_info)
        
        # Prepare the prompt
        prompt = f"""
        {context}
        
        User Question: {user_question}
        
        Please answer the user's question comparing these {len(products)} products based on the information provided.
        Be concise but thorough, focusing directly on answering the question asked.
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        """
        
        # Estimate token count for dynamic allocation
        estimated_input_tokens = len(prompt.split()) * 1.5
        max_output_tokens = 800 if len(products) <= 5 else 500
        
        # Ensure we don't exceed Gemini's max token limits
        if estimated_input_tokens + max_output_tokens > 30000:
            max_output_tokens = min(max_output_tokens, 30000 - estimated_input_tokens)
        
        # Call Gemini API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "maxOutputTokens": int(max_output_tokens),
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        # Extract the text response from Gemini
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            answer = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({
                "answer": answer,
                "product_names": product_names
            })
        else:
            return jsonify({"error": "No response from Gemini API"}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/animations')
def animations():
    return render_template('animations.html')

@app.route('/recommend_products', methods=['POST'])
def recommend_products():
    product_id = request.json.get('product_id')
    
    if not product_id or product_id not in product_cache:
        return jsonify({'error': 'Valid product ID is required'}), 400
    
    try:
        # Get the product from cache
        product = product_cache[product_id]
        
        # Create a prompt for Gemini to recommend similar products
        prompt = f"""
        I need recommendations for products similar to this one:
        
        Product Name: {product['Product Name']}
        Price: {product['Price']}
        Description: {product['Detailed Description'][:300]}...
        
        Please suggest 8 specific, real Amazon products that are similar to this one. 
        For each product, provide:
        1. The exact product name (as it would appear on Amazon)
        2. A brief explanation of why it's a good alternative (1-2 sentences)
        3. An estimated price range
        
        Format the response as JSON with this structure:
        [
            {{"name": "Product Name 1", "reason": "Reason for recommendation", "price_range": "$XX-$YY"}},
            {{"name": "Product Name 2", "reason": "Reason for recommendation", "price_range": "$XX-$YY"}},
            ...
        ]
        
        Do not include any text before or after the JSON array.
        """
        
        # Call Gemini API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        # Extract the text response from Gemini
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            recommendations_json = response_data["candidates"][0]["content"]["parts"][0]["text"]
            
            # Clean up the JSON string (remove markdown code blocks if present)
            recommendations_json = recommendations_json.replace("```json", "").replace("```", "").strip()
            
            # Parse the JSON
            recommendations = json.loads(recommendations_json)
            
            # Limit to 5 recommendations
            recommendations = recommendations[:8]
            
            return jsonify({"recommendations": recommendations})
        else:
            return jsonify({"error": "No response from Gemini API"}), 500
            
    except Exception as e:
        print(f"Error in recommend_products: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/chatbot', methods=['POST'])
def chatbot():
    user_message = request.json.get('message')
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        # Use the updated Gemini API key
        gemini_api_key = "AIzaSyBcGYF4GYLFgCzHtwPuyC3JDeMT9bteNqM"
        
        # Prepare the prompt for general chatbot functionality
        prompt = f"""
        You are a helpful AI assistant that can answer questions about products, shopping, and general knowledge.
        
        User Message: {user_message}
        
        Please provide a helpful, informative, and conversational response.
        Avoid using markdown formatting like ** for bold or * for italic in your response.
        """
        
        # Call Gemini API
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "topP": 0.8,
                    "maxOutputTokens": 800
                }
            }
        )
        
        response_data = response.json()
        print("Gemini API response:", response_data)  # Debug print
        
        # Extract the text response from Gemini
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            answer = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return jsonify({"answer": answer})
        else:
            print("Error response from Gemini API:", response_data)  # Debug print
            return jsonify({"error": "No response from Gemini API"}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)