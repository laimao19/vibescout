from flask import Blueprint, jsonify, redirect, request, session, url_for
import spotipy
from spotipy.oauth2 import SpotifyOAuth
import os

bp = Blueprint('spotify', __name__, url_prefix='/api/spotify')

sp_oauth = SpotifyOAuth(
    client_id=os.getenv("SPOTIPY_CLIENT_ID"),
    client_secret=os.getenv("SPOTIPY_CLIENT_SECRET"),
    redirect_uri=os.getenv("SPOTIPY_REDIRECT_URI"),  # Use the redirect URI from .env
    scope="user-top-read"
)

@bp.route('/login', methods=['GET'])
def login():
    auth_url = sp_oauth.get_authorize_url()
    return redirect(auth_url)

@bp.route('/callback', methods=['GET'])
def callback():
    code = request.args.get('code')
    if not code:
        return "Authorization code not found.", 400
    # Retrieve the token
    token_info = sp_oauth.get_access_token(code)
    session['token_info'] = token_info
    
    # Redirect back to the frontend with a success flag or message
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    return redirect(f"{frontend_url}/?spotify_login=success")

@bp.route('/user-data', methods=['GET'])
def get_spotify_data():
    token_info = session.get('token_info')
    if not token_info:
        return redirect(url_for('spotify.login'))

    sp = spotipy.Spotify(auth=token_info['access_token'])
    top_tracks = sp.current_user_top_tracks(limit=20)
    track_data = []
    for track in top_tracks['items']:
        audio_features = sp.audio_features(track['id'])[0]

        track_data.append({
            'track_name': track['name'],
            'artist': track['artists'][0]['name'],
            'genre': 'Unknown',  # Spotify track data doesn't include genres
            'valence': audio_features.get('valence'),
            'energy': audio_features.get('energy'),
            'acousticness': audio_features.get('acousticness'),
            'danceability': audio_features.get('danceability'),
            'duration_ms': audio_features.get('duration_ms'),
            'instrumentalness': audio_features.get('instrumentalness'),
            'key': audio_features.get('key'),
            'liveness': audio_features.get('liveness'),
            'loudness': audio_features.get('loudness'),
            'mode': audio_features.get('mode'),
            'speechiness': audio_features.get('speechiness'),
            'tempo': audio_features.get('tempo'),
            'time_signature': audio_features.get('time_signature'),
            'track_href': audio_features.get('track_href'),
            'analysis_url': audio_features.get('analysis_url'),
            'uri': audio_features.get('uri')
        })

    return jsonify(track_data)