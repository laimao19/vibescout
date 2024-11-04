# VibeScout - Personalized Recommendation Website

This project aims to build a personalized recommendation website that helps users decide on places to visit or dine at, based on their Spotify listening data and reviews of specific locations. Users can either input a specific place they're thinking of visiting, and the website will generate a summary of whether they might like it (based on reviews and keywords), or they can ask the website to suggest a list of places they might enjoy.

## Goals
- **Primary Goal**: Determine whether there is a meaningful relationship between Spotify listening habits and user reviews of locations.
  - Specifically, the focus will be on how audio features (e.g., energy, valence) and playlist types might predict a user’s likelihood to enjoy a place based on keyword and sentiment analysis of place reviews.
- **Secondary Goal**: Develop the capability for suggesting a list of potential places based on the user's music preferences.

## Data Collection
- **Spotify API Data**:
  - Collect user data such as top tracks and audio features.
  - Audio features will inform the user's general vibe and help categorize them by mood or energy.
- **Review and Keyword Data**: Gather reviews and locations of places from the Google Places API. Focus on keywords and sentiment extracted from reviews, which can then be cross-referenced with audio features from Spotify to find potential patterns.


## Modeling
Currently, the model I am using is content-based filtering to match the user's spotify profile with place attributes based on the similarity of feature vectors.
- **Feature Vectors for Places**: I construct feature vectors for each place based on sentiment analysis and TF-IDF keyword frequencies derived from reviews.
- **Similarity Calculation**: I use cosine similarity to calculate the similarity score between the user's Spotify preferences and each place's feature vector. Places with higher similarity scores are considered better matches.
- **Model Architecture**
  - User Vector: constructed using normalized Spotify data (with data such as energy, valence, danceability, etc. in the top tracks)
  - Place Vector: constructed using attributes from Google Places reviews (such as cleanliness, friendliness, etc.)
  - Cosine Similarity: used to quantify the "closeness" of a place to the user's preferences

These are some possibilities for me to additionally use to get more specific/accurate predictions for places to go:
- **Collaborative Filtering**: Using a matrix factorization approach (e.g. SVD or ALS), I would implement user-item collaborative filtering to predict a user's preference for unvisited places based on the preferences of similar users.
- **Hybrid Model (Collaborative + Content-Based)**: This model would combine collaborative filtering which looks at user preferences based on behavior with content-based filtering which looks at place features based on reviews. The CF (collaborative filtering) model would recommend places based on user similarity while refining recommendations using content-based features (keywords, sentiment) from the CBF (content-based filtering) model.

## Data Visualization
Though implementing all of these would be nice, these are all just potential ideas for me to add to the website and if I feel like one is unnecessary or ends up not being possible for me to implement I may replace it with something else.
- **Interactive Map Visualization (Google Maps Data)**: An interactive map where users can see their previously visited locations marked with different icons for what type of place it is (like restaurant or attraction) and potential new recommendations highlighted. You would be able to hover over each place for a brief summary. Show recommended places based on their "music personality."
- **Likelihood Plot**: Visualization that shows how likely a user is to enjoy a specific place or activity based on reviews and keywords. Some nice features to add would be to have an interactive slider where users can adjust certain preferences (like distance, rating threshold, or keywords) and the plot will dynamically update and a "confidence meter" that shifts in real-time showing the model's confidence for that recommendation. Visualization on how well a place matches their mood or music taste (e.g., based on energy level or genre preferences).
- **Word Cloud/Review Summaries**: A dynamic word cloud that summarizes the top keywords extracted from the reviews of places the user is considering that is animated where frequently mentioned words (positive or negative) grow larger and clicking on a word can filter recommendations based on that keyword.
- **Interactive Map Visualization (Google Maps Data)**: An interactive map where users can see their previously visited locations marked with different icons for what type of place it is (like restaurant or attraction) and potential new recommendations highlighted. You would be able to hover over each place for a brief summary. Show recommended places based on their "music personality."
- **Likelihood Plot**: Visualization that shows how likely a user is to enjoy a specific place or activity based on reviews and keywords. Some nice features to add would be to have an interactive slider where users can adjust certain preferences (like distance, rating threshold, or keywords) and the plot will dynamically update and a "confidence meter" that shifts in real-time showing the model's confidence for that recommendation. Visualization on how well a place matches their mood or music taste (e.g., based on energy level or genre preferences).
- **Word Cloud/Review Summaries**: A dynamic word cloud that summarizes the top keywords extracted from the reviews of places the user is considering that is animated where frequently mentioned words (positive or negative) grow larger and clicking on a word can filter recommendations based on that keyword.
- **Interactive Radar Chart (User Preferences vs. Recommendations)**: Spider plot with different axes representing preferences (e.g. food quality, ambiance, distance, etc.) that compares user preferences to the characteristics of the recommended places and overlays the user's past data with the new recommendations. Some cool features to add would be a slider that can adjust the weight of different factors.

## Test Plan
This is just in case I end up needing it later for training.
- **Test/Train Split**: 70-80% of the data for training, 20-30% for testing
- **Evaluation and Testing**:
  - **Metrics for Evaluation**: precision at K, mean average precision (MAP), root mean squared error (RMSE), hit rate
  - **Metrics for Evaluation**: precision at K, mean average precision (MAP), root mean squared error (RMSE), hit rate
  - **Testing Plan** (possible options): holdout testing, A/B testing (comparing two different models), k-folds (? not sure if this works for non CNNs (convolutional neural networks), majority voting algorithm
