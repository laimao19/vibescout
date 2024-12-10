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
    try:
        data = request.get_json()
        user_preferences = data.get('user_preferences', {})
        places = data.get('places', [])

        if not user_preferences or not places:
            return jsonify({"error": "Missing user preferences or places"}), 400

        recommendations = []

        user_vector = np.array([
            user_preferences.get('valence', 0.5),
            user_preferences.get('energy', 0.5),
            user_preferences.get('loudness', 0.5),
            user_preferences.get('ambiance', 0.5),
            user_preferences.get('liveness', 0.5),
            0.5
        ]).reshape(1, -1)

        for place in places:
            # Skip excluded place types
            if any(place_type in EXCLUDED_PLACE_TYPES for place_type in place.get("types", [])):
                continue

            # Get and analyze reviews
            place_id = place.get("place_id")
            if not place_id:
                continue

            reviews = get_google_reviews(place_id)
            if not reviews:
                continue

            # Build the feature vector and include individual scores
            try:
                place_vector, place_scores = build_place_feature_vector(reviews)
                similarity_score = cosine_similarity(user_vector, place_vector.reshape(1, -1))[0][0]

                # Calculate star rating (1-5)
                star_rating = min(5, max(1, round(similarity_score * 5)))

                recommendations.append({
                    "place_id": place_id,
                    "name": place.get("name"),
                    "types": place.get("types", []),
                    "similarity_score": float(similarity_score),
                    "star_rating": star_rating,
                    "category_scores": place_scores,
                    "lat": place.get("geometry", {}).get("location", {}).get("lat"),
                    "lng": place.get("geometry", {}).get("location", {}).get("lng"),
                    "address": place.get("vicinity", "")
                })
            except Exception as e:
                print(f"Error processing place {place_id}: {str(e)}")
                continue

        # Sort by similarity score
        recommendations.sort(key=lambda x: x["similarity_score"], reverse=True)

        return jsonify({
            "status": "success",
            "recommendations": recommendations[:10]
        })

    except Exception as e:
        print(f"Error in recommendation: {str(e)}")
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500