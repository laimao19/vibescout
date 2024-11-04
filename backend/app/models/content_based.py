# content_based.py
import numpy as np
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer

def process_review_text(reviews):
    place_reviews_text = " ".join([review['text'] for review in reviews])
    return place_reviews_text

def get_sentiment_score(text):
    return TextBlob(text).sentiment.polarity

def get_tfidf_keywords(reviews, max_features=5):
    texts = [process_review_text(reviews)]
    vectorizer = TfidfVectorizer(max_features=max_features, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(texts)
    feature_names = vectorizer.get_feature_names_out()
    tfidf_scores = tfidf_matrix.toarray()[0]
    return {feature_names[i]: tfidf_scores[i] for i in range(len(feature_names))}

def build_place_feature_vector(reviews):
    sentiment_scores = [review.get('sentiment', 0.5) for review in reviews]
    average_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0.5
    sentiment_variance = np.var(sentiment_scores) if sentiment_scores else 0

    review_lengths = [len(review.get('text', '')) for review in reviews]
    average_review_length = np.mean(review_lengths) if review_lengths else 50

    keywords = ["clean", "comfortable", "friendly"]
    keyword_counts = [sum(1 for review in reviews if kw in review.get('text', '').lower()) for kw in keywords]

    # Normalize values for consistent scaling
    normalized_average_sentiment = average_sentiment / 1  # Sentiment ranges from -1 to 1
    normalized_sentiment_variance = sentiment_variance / 1  # Variance is relative
    normalized_review_length = average_review_length / 100  # Typical review length scaling

    # Combine features into a normalized vector
    return np.array([
        normalized_average_sentiment,
        normalized_sentiment_variance,
        normalized_review_length,
    ] + keyword_counts)
