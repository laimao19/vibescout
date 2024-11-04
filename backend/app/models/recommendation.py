# recommendations.py
from flask import Blueprint, request, jsonify
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models.content_based import build_place_feature_vector
from app.api.reviews import get_google_reviews
import os
import requests

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

EXCLUDED_PLACE_TYPES = {"hotel", "lodging", "motel", "inn"}

@recommendations_bp.route('/content-based', methods=['POST'])
def content_based_recommendation():
    data = request.get_json()
    user_preferences = data.get('user_preferences', {})
    places = data.get('places', [])

    recommendations = []

    user_vector = np.array([
        user_preferences.get('sentiment', 0.5),
        user_preferences.get('ambiance', 0.5),
        user_preferences.get('energy', 0.5),
        user_preferences.get('liveness', 0.5),
        user_preferences.get('valence', 0.5),
        0
    ]).reshape(1, -1)

    for place in places:
        if any(place_type in EXCLUDED_PLACE_TYPES for place_type in place.get("types", [])):
            continue

        reviews = get_google_reviews(place["place_id"])
        if not reviews or 'error' in reviews:
            continue

        # Build the feature vector and include individual scores
        place_vector = build_place_feature_vector(reviews)
        place_scores = {
            "sentiment_variance": place_vector[0],
            "review_length": place_vector[1],
            "keyword_clean": place_vector[2],
            "keyword_comfortable": place_vector[3],
            "keyword_friendly": place_vector[3],
        }

        similarity_score = cosine_similarity(user_vector, place_vector.reshape(1, -1))[0][0]

        recommendations.append({
            "place_id": place["place_id"],
            "name": place["name"],
            "types": place.get("types", []),
            "similarity_score": similarity_score,
            "category_scores": place_scores,
        })

    recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)
    return jsonify({"recommendations": recommendations[:10]})



def get_google_reviews(place_id):
    google_api_key = os.getenv("GOOGLE_API_KEY")
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&key={google_api_key}"
    response = requests.get(url)
    data = response.json()
    return data.get('result', {}).get('reviews', [])
