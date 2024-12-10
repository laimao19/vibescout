# content_based.py
import numpy as np
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer

def process_review_text(reviews):
    """Process review texts into a single string"""
    return " ".join([str(review.get('text', '')) for review in reviews if review.get('text')])

def build_place_feature_vector(reviews):
    """Build feature vector from reviews with error handling"""
    if not reviews:
        return np.zeros(6), {
            'sentiment': {'average': 0, 'variance': 0},
            'review_quality': {'average_length': 0, 'detail_variance': 0},
            'keywords': []
        }

    try:
        # Extract sentiment scores
        sentiment_scores = [review.get('sentiment', 0) for review in reviews]
        avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0
        sentiment_variance = np.var(sentiment_scores) if sentiment_scores else 0

        # Process review texts
        texts = [str(review.get('text', '')) for review in reviews if review.get('text')]
        avg_length = np.mean([len(text.split()) for text in texts]) if texts else 0
        
        # Get keywords using TF-IDF
        if texts:
            vectorizer = TfidfVectorizer(
                max_features=10,
                stop_words='english',
                ngram_range=(1, 2)
            )
            try:
                tfidf_matrix = vectorizer.fit_transform(texts)
                feature_names = vectorizer.get_feature_names_out()
                tfidf_scores = np.asarray(tfidf_matrix.mean(axis=0)).ravel()
                
                # Get top keywords
                top_indices = tfidf_scores.argsort()[-5:][::-1]
                keywords = [(feature_names[i], float(tfidf_scores[i])) 
                          for i in top_indices]
            except Exception as e:
                print(f"Error in TF-IDF processing: {str(e)}")
                keywords = []
        else:
            keywords = []

        # Build feature vector
        feature_vector = np.array([
            avg_sentiment,
            sentiment_variance,
            avg_length / 100,  # Normalize length
            len(keywords) / 10,  # Keyword diversity
            np.mean([review.get('rating', 0) for review in reviews]) / 5,  # Normalized rating
            1 if keywords else 0  # Has meaningful content
        ])

        metadata = {
            'sentiment': {
                'average': float(avg_sentiment),
                'variance': float(sentiment_variance)
            },
            'review_quality': {
                'average_length': float(avg_length),
                'review_count': len(reviews)
            },
            'keywords': [{'word': word, 'score': float(score)} for word, score in keywords]
        }

        return feature_vector, metadata

    except Exception as e:
        print(f"Error building feature vector: {str(e)}")
        return np.zeros(6), {
            'sentiment': {'average': 0, 'variance': 0},
            'review_quality': {'average_length': 0, 'detail_variance': 0},
            'keywords': []
        }