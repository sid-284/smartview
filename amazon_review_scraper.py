import requests
import random
import time
import json
from selectorlib import Extractor # type: ignore
from urllib.parse import quote_plus
import re
import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from collections import Counter
import textwrap

# Download required NLTK data
try:
    nltk.data.find('vader_lexicon')
except LookupError:
    nltk.download('vader_lexicon')

# Gemini API key
GEMINI_API_KEY = "lol"

# Extractor for Amazon product details
e = Extractor.from_yaml_string("""
product_name:
    css: 'span#productTitle'
    type: Text

price:
    css: 'span.a-price span.a-offscreen'
    type: Text

rating:
    css: 'span.a-icon-alt'
    type: Text

num_reviews:
    css: 'span#acrCustomerReviewText'
    type: Text

availability:
    css: 'div#availability span'
    type: Text

image:
    css: 'img#landingImage'
    type: Attribute
    attribute: src

description:
    css: 'div#feature-bullets .a-list-item'
    multiple: true
    type: Text

technical_details:
    css: '#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr'
    multiple: true
    type: Text

product_description:
    css: '#productDescription p'
    multiple: true
    type: Text

reviews:
    css: 'div.review-text-content span'
    multiple: true
    type: Text
""")

# User-Agent rotation to avoid detection
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.177 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.124 Safari/537.36",
]

session = requests.Session()

def fetch_url_with_retries(url, max_retries=5):
    """Fetch a URL with retries, rotating headers to bypass 503 errors."""
    delay = 2  # Initial delay
    for attempt in range(max_retries):
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,/;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://www.google.com/",
            "Upgrade-Insecure-Requests": "1",
        }
        
        try:
            response = session.get(url, headers=headers, timeout=10)
            
            if response.status_code == 503:
                print(f"⚠ 503 Error Detected (Attempt {attempt+1}/{max_retries}). Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2  # Exponential backoff
                continue  # Retry request

            if response.status_code == 200:
                return response

            print(f"❌ Unexpected Status Code: {response.status_code}")
            return None
        
        except requests.exceptions.RequestException as err:
            print(f"❌ Request Error: {err}")
            time.sleep(delay)
            delay *= 2  # Exponential backoff

    print("❌ Max retries reached. Skipping request.")
    return None

def search_amazon(product_name):
    """Search Amazon for the product and return the first result URL."""
    search_url = f"https://www.amazon.in/s?k={quote_plus(product_name)}"
    print(f"🔍 Searching for '{product_name}' on Amazon...")
    response = fetch_url_with_retries(search_url)
    
    if not response:
        return None

    match = re.search(r'/dp/([A-Z0-9]+)/', response.text)
    if match:
        product_url = f"https://www.amazon.in/dp/{match.group(1)}"
        print(f"✅ Found product URL: {product_url}")
        return product_url
    else:
        print("❌ No products found.")
        return None

def analyze_sentiment(review):
    """Analyze the sentiment of a single review."""
    sia = SentimentIntensityAnalyzer()
    scores = sia.polarity_scores(review)
    
    # Adjust thresholds for better neutral detection
    if scores['compound'] >= 0.05:
        return 'POSITIVE'
    elif scores['compound'] <= -0.05:
        return 'NEGATIVE'
    else:
        return 'NEUTRAL'

def generate_gemini_summary(reviews, summary_type="overall", max_tokens=200):
    """Generate a summary of reviews using Gemini API."""
    if not reviews or len(reviews) == 0:
        return f"No {summary_type} reviews available to summarize."
    
    # Combine reviews into a single text, limiting to avoid token limits
    combined_text = " ".join(reviews[:20])  # Limit to 20 reviews to avoid token limits
    
    # Different prompts based on summary type
    if summary_type == "overall":
        prompt = f"""
        Summarize the following product reviews in a comprehensive way, highlighting key points mentioned by customers. 
        Focus on both positive and negative aspects. Keep the summary concise (3-4 sentences).
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        
        Reviews: {combined_text}
        """
    elif summary_type == "positive":
        prompt = f"""
        Summarize the positive aspects from these product reviews. Focus on what customers liked most.
        Keep the summary concise (2-3 sentences).
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        
        Reviews: {combined_text}
        """
    elif summary_type == "negative":
        prompt = f"""
        Summarize the negative aspects from these product reviews. Focus on common complaints and issues.
        Keep the summary concise (2-3 sentences).
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        
        Reviews: {combined_text}
        """
    else:  # neutral
        prompt = f"""
        Summarize the neutral aspects from these product reviews. Focus on factual observations, balanced opinions, 
        and specific details mentioned without strong sentiment. Avoid making it sound like a product description.
        Keep the summary concise (2-3 sentences) and focus on what customers actually said.
        DO NOT use markdown formatting like ** for bold or * for italic in your response.
        
        Reviews: {combined_text}
        """
    
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "maxOutputTokens": max_tokens,
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            summary = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return summary.strip()
        else:
            print(f"Error generating {summary_type} summary:", response_data)
            return f"Could not generate {summary_type} summary."
            
    except Exception as e:
        print(f"Error calling Gemini API for {summary_type} summary:", str(e))
        # Fallback to simple summary
        if len(combined_text) > 200:
            return combined_text[:200] + "..."
        return combined_text

def generate_product_description(raw_description_data):
    """Generate a comprehensive product description using Gemini API."""
    if not raw_description_data:
        return "No product description available."
    
    # Combine all description data
    combined_text = " ".join(raw_description_data)
    
    # If text is very short, return as is
    if len(combined_text) < 100:
        return combined_text
    
    prompt = f"""
    Based on the following product information, create a comprehensive and well-structured product description.
    Highlight key features, specifications, and benefits. Format the response with appropriate sections.
    DO NOT use markdown formatting like ** for bold or * for italic in your response.
    Use clear section headings and structured content instead.
    
    Product Information: {combined_text}
    """
    
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "maxOutputTokens": 500,
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            description = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return description.strip()
        else:
            print("Error generating product description:", response_data)
            return "Could not generate product description."
            
    except Exception as e:
        print(f"Error calling Gemini API for product description:", str(e))
        # Fallback to original text
        if len(combined_text) > 300:
            return combined_text[:300] + "..."
        return combined_text

def analyze_reviews_sentiment(reviews):
    """Analyze sentiment for all reviews and return detailed analysis."""
    if not reviews or reviews == ["No reviews available."]:
        return {
            "sentiment_counts": {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0},
            "sentiment_percentages": {"POSITIVE": 0, "NEGATIVE": 0, "NEUTRAL": 0},
            "review_sentiments": [],
            "overall_sentiment": "No reviews available for analysis.",
            "summaries": {
                "overall": "No reviews available.",
                "positive": "No positive reviews.",
                "negative": "No negative reviews.",
                "neutral": "No neutral reviews."
            }
        }
    
    # Analyze each review
    review_sentiments = [(review, analyze_sentiment(review)) for review in reviews]
    
    # Group reviews by sentiment
    positive_reviews = [review for review, sentiment in review_sentiments if sentiment == 'POSITIVE']
    negative_reviews = [review for review, sentiment in review_sentiments if sentiment == 'NEGATIVE']
    neutral_reviews = [review for review, sentiment in review_sentiments if sentiment == 'NEUTRAL']
    
    # Generate summaries using Gemini API
    print("Generating review summaries with Gemini API...")
    
    # If there are no neutral reviews, don't try to generate a summary for them
    neutral_summary = "No neutral reviews." if not neutral_reviews else generate_gemini_summary(neutral_reviews, "neutral")
    
    summaries = {
        "overall": generate_gemini_summary(reviews, "overall"),
        "positive": generate_gemini_summary(positive_reviews, "positive") if positive_reviews else "No positive reviews.",
        "negative": generate_gemini_summary(negative_reviews, "negative") if negative_reviews else "No negative reviews.",
        "neutral": neutral_summary
    }
    
    # Count sentiments
    sentiment_counts = Counter(sentiment for _, sentiment in review_sentiments)
    total_reviews = len(review_sentiments)
    
    # Calculate percentages
    sentiment_percentages = {
        sentiment: round((count / total_reviews) * 100, 1)
        for sentiment, count in sentiment_counts.items()
    }
    
    # Determine overall sentiment
    if sentiment_percentages.get('POSITIVE', 0) > 60:
        overall = "Predominantly positive"
    elif sentiment_percentages.get('NEGATIVE', 0) > 60:
        overall = "Predominantly negative"
    else:
        overall = "Mixed or neutral"
    
    return {
        "sentiment_counts": dict(sentiment_counts),
        "sentiment_percentages": sentiment_percentages,
        "review_sentiments": review_sentiments,
        "overall_sentiment": overall,
        "summaries": summaries
    }

def extract_product_id_from_url(url):
    """Extract the Amazon product ID (ASIN) from a URL."""
    # Look for /dp/XXXXXXXXXX/ pattern
    dp_match = re.search(r'/dp/([A-Z0-9]+)/', url)
    if dp_match:
        return dp_match.group(1)
    
    # Look for /gp/product/XXXXXXXXXX/ pattern
    gp_match = re.search(r'/gp/product/([A-Z0-9]+)/', url)
    if gp_match:
        return gp_match.group(1)
    
    return None

def scrape_amazon_product(query):
    """Search for the product on Amazon and scrape details.
    
    Args:
        query: Can be either a product name to search for, or a direct Amazon product URL
    """
    # Check if the input is a URL
    if query.startswith('http') and 'amazon' in query:
        print(f"🔍 Direct URL detected: {query}")
        product_id = extract_product_id_from_url(query)
        if product_id:
            product_url = f"https://www.amazon.in/dp/{product_id}"
        else:
            # If we can't extract the ID, try using the URL directly
            product_url = query
    else:
        # Treat as a product name search
        product_url = search_amazon(query)
    
    if not product_url:
        return None

    print(f"🔄 Fetching product details from {product_url} ...")
    response = fetch_url_with_retries(product_url)
    
    if not response:
        return None

    data = e.extract(response.text) or {}

    # Get reviews and analyze sentiment
    reviews = [review.strip() for review in (data.get("reviews") or []) if review.strip()] or ["No reviews available."]
    sentiment_analysis = analyze_reviews_sentiment(reviews)

    # Collect all product description data
    description_items = data.get("description", []) or []
    tech_details = data.get("technical_details", []) or []
    product_desc = data.get("product_description", []) or []
    
    # Combine all description data
    all_description_data = description_items + tech_details + product_desc
    all_description_data = [item.strip() for item in all_description_data if item and item.strip()]
    
    # Generate comprehensive product description
    print("Generating comprehensive product description with Gemini API...")
    detailed_description = generate_product_description(all_description_data)

    # Graceful handling of missing data
    product_details = {
        "Product Name": data.get("product_name", "N/A").strip() if data.get("product_name") else "N/A",
        "Price": data.get("price", "N/A").strip() if data.get("price") else "N/A",
        "Rating": data.get("rating", "N/A").strip() if data.get("rating") else "N/A",
        "Number of Reviews": data.get("num_reviews", "N/A").strip() if data.get("num_reviews") else "N/A",
        "Availability": data.get("availability", "N/A").strip() if data.get("availability") else "N/A",
        "Image URL": data.get("image", "N/A").strip() if data.get("image") else "N/A",
        "Raw Description Data": all_description_data,
        "Detailed Description": detailed_description,
        "Reviews": reviews,
        "Sentiment Analysis": sentiment_analysis
    }
    return product_details

def compare_products(product1_info, product2_info):
    """Compare two products using Gemini API."""
    if not product1_info or not product2_info:
        return "Cannot compare products. Missing product information."
    
    # Create a comparison prompt for Gemini
    prompt = f"""
    Compare the following two products in detail:
    
    PRODUCT 1: {product1_info['Product Name']}
    Price: {product1_info['Price']}
    Rating: {product1_info['Rating']}
    Description: {product1_info['Detailed Description'][:500]}
    Overall Review Summary: {product1_info['Sentiment Analysis']['summaries']['overall']}
    
    PRODUCT 2: {product2_info['Product Name']}
    Price: {product2_info['Price']}
    Rating: {product2_info['Rating']}
    Description: {product2_info['Detailed Description'][:500]}
    Overall Review Summary: {product2_info['Sentiment Analysis']['summaries']['overall']}
    
    Provide a detailed comparison including:
    1. Price comparison
    2. Feature comparison
    3. Quality and performance comparison based on reviews
    4. Pros and cons of each product
    5. Overall recommendation
    
    Format the response in a clear, structured way with sections.
    """
    
    try:
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "maxOutputTokens": 800,
                    "temperature": 0.2,
                    "topP": 0.8,
                }
            }
        )
        
        response_data = response.json()
        
        if "candidates" in response_data and len(response_data["candidates"]) > 0:
            comparison = response_data["candidates"][0]["content"]["parts"][0]["text"]
            return comparison.strip()
        else:
            print("Error generating product comparison:", response_data)
            return "Could not generate product comparison."
            
    except Exception as e:
        print(f"Error calling Gemini API for product comparison:", str(e))
        return "Error generating product comparison."

# Run script with a product name input
if __name__ == "__main__":
    query = input("Enter the product name or Amazon URL: ").strip()
    product_info = scrape_amazon_product(query)

    if product_info:
        print("\n✅ Extracted Product Details:")
        #print(json.dumps({k: v for k, v in product_info.items() if k != "Sentiment Analysis"}, indent=4))
        
        # Print sentiment analysis results
        sentiment = product_info["Sentiment Analysis"]
        print("\nSENTIMENT ANALYSIS RESULTS:")
        print(f"Positive reviews: {sentiment['sentiment_counts'].get('POSITIVE', 0)} ({sentiment['sentiment_percentages'].get('POSITIVE', 0)}%)")
        print(f"Negative reviews: {sentiment['sentiment_counts'].get('NEGATIVE', 0)} ({sentiment['sentiment_percentages'].get('NEGATIVE', 0)}%)")
        print(f"Neutral reviews: {sentiment['sentiment_counts'].get('NEUTRAL', 0)} ({sentiment['sentiment_percentages'].get('NEUTRAL', 0)}%)")
        print(f"\nOVERALL SENTIMENT: {sentiment['overall_sentiment']}")

        print("\nDETAILED PRODUCT DESCRIPTION:")
        print(textwrap.fill(product_info['Detailed Description'], width=80))

        print("\nREVIEW SUMMARIES:")
        print("\n📝 Overall Summary:")
        print(textwrap.fill(sentiment['summaries']['overall'], width=80))
        
        print("\n✨ Positive Reviews Summary:")
        print(textwrap.fill(sentiment['summaries']['positive'], width=80))
        
        print("\n❌ Negative Reviews Summary:")
        print(textwrap.fill(sentiment['summaries']['negative'], width=80))
        
        print("\n😐 Neutral Reviews Summary:")
        print(textwrap.fill(sentiment['summaries']['neutral'], width=80))
        
        print("\nDETAILED REVIEW BREAKDOWN:")
        for i, (review, sent) in enumerate(sentiment['review_sentiments'], 1):
            print(f"{i}. \"{review}\" - {sent}")

        # Save to file
        with open("product_data.json", "w", encoding="utf-8") as f:
            json.dump(product_info, f, indent=4)
        print("\n💾 Data saved to product_data.json")
    else:
        print("\n❌ Could not extract product details.")
