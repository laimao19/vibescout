# VibeScout - Personalized Recommendation Website

This project aims to build a personalized recommendation website that helps users decide on places to visit or dine at, based on their Spotify listening data and reviews of specific locations. Users can either input a specific place they're thinking of visiting, and the website will generate a summary of whether they might like it (based on reviews and keywords), or they can ask the website to suggest a list of places they might enjoy based on past behavior and preferences.

## Goals
- Develop a recommendation system that summarizes whether a user will like a specific place based on their spotify listening history (their "personality" profile), reviews, and keywords with a high likelihood that they will like that recommendation
- Suggest a list of potential places (within the area specified) for a user to visit if they don't have a specific location in mind.

## Data Collection
- **Spotify API Data**:
  - User’s Top Tracks/Artists: Get the user’s most-played tracks or artists to infer their general music taste.
  - Audio Features of Tracks: Use Spotify's audio features for tracks, such as energy, tempo, danceability, and valence, to gain insight into the user's personality and mood.
  - User’s Playlists: Analyze the types of playlists the user creates (e.g., workout playlists, chill playlists) to understand their habits and preferences.
- **Review and Keyword Data**: Review data and associated keywords for places will be gathered from APIs such as the Google Places API and Yelp Fusion API. Reviews will be analyzed to extract keywords and sentiments related to those locations.

## Feature Extraction
Just to be more specific on what features I want to extract from the data I've collected, I've listed the features here:
- **User Music Preferences**: Genres: Determine what genres (e.g., rock, pop, jazz) are most prominent in their listening habits. Mood and Energy: Based on the audio features (valence, energy), categorize the user’s overall mood and energy. Titles to Playlists: gym listening session, for picnics, etc.
- 
## Modeling
Currently, I do not have a set machine-learning model in mind for this project. However, here are some possibilities for me to use:
- **Collaborative Filtering**: Using a matrix factorization approach (e.g. SVD or ALS), I would implement user-item collaborative filtering to predict a user's preference for unvisited places based on the preferences of similar users.
- **Content-Based Filtering**: I would use Natural Language Processing (NLP) to analyze the content of reviews, extract meaningful features (keywords, sentiment) from the text, and use tools to perform tokenization, lemmatization, and stopword removal on review text. Additionally, TF-IDF (Term Frequency-Inverse Document Frequency) would be applied to vectorize the text and identify important keywords associated with each place, and a pre-trained sentiment analysis model (like VADER or BERT) would be used to determine the overall sentiment (positive, neutral, negative) of reviews for each place. Then, after building a profile for each place and getting the keywords, sentiments, and ratings, I would match the user's past preferences to new places with similar features. Use the music features (e.g., energy, tempo, valence) to match places that reflect the user's vibe.
- **Hybrid Model (Collaborative + Content-Based)**: This model would combine collaborative filtering which looks at user preferences based on behavior with content-based filtering which looks at place features based on reviews. The CF (collaborative filtering) model would recommend places based on user similarity while refining recommendations using content-based features (keywords, sentiment) from the CBF (content-based filtering) model.

## Data Visualization
Though implementing all of these would be nice, these are all just potential ideas for me to add to the website and if I feel like one is unnecessary or ends up not being possible for me to implement I may replace it with something else.
- **Interactive Map Visualization (Google Maps Data)**: An interactive map where users can see their previously visited locations marked with different icons for what type of place it is (like restaurant or attraction) and potential new recommendations highlighted. You would be able to hover over each place for a brief summary. Show recommended places based on their "music personality."
- **Likelihood Plot**: Visualization that shows how likely a user is to enjoy a specific place or activity based on reviews and keywords. Some nice features to add would be to have an interactive slider where users can adjust certain preferences (like distance, rating threshold, or keywords) and the plot will dynamically update and a "confidence meter" that shifts in real-time showing the model's confidence for that recommendation. Visualization on how well a place matches their mood or music taste (e.g., based on energy level or genre preferences).
- **Word Cloud/Review Summaries**: A dynamic word cloud that summarizes the top keywords extracted from the reviews of places the user is considering that is animated where frequently mentioned words (positive or negative) grow larger and clicking on a word can filter recommendations based on that keyword.
- **Interactive Radar Chart (User Preferences vs. Recommendations)**: Spider plot with different axes representing preferences (e.g. food quality, ambiance, distance, etc.) that compares user preferences to the characteristics of the recommended places and overlays the user's past data with the new recommendations. Some cool features to add would be a slider that can adjust the weight of different factors.

## Test Plan
- **Test/Train Split**: 70-80% of the data for training, 20-30% for testing
  - I may split up my data temporally (since user visits are time-based I could use earlier visits for training and reserve more recent visits for testing) or I could just do random split
- **Evaluation and Testing**:
  - **Metrics for Evaluation**: precision at K, mean average precision (MAP), root mean squared error (RMSE), hit rate
  - **Testing Plan** (possible options): holdout testing, A/B testing (comparing two different models), k-folds (? not sure if this works for non CNNs (convolutional neural networks), majority voting algorithm
