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
        radius = request.args.get('radius', type=float)  # Updated to float
        
        # Debugging output
        print("Received coordinates and radius:", {"lat": lat, "lng": lng, "radius": radius})

        # Check for missing or None values
        if lat is None or lng is None or radius is None:
            print("Error: Missing lat, lng, or radius in request parameters.")
            return jsonify({"error": "Latitude, Longitude, and Radius are required and must be numbers."}), 400

        # Proceed with Google Places API request
        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': f'{lat},{lng}',
            'radius': radius,
            'key': GOOGLE_PLACES_API_KEY,
        }
        response = requests.get(url, params=params)
        
        if response.status_code != 200:
            print("Error: Failed to fetch places from Google Places API.")
            return jsonify({"error": "Failed to fetch places from Google Places API"}), response.status_code

        places = response.json().get('results', [])
        print("Places received:", places)  # Debugging: Check what places are returned
        return jsonify({"message": "Nearby places found", "places": places})
    
    except Exception as e:
        print("An exception occurred:", str(e))
        return jsonify({"error": "An internal error occurred."}), 500
