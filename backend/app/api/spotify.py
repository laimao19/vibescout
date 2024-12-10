from flask import Blueprint, jsonify, request, session
import pandas as pd
import os
import random
import numpy as np
from sklearn.preprocessing import MinMaxScaler

bp = Blueprint('spotify', __name__, url_prefix='/api/spotify')

# Load the Spotify dataset with a different encoding
SPOTIFY_DATA = pd.read_csv('C:/Users/laima/fall2024/cs506/finalproject/vibescout/spotify-2023.csv', encoding='latin1')

# Initialize scaler for feature normalization
scaler = MinMaxScaler()

@bp.route('/data', methods=['GET'])
def get_spotify_data():
    try:
        # Convert DataFrame to list of dictionaries with proper data types
        tracks = []
        for _, row in SPOTIFY_DATA.iterrows():
            track = {
                'track_name': str(row['track_name']),
                'artist': str(row['artist(s)_name']),
                'valence': float(row['valence_%']) / 100,
                'energy': float(row['energy_%']) / 100,
                'danceability': float(row['danceability_%']) / 100,
                'acousticness': float(row['acousticness_%']) / 100,
                'instrumentalness': float(row['instrumentalness_%']) / 100,
                'liveness': float(row['liveness_%']) / 100,
                'speechiness': float(row['speechiness_%']) / 100,
                'streams': int(row['streams']) if pd.notnull(row['streams']) else 0,
                'popularity': int(row['in_spotify_playlists']) if pd.notnull(row['in_spotify_playlists']) else 0
            }
            tracks.append(track)
        
        return jsonify({
            'status': 'success',
            'tracks': tracks
        })
    except Exception as e:
        print(f"Error reading Spotify data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to load Spotify data',
            'error': str(e)
        }), 500

@bp.route('/random-profile', methods=['GET'])
def get_random_profile():
    try:
        # Randomly select 20 tracks from the dataset
        random_tracks = SPOTIFY_DATA.sample(n=20)
        track_data = create_track_data(random_tracks)
        session['user_profile'] = track_data
        return jsonify(track_data)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to generate random profile',
            'error': str(e)
        }), 500

@bp.route('/custom-profile', methods=['POST'])
def create_custom_profile():
    try:
        selected_tracks = request.json.get('tracks', [])
        if not selected_tracks or len(selected_tracks) > 10:
            return jsonify({
                'status': 'error',
                'message': 'Please select between 1 and 10 tracks'
            }), 400
        
        selected_data = SPOTIFY_DATA[SPOTIFY_DATA['track_name'].isin(selected_tracks)]
        track_data = create_track_data(selected_data)
        session['user_profile'] = track_data
        return jsonify(track_data)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to create custom profile',
            'error': str(e)
        }), 500

@bp.route('/available-tracks', methods=['GET'])
def get_available_tracks():
    try:
        search_query = request.args.get('query', '').lower()
        
        if search_query:
            filtered_data = SPOTIFY_DATA[
                SPOTIFY_DATA['track_name'].str.lower().str.contains(search_query) |
                SPOTIFY_DATA['artist(s)_name'].str.lower().str.contains(search_query)
            ]
        else:
            filtered_data = SPOTIFY_DATA
        
        tracks = filtered_data[['track_name', 'artist(s)_name']].to_dict('records')
        return jsonify({
            'status': 'success',
            'tracks': tracks
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch available tracks',
            'error': str(e)
        }), 500

@bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        profile = session.get('user_profile')
        if not profile:
            # Generate random profile if none exists
            random_tracks = SPOTIFY_DATA.sample(n=20)
            profile = create_track_data(random_tracks)
            session['user_profile'] = profile
        return jsonify({
            'status': 'success',
            'profile': profile
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': 'Failed to get profile',
            'error': str(e)
        }), 500

def create_track_data(tracks_df):
    track_data = []
    for _, track in tracks_df.iterrows():
        try:
            track_data.append({
                'track_name': str(track['track_name']),
                'artist': str(track['artist(s)_name']),
                'genre': 'Unknown',
                'valence': float(track['valence_%']) / 100,
                'energy': float(track['energy_%']) / 100,
                'acousticness': float(track['acousticness_%']) / 100,
                'danceability': float(track['danceability_%']) / 100,
                'instrumentalness': float(track['instrumentalness_%']) / 100,
                'liveness': float(track['liveness_%']) / 100,
                'speechiness': float(track['speechiness_%']) / 100
            })
        except Exception as e:
            print(f"Error processing track {track['track_name']}: {str(e)}")
            continue
            
    return track_data