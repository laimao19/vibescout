import numpy as np
from textblob import TextBlob
from sklearn.feature_extraction.text import TfidfVectorizer

def default_metadata():
    """Return default metadata structure when no data is available."""
    return {
        'sentiment': {
            'average': 0,
            'variance': 0
        },
        'review_quality': {
            'average_length': 0,
            'detail_variance': 0,
            'review_count': 0
        },
        'keywords': [],
        'emotional_stats': {
            'positivity': 0,
            'activity_level': 0
        }
    }

def build_metadata(data):
    """Build metadata object from analyzed data."""
    return {
        'sentiment': {
            'average': float(data['avg_sentiment']),
            'variance': float(data['sentiment_variance'])
        },
        'review_quality': {
            'average_length': float(data['avg_length']),
            'detail_variance': float(data.get('rating_variance', 0)),
            'review_count': len(data['reviews'])
        },
        'keywords': data.get('keywords', []),
        'emotional_stats': {
            'positivity': float(data['emotional_score']),
            'activity_level': float(data['activity_level'])
        }
    }

def extract_keywords(texts):
    """Extract top keywords from review texts using TF-IDF."""
    vectorizer = TfidfVectorizer(max_features=10, stop_words='english')
    X = vectorizer.fit_transform(texts)
    return vectorizer.get_feature_names_out()

def build_place_feature_vector(reviews):
    if not reviews:
        return np.zeros(8), default_metadata()  # Updated dimensions
    
    try:
        # Sentiment analysis
        sentiment_scores = [review.get('sentiment', 0) for review in reviews]
        avg_sentiment = np.mean(sentiment_scores) if sentiment_scores else 0
        sentiment_variance = np.var(sentiment_scores) if sentiment_scores else 0
        
        # Rating analysis
        ratings = [review.get('rating', 0) for review in reviews]
        avg_rating = np.mean(ratings) if ratings else 0
        rating_variance = np.var(ratings) if ratings else 0
        
        # Text analysis
        texts = [str(review.get('text', '')) for review in reviews if review.get('text')]
        avg_length = np.mean([len(text.split()) for text in texts]) if texts else 0
        keywords = extract_keywords(texts) if texts else []
        
        # Emotional content
        emotional_score = 0
        activity_level = 0
        if texts:
            combined_text = ' '.join(texts)
            blob = TextBlob(combined_text)
            emotional_score = blob.sentiment.polarity
            
            # Activity level based on action words
            activity_words = ['fun', 'busy', 'active', 'loud', 'quiet', 'peaceful', 'exciting']
            activity_level = sum(1 for word in activity_words if word in combined_text.lower()) / len(activity_words)

        # Feature vector
        feature_vector = np.array([
            avg_sentiment,
            sentiment_variance,
            avg_rating / 5,  # Normalized
            rating_variance,
            avg_length / 200,  # Normalized length
            emotional_score,
            activity_level,
            len(reviews) / 20  # Normalized review count
        ])

        return feature_vector, build_metadata({
            'avg_sentiment': avg_sentiment,
            'sentiment_variance': sentiment_variance,
            'avg_length': avg_length,
            'rating_variance': rating_variance,
            'reviews': reviews,
            'emotional_score': emotional_score,
            'activity_level': activity_level,
            'keywords': keywords
        })

    except Exception as e:
        print(f"Error building feature vector: {str(e)}")
        return np.zeros(8), default_metadata()
