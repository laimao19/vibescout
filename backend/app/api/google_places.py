# In backend/app/api/google_places.py
from flask import Blueprint, request, jsonify
import requests
import os

bp = Blueprint('google_places', __name__, url_prefix='/api/google_places')

@bp.route('/autocomplete', methods=['GET'])
def autocomplete():
    input_text = request.args.get('input')
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    if not input_text:
        return jsonify({"error": "Input text is required"}), 400

    url = f"https://maps.googleapis.com/maps/api/place/autocomplete/json"
    params = {
        "input": input_text,
        "key": google_api_key
    }
    
    response = requests.get(url, params=params)
    return jsonify(response.json())
