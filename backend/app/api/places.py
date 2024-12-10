from flask import Blueprint, request, jsonify
import requests
import os

places_bp = Blueprint('places', __name__, url_prefix='/api/places')

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_API_KEY')

@places_bp.route('/nearby', methods=['GET'])
def nearby_places():
    try:
        lat = request.args.get('lat', type=float)
        lng = request.args.get('lng', type=float)
        radius = request.args.get('radius', type=float)

        if lat is None or lng is None or radius is None:
            return jsonify({"error": "Missing parameters"}), 400

        # Get nearby places
        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': f'{lat},{lng}',
            'radius': radius,
            'type': 'establishment',  # Get all types of establishments
            'key': GOOGLE_PLACES_API_KEY
        }
        
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch places"}), response.status_code

        places = response.json().get('results', [])
        
        # Get additional details for each place
        detailed_places = []
        for place in places:
            details_url = 'https://maps.googleapis.com/maps/api/place/details/json'
            details_params = {
                'place_id': place['place_id'],
                'fields': 'name,rating,reviews,photos,formatted_address,opening_hours,price_level',
                'key': GOOGLE_PLACES_API_KEY
            }
            
            details_response = requests.get(details_url, params=details_params)
            if details_response.status_code == 200:
                details = details_response.json().get('result', {})
                place.update(details)
                detailed_places.append(place)

        return jsonify({
            "places": detailed_places
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": "An error occurred"}), 500