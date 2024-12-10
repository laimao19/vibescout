# reviews.py
from flask import Blueprint, request, jsonify
import requests
import os
from textblob import TextBlob
from sklearn.feature_extraction.text import CountVectorizer
import numpy as np

bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

def get_google_reviews(place_id):
    """Function to fetch and analyze reviews for a specific place"""
    google_api_key = os.getenv("GOOGLE_API_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&key={google_api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get('result') and isinstance(data['result'].get('reviews'), list):
            reviews = data['result']['reviews']
            return analyze_reviews(reviews)
        return []
    except Exception as e:
        print(f"Error fetching reviews: {str(e)}")
        return []

@bp.route('/get-reviews', methods=['GET'])
def get_reviews_endpoint():
    """Endpoint to get reviews for a place"""
    place_id = request.args.get('place_id')
    if not place_id:
        return jsonify({"error": "No place_id provided"}), 400
    
    reviews = get_google_reviews(place_id)
    return jsonify(reviews)

def analyze_reviews(reviews):
    """Analyze reviews for keywords and sentiment"""
    analyzed_reviews = []
    for review in reviews:
        try:
            text = str(review.get('text', ''))
            if not text:
                continue

            # Sentiment Analysis
            blob = TextBlob(text)
            sentiment = blob.sentiment.polarity

            # Keyword Extraction
            vectorizer = CountVectorizer(
                stop_words='english',
                max_features=5,
                min_df=1,
                binary=True
            )
            
            text_for_vectorizer = [text.lower()]  # Pass as a list of one string
            try:
                keyword_matrix = vectorizer.fit_transform(text_for_vectorizer)
                feature_names = vectorizer.get_feature_names_out()
                keyword_scores = np.asarray(keyword_matrix.sum(axis=0)).ravel()
                keywords = [feature_names[i] for i in range(len(feature_names)) 
                          if keyword_scores[i] > 0]
            except Exception as e:
                print(f"Error in keyword extraction: {str(e)}")
                keywords = []

            # Format keywords as a comma-separated string
            keywords_string = ", ".join(keywords)

            analyzed_review = {
                'text': text,
                'rating': float(review.get('rating', 0)) if review.get('rating') is not None else 0,
                'sentiment': float(sentiment),
                'keywords': keywords_string,  # Updated to comma-separated string
                'time': review.get('time'),
                'author_name': review.get('author_name', 'Anonymous')
            }
            analyzed_reviews.append(analyzed_review)
            
        except Exception as e:
            print(f"Error analyzing review: {str(e)}")
            continue

    return analyzed_reviews if analyzed_reviews else []


def calculate_review_metrics(reviews):
    """Calculate aggregate metrics from a set of reviews"""
    if not reviews:
        return {
            'average_rating': 0,
            'sentiment_score': 0,
            'review_count': 0,
            'common_keywords': []
        }

    ratings = [r.get('rating', 0) for r in reviews]
    sentiments = [r.get('sentiment', 0) for r in reviews]
    
    # Collect all keywords
    all_keywords = []
    for review in reviews:
        all_keywords.extend(review.get('keywords', []))
    
    # Count keyword frequencies
    keyword_freq = {}
    for keyword in all_keywords:
        keyword_freq[keyword] = keyword_freq.get(keyword, 0) + 1
    
    # Sort keywords by frequency
    common_keywords = sorted(keyword_freq.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        'average_rating': np.mean(ratings) if ratings else 0,
        'sentiment_score': np.mean(sentiments) if sentiments else 0,
        'review_count': len(reviews),
        'common_keywords': [k for k, v in common_keywords]
    }