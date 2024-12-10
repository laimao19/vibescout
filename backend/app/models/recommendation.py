from flask import Blueprint, request, jsonify
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from app.models.content_based import build_place_feature_vector
from app.api.reviews import get_google_reviews
import os

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')

EXCLUDED_PLACE_TYPES = {
    # Original exclusions
    "hotel", "lodging", "motel", "inn", "locality", "political",
    
    # Functional/Service-Oriented Locations
    "accounting", "airport", "atm", "bank", "city_hall", "courthouse", 
    "embassy", "fire_station", "insurance_agency", "lawyer", 
    "local_government_office", "police", "post_office", "real_estate_agency", 
    "roofing_contractor", "storage", "taxi_stand",

    # Religious/Community Centers
    "church", "cemetery", "hindu_temple", "mosque", "synagogue",

    # Medical/Healthcare Services
    "dentist", "doctor", "hospital", "pharmacy", "physiotherapist", 
    "veterinary_care",

    # Construction/Repair Services
    "electrician", "hardware_store", "painter", "plumber",

    # Retail Stores
    "bicycle store", "electronics store", "furniture store", 
    "home_goods_store", "jewelry_store", "shoe_store", "hardware_store",

    # Entertainment and Recreation (Conditionally Excluded)
    "casino", "night_club", "stadium"

    # Outdoor Activities
    "parking", "subway_station", "transit_station",

    # Education and Institutions
    "university", "school", "library",

    # Specialized Activities
    "locksmith", "moving_company"
}


@recommendations_bp.route('/content-based', methods=['POST'])
def content_based_recommendation():
    try:
        data = request.get_json()
        print("Request data:", data)

        if not data or 'user_preferences' not in data or 'places' not in data:
            return jsonify({"status": "error", "error": "Invalid input data"}), 400

        user_preferences = data.get('user_preferences', {})
        places = data.get('places', [])
        radius = data.get('radius', 5000)  # Get radius from request

        print(f"Processing recommendations with radius: {radius}m")
        print(f"Number of places before filtering: {len(places)}")

        # Enhanced user vector matching feature dimensions
        user_vector = np.array([
            user_preferences.get('valence', 0.5),
            0.5,  # Sentiment variance weight
            user_preferences.get('energy', 0.5),
            0.5,  # Rating variance weight
            user_preferences.get('loudness', 0.5),
            user_preferences.get('ambiance', 0.5),
            user_preferences.get('liveness', 0.5),
            0.5  # Review count weight
        ]).reshape(1, -1)

        recommendations = []
        processed_place_ids = set()

        for place in places:
            try:
                place_id = place.get('place_id')
                
                # Skip if we've already processed this place or if it should be excluded
                if place_id in processed_place_ids or should_exclude_place(place):
                    continue

                processed_place_ids.add(place_id)
                
                # Get fresh reviews for each place
                reviews = get_google_reviews(place_id)
                
                if not reviews:
                    continue

                place_vector, place_scores = build_place_feature_vector(reviews)
                
                # Calculate base similarity
                base_similarity = cosine_similarity(user_vector, place_vector.reshape(1, -1))[0][0]
                
                # Add distance-based adjustment
                # Places further away need higher similarity to be included
                distance_factor = float(place.get('distance', 0)) / float(radius)
                adjusted_similarity = base_similarity * (1 - (distance_factor * 0.3))
                
                # Add some controlled randomness for variety
                random_factor = np.random.normal(0, 0.4)  # Small randomness
                final_similarity = min(1.0, max(0.0, adjusted_similarity + random_factor))


                if final_similarity > 0.2:  # Minimum threshold for inclusion
                    recommendation = build_recommendation_object(place, final_similarity, place_scores)
                    recommendations.append(recommendation)

            except Exception as e:
                print(f"Error processing place {place.get('name')}: {str(e)}")
                continue

        # Sort by final similarity score
        recommendations.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Ensure diversity in the final recommendations
        diverse_recommendations = diversify_recommendations(recommendations)[:10]
        
        print(f"Final number of recommendations: {len(diverse_recommendations)}")
        
        return jsonify({
            "status": "success", 
            "recommendations": diverse_recommendations,
            "metadata": {
                "processed_places": len(processed_place_ids),
                "recommended_places": len(diverse_recommendations),
                "radius_used": radius
            }
        })

    except Exception as e:
        print(f"Unhandled error in recommendation: {str(e)}")
        return jsonify({"status": "error", "error": str(e)}), 500

    
def should_exclude_place(place):
    """Exclusion logic for certain place types."""
    place_types = place.get("types", [])
    
    # Split types if they are a single comma-separated string
    if isinstance(place_types, str):
        place_types = [t.strip().lower() for t in place_types.split(',')]
    elif isinstance(place_types, list):
        place_types = [t.lower() for t in place_types]
    else:
        place_types = []

    # Debugging: Log the processed place types
    print(f"Checking types for place {place.get('name')}: {place_types}")

    # Check for exclusion
    return any(place_type in EXCLUDED_PLACE_TYPES for place_type in place_types)



def diversify_recommendations(recommendations, diversity_threshold=0.15):
    """Ensure recommendations are diverse."""
    if not recommendations:
        return []
        
    diversified = []
    for rec in recommendations:
        if len(diversified) < 10:  # Limit to max 10
            diversified.append(rec)
    
    return diversified

def build_recommendation_object(place, similarity_score, place_scores):
    """Build a standardized recommendation object."""
    return {
        "place_id": place.get("place_id"),
        "name": place.get("name"),
        "types": place.get("types", []),
        "similarity_score": float(similarity_score),
        "star_rating": min(5, max(1, round(similarity_score * 5))),
        "category_scores": {
            "sentiment": place_scores['sentiment'],
            "review_quality": place_scores['review_quality'],
            "keywords": list(place_scores['keywords']),  # Convert NumPy array to list
            "emotional_stats": place_scores['emotional_stats']
        },
        "lat": place.get("geometry", {}).get("location", {}).get("lat"),
        "lng": place.get("geometry", {}).get("location", {}).get("lng"),
        "address": place.get("vicinity", ""),
        "metadata": {
            "review_count": place_scores['review_quality']['review_count'],
            "average_sentiment": place_scores['sentiment']['average'],
            "emotional_score": place_scores['emotional_stats']['positivity'],
            "activity_level": place_scores['emotional_stats']['activity_level']
        }
    }
