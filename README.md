# VibeScout - Personalized Recommendation Website
Demo Video: https://youtu.be/-5RndqAICK8?si=vPzv68P_J7MVi8Y3

VibeScout is a personalized recommendation system website that helps users discover places to visit or dine at based on their music preferences and reviews of nearby locations. By leveraging Spotify data and sentiment analysis of Google Places reviews, VibeScout creates tailored suggestions to match users' unique vibes.

# Dataset Note
Originally, this website was meant to use the Spotify API to allow users to log in with their Spotify account and get more personalized recommendations. However, midway through my project, Spotify introduced changes to the way their Web API works so now I am no longer able to access audio features and analysis which were a crucial part of my original proposed project (https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api). Due to this, I shifted this project's focus to use a Kaggle dataset with the most streamed Spotify songs in 2023 (https://www.kaggle.com/datasets/nelgiriyewithana/top-spotify-songs-2023). The dataset is provided in this GitHub repo, so downloading is not necessary.

# Features
## Core Functionalities
1. **Interactive Map**: Displays nearby places with markers for recommendations and user location.
2. **Content-Based Recommendations**: Uses Spotify and Google Places data to suggest locations based on similarity scores.
3. **Bar Chart Visualization**: Compares user music preferences with attributes of a given place that was searched up.
4. **Dynamic Word Cloud**: Highlights informative keywords from reviews of a given place.
5. **Informative Descriptions about Songs and Recommended Places**: Attributes such as danceability, energy, crowd vibe, etc. are provided about the songs that are attributed with your profile and the recommended places.

## User Experience
- Users can customize their music profiles by selecting songs or generating a random profile.
- Recommendations are diverse and filtered to exclude irrelevant places such as hotels or medical facilities.
- Each recommendation includes detailed metrics like music match, crowd vibe, and overall mood.

# Code Structure
## Backend
- `places.py`: Fetches nearby places using the Google Places API, filters invalid results, excludes certain categories (e.g., lodging, medical facilities) to give more relevant recommendations to the user, and logs detailed information for debugging and reproducibility.
- `reviews.py`: Retrieves and analyzes Google Places reviews, and extracts sentiment and keywords using TextBlob and CountVectorizer.
- `spotify.py`: Loads Spotify data, allows users to customize or randomly generate a music profile, and normalizes audio features like valence, energy, and danceability.
- `recommendation.py`: Implements the content-based filtering model, calculates similarity scores between user profiles and place attributes, and ensures diversity in recommendations (giving a slight randomness to recommendations so not only the absolute best ones every time show up).
- `content_based.py`: Constructs feature vectors for places using reviews and keywords and handles sentiment analysis and text processing for enhanced place descriptions.

## Frontend
- `Map.js`: Displays places and recommendations on an interactive Google Map and allows users to view directions and details for each recommendation.
- `BarChart.js`: Renders a bar chart comparing user preferences (e.g., valence, energy) to place attributes and provides a clear visual representation of the match between user profiles and places.
- `MusicProfile.js`: Manages the user’s Spotify profile, allows users to select tracks or generate random profiles, and updates user preferences based on selected tracks.
- `RecommendationCard.js`: Displays detailed information about each recommended place, including: music match percentage, crowd vibe and mood metrics., keywords derived from reviews.
- `WordCloud.js`: Dynamically generates a word cloud visualization using review data, highlights frequently mentioned keywords in reviews to help users understand the attributes of a place, and built with customizable options for interactivity and appearance.

# Data Collection and Processing
## Spotify Data
- **Source**: https://www.kaggle.com/datasets/nelgiriyewithana/top-spotify-songs-2023
- **Processing**: The Spotify dataset contains audio features for songs, which were used to construct the user's music preference profile. The primary preprocessing steps were to first do feature selection of the main features such as valence, energy, danceability, acousticness, etc. and these were selected for their relevance in constructing a meaningful "user vibe". Streams and the value of how many Spotify playlists the songs were in were excluded from user profiling. To ensure comparability across features, all features were normalized to a 0-1 range using Min-Max scaling to preserve the relative importance of features while allowing them to contribute equally to similarity calculations.

## Google Places Data
- **Source**: Google Places API
- **Processing**: The Google Places API provides place details, including reviews, which were processed into feature vectors representing each place. Up to 5 reviews were fetched per places within a specified search radius and the reviews included text, a rating, an author name, and the timestamp. The TextBlob library was used to calculate a sentiment score for each review between -1 and +1 and the TfidfVectorizer was applied to reviews to identify the most relevant words based on TF-IDF and the top 5 keywords for each place were retained. Places without adequate review data were excluded, and certain place types such as hospitals, universities, and religious centers were excluded using a predefined list to give more relevant recommendations.

# Modeling
## Content-Based Filtering
1. **User Vector**: The user profile is built using Spotify-derived features, which are normalized to a 0-1 range for consistent comparisons. The features used are:
   - Valence: A measure of musical positivity or happiness
   - Energy: The perceived intensity or activity level of the music
   - Danceability: A score reflecting how suitable a track is for dancing
   - Acousticness: A measure of how acoustic a track is
   - Instrumentalness: The likelihood of a track being instrumental
   - Liveness: A measure of how "live" the track sounds and speechiness: How much speech-like content the track has.
   - For a user: each track's audio features are retrieved from the Kaggle dataset and these features are averaged across selected or randomly generated tracks to form a user profile vector.
3. **Place Vector**: Places are represented by feature vectors constructed from Google Places API reviews. The following attributes are extracted from reviews to create place feature vectors:
   - Sentiment: the average sentiment score of all reviews, computed using TextBlob
   - Sentiment variance: the variability of sentiments across reviews, indicating polarizing or consistent opinions
   - Average review length: captures how detailed reviews are, reflecting the effort users put into describing their experience
   - Keyword frequencies: extracted using TfidfVectorizer, and these represent frequently mentioned aspects of the place (e.g., "cozy," "clean," "crowded")
   - Emotional score: an aggregate score that reflects the overall positivity or negativity of the reviews
   - Activity Level: a score based on the presence of activity-related keywords (e.g., "loud," "fun," "peaceful").
   - For a given place: up to 5 reviews are fetched via the Google Places API, sentiment analysis and keyword extraction are performed on these reviews, and features are normalized to comparable scales and aggregated into an 8-dimensional vector.
5. **Cosine Similarity**: To match users with places, cosine similarity is used. This measures the "angle" between the two vectors, with values ranging from -1 (completely opposite) to +1 (perfect match). A higher similarity score indicates a better match between the user's preferences and the place's attributes. Adjustments: distance factor: recommendations are adjusted based on distance from the user's location. Places further away require higher similarity scores to be considered and randomness: a small random factor is added to introduce diversity in recommendations.

# Visualizations
![Alt Text](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExMGI1NzUxeDN0bWk5YjVobXo3NTJ0YnY1eWk5enBmMDAxcXVrYmQ4diZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wuwmcTyfsREqhe4OIs/giphy.gif)
1. **Interactive Map**: Highlights recommendations with dynamic markers.

![Alt Text](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExdjNsOTN2M2E0ZXQ3d2xocDN6OGQ3d3U0OHg2M3NldTl3ODl2YzM3ZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xEzyuUALUIFMs3rBth/giphy.gif)

2. **Bar Chart**: Compares user preferences with place attributes side by side and provides clear insights into recommendation alignment.

![Alt Text](https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGNwODhtbngzbHd6N3J6am80ZDA0YzNhdnE2MDZpd3N6dXoweG55ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yMSUZOCcWWeWa6Bg1S/giphy.gif)

3. **Word Cloud**: Summarizes frequently mentioned keywords from place reviews and dynamically updates based on the selected place.


# Results
The results of the VibeScout project demonstrate the potential for integrating music preferences and place reviews into a personalized recommendation system. The model outputs a ranked list of places tailored to the user's Spotify profile, with insights into the places' crowd vibe, overall mood, and alignment with the user's preferences. Below is a detailed breakdown of the key findings, observations, and outcomes.

My content-based filtering model can find recommendations for places based on a given music profile with up to a 100% "match" and accurately define a place's crowd vibe and mood as chill, relaxed, balanced, or upbeat and as validated by my own experience and further research into the places recommended. This seems to indicate that the content-based filtering model is performing well with the given user and place vectors as information to recommend places, however, I believe that there seems to be a core issue either on the side of the Google Places API or with the way that I process the Google Places API's given places within a certain radius of my location. I believe there to be an issue because though if I change my listening profile I do get some variation in the "music profile match" percentage, I do not tend to get new places recommended at all varying from 5 miles to 30 miles. On average, one or two new places may show up as recommended to me if I expand the radius for recommendations but more often than not the recommendations list does not change at all. Therefore, I speculate if this is an issue on the side of my content-based filtering model, perhaps I am not giving the model features that vary enough with different places and only the same set of places really even qualify to be recommended. However, I believe perhaps it may also be on the Google Places API side as, during debugging stages, when I print out ALL of the places that the API sends initially to me without any filtering they are always the same places no matter the distance. A possible fix for this could be to use the new version of the Places API instead of the old one as it may have more information available but using the new Places API requires a paid plan, so for now I will stick with the old version.

When it comes to generating the word cloud and also generating place attributes for a given place that is searched up, first, it seems that my approach of using TF-IDF vectorization and removing stop-words that are words like "the", "and", etc. has allowed for the word cloud to no longer have the previous issue of having irrelevant words present. However, with certain places when searched up, it does happen sometimes for some places that words like "like", "little", "would" etc still do show up unfortunately despite my rigorous filtering for these types of words. I believe that to completely remove these types of words but also keep an abundance of words still present to be able to accurately describe the type of place that was searched, I would need to do more rigorous NLP-type filtering and perhaps include other types of information other than reviews such as the places' Google description if they have one. With regards to the place attributes generated for a given place (which is displayed on the bar chart in comparison to a user's music profile attributes), every time I put in a new place that varies from the previous one the attributes do change noticeably with each of the different factors (valence, energy, loudness, ambiance, and liveness) and it seems to match up to my own research, experience, and also if the place was one that was recommended on the website it also seems to match up with the crowd vibe and overall mood assignments.

# Reproducing the Code
## Installation
1. Clone the repository
   ```
   git clone https://github.com/yourusername/vibescout.git
   cd vibescout
   ```
2. Install backend and frontend dependencies
   ```
   make install
   ```
If you have any issues with installation, please `cd` accordingly into backend and do `pip install` or into frontend and do `npm install`

## Running the Project
1. Start the backend in one terminal tab
      ```
   make run-backend
   ```
2. Start the frontend in another terminal tab
      ```
    make run-frontend
   ```
My Makefile is optimized for Windows machines as that is the machine that I created the code on, so you may need to adjust some things in the Makefile if you do not have a Windows machine.

**IMPORTANT NOTE**: You also need a Google Places API key in order to be able to properly run this as well as a flask secret key. On the backend, you will need to have a `.env` file that holds 
```
FLASK_ENV=development
GOOGLE_API_KEY="yourkeyhere"
FLASK_SECRET_KEY="yourkeyhere"
```
On the frontend, you will also need a `.env.local` file that holds
```
NEXT_PUBLIC_GOOGLE_API_KEY=yourkeyhere
NEXT_PUBLIC_API_URL=http://localhost:5000
```

# Contributing
Contributions are welcome! Please:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature-branch-name`).
3. Commit changes (`git commit -m "Add feature"`).
4. Push to the branch (`git push origin feature-branch-name`).
5. Open a pull request.
