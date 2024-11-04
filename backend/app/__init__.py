# backend/app/__init__.py
from flask import Flask
from flask_cors import CORS
from .api import reviews, spotify, google_places  # Ensure this imports the correct modules
from .api.places import places_bp
from .models.recommendation import recommendations_bp  # Import the new recommendations blueprint
import os

def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

    app.secret_key = os.getenv("FLASK_SECRET_KEY", "your_default_secret_key")
    
    # Register Blueprints
    app.register_blueprint(reviews.bp)
    app.register_blueprint(spotify.bp)
    app.register_blueprint(google_places.bp)
    app.register_blueprint(places_bp)
    app.register_blueprint(recommendations_bp)  # Register the recommendations blueprint

    return app
