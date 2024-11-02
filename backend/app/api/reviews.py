from flask import Blueprint, request, jsonify
import requests
import os
from textblob import TextBlob
from sklearn.feature_extraction.text import CountVectorizer

bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

# Example function to fetch Google Reviews, if not already implemented
@bp.route('/get-reviews', methods=['GET'])
def get_google_reviews():
    place_id = request.args.get('place_id')
    google_api_key = os.getenv("GOOGLE_API_KEY")

    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&key={google_api_key}"
    response = requests.get(url)
    data = response.json()

    if 'reviews' in data['result']:
        reviews = data['result']['reviews']
        analyzed_reviews = analyze_reviews(reviews)
        return jsonify(analyzed_reviews)
    else:
        return jsonify({"error": "No reviews found"})

# Analyze reviews for keywords and sentiment
def analyze_reviews(reviews):
    analyzed_reviews = []
    for review in reviews:
        text = review.get('text', '')
        # Sentiment Analysis
        sentiment = TextBlob(text).sentiment.polarity

        # Keyword Extraction
        vectorizer = CountVectorizer(stop_words='english', max_features=5)
        keywords = vectorizer.fit_transform([text]).toarray()
        feature_names = vectorizer.get_feature_names_out()

        analyzed_reviews.append({
            'text': text,
            'rating': review.get('rating', None),
            'sentiment': sentiment,
            'keywords': feature_names.tolist()
        })
    return analyzed_reviews
