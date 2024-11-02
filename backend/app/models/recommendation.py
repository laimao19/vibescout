from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def recommend_places(user_vibe, reviews_data):
    user_vector = np.array([user_vibe['valence'], user_vibe['energy'], user_vibe['danceability']])
    recommendations = []

    for review in reviews_data:
        review_vector = np.array([review['sentiment'], np.mean(review['keywords'])])  # Customize to your needs
        similarity = cosine_similarity([user_vector], [review_vector])[0][0]
        recommendations.append((review['text'], review['rating'], similarity))

    recommendations.sort(key=lambda x: x[2], reverse=True)  # Sort by similarity score
    return recommendations[:5]  # Return top 5 recommendations
