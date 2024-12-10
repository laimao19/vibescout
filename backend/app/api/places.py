from flask import Blueprint, request, jsonify
import requests
import os
from flask_cors import CORS  # Make sure to import CORS

places_bp = Blueprint('places', __name__, url_prefix='/api/places')
CORS(places_bp)  # Enable CORS for this blueprint

GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_API_KEY')

@places_bp.route('/nearby', methods=['GET'])
def nearby_places():
    try:
        # Log raw request data
        print("Raw request args:", request.args)
        
        # Get parameters with detailed logging
        lat = request.args.get('lat')
        lng = request.args.get('lng')
        radius = request.args.get('radius')
        
        print("Received parameters:", {
            'lat': lat,
            'lng': lng,
            'radius': radius,
            'lat_type': type(lat).__name__,
            'lng_type': type(lng).__name__,
            'radius_type': type(radius).__name__
        })

        # Convert strings to float with error handling
        try:
            lat = float(lat) if lat is not None else None
            lng = float(lng) if lng is not None else None
            radius = float(radius) if radius is not None else None
        except ValueError as e:
            print(f"Parameter conversion error: {str(e)}")
            return jsonify({
                "error": "Invalid parameter format",
                "details": {
                    "message": str(e),
                    "received_values": {
                        "lat": lat,
                        "lng": lng,
                        "radius": radius
                    }
                }
            }), 400

        # Validate parameters
        if any(param is None for param in [lat, lng, radius]):
            missing_params = []
            if lat is None: missing_params.append("lat")
            if lng is None: missing_params.append("lng")
            if radius is None: missing_params.append("radius")
            return jsonify({
                "error": "Missing parameters",
                "details": {
                    "missing": missing_params,
                    "received": request.args
                }
            }), 400

        # Validate coordinate ranges
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return jsonify({
                "error": "Invalid coordinates",
                "details": {
                    "latitude": lat,
                    "longitude": lng,
                    "valid_ranges": {
                        "latitude": "[-90, 90]",
                        "longitude": "[-180, 180]"
                    }
                }
            }), 400

        # Validate radius (max 50km/50000m per Google Places API limits)
        if not (0 < radius <= 50000):
            return jsonify({
                "error": "Invalid radius",
                "details": {
                    "received": radius,
                    "valid_range": "(0, 50000]",
                    "unit": "meters"
                }
            }), 400

        # Get nearby places
        url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        params = {
            'location': f'{lat},{lng}',
            'radius': radius,
            'type': 'establishment',
            'key': GOOGLE_PLACES_API_KEY
        }

        print("Making request to Google Places API:", {
            "url": url,
            "params": {**params, "key": "REDACTED"}  # Log params without API key
        })

        response = requests.get(url, params=params)
        
        # Check response status
        if response.status_code != 200:
            print(f"Google Places API error: {response.text}")
            return jsonify({
                "error": "Failed to fetch places",
                "details": {
                    "status_code": response.status_code,
                    "google_response": response.json()
                }
            }), response.status_code

        places = response.json().get('results', [])
        
        print(f"Found {len(places)} places within {radius}m of {lat},{lng}")

        # Filter out places without proper location data
        valid_places = [
            place for place in places
            if place.get('geometry', {}).get('location', {}).get('lat') and 
               place.get('geometry', {}).get('location', {}).get('lng')
        ]

        for place in valid_places:
            if 'types' in place:
                place['types'] = ", ".join([t.replace('_', ' ') for t in place['types']])

        return jsonify({
            "status": "success",
            "places": valid_places,
            "metadata": {
                "total_found": len(places),
                "valid_places": len(valid_places),
                "search_params": {
                    "latitude": lat,
                    "longitude": lng,
                    "radius_meters": radius
                }
            }
        })

    except Exception as e:
        import traceback
        print(f"Error in nearby_places: {str(e)}")
        print("Traceback:", traceback.format_exc())
        return jsonify({
            "error": "Server error",
            "details": {
                "message": str(e),
                "type": type(e).__name__
            }
        }), 500