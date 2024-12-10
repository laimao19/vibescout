// Import necessary modules
import React from 'react';
import WordCloud from 'react-wordcloud';

// List of common stop words to filter out
const stopWords = new Set([
  'the', 'is', 'and', 'or', 'of', 'to', 'a', 'in', 'it', 'on', 'for', 'with', 'was', 'this', 'that', 'at', 'as', 'an', 
  'by', 'be', 'are', 'from', 'but', 'not', 'we', 'you', 'i', 'me', 'my', 'so', 'your', 'their', 'they', 'if', 'can',
]);

// Function to calculate TF-IDF
const calculateTFIDF = (reviews) => {
  const termCounts = {}; // Term frequency across all reviews
  const docCount = reviews.length; // Total number of reviews

  reviews.forEach((review) => {
    const words = review.text.toLowerCase().split(/\W+/); // Tokenize text and normalize case
    const uniqueWords = new Set(words); // Count each word only once per document

    uniqueWords.forEach((word) => {
      if (!termCounts[word]) {
        termCounts[word] = { count: 0, docFrequency: 0 };
      }
      termCounts[word].docFrequency += 1;
    });

    words.forEach((word) => {
      if (termCounts[word]) {
        termCounts[word].count += 1;
      }
    });
  });

  // Calculate TF-IDF scores
  const tfidfScores = Object.entries(termCounts).map(([term, { count, docFrequency }]) => {
    const tf = count / docCount; // Term Frequency (normalized)
    const idf = Math.log(docCount / (docFrequency + 1)); // Inverse Document Frequency
    return { term, score: tf * idf };
  });

  // Filter out stop words, short words, and low scores
  return tfidfScores
    .filter(({ term, score }) => 
      !stopWords.has(term) && term.length > 2 && score > 0.35 // Adjust threshold as needed
    )
    .sort((a, b) => b.score - a.score); // Sort by score in descending order
};

// WordCloud Component
const WordCloudComponent = ({ reviews }) => {
  // Calculate TF-IDF for reviews
  const tfidfScores = calculateTFIDF(reviews);

  // Convert TF-IDF scores into WordCloud-compatible data
  const words = tfidfScores.map(({ term, score }) => ({
    text: term,
    value: score,
  }));

  // WordCloud options
  const options = {
    colors: ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#A78BFA'],
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'Inter',
    fontSizes: [24, 80],
    fontStyle: 'normal',
    fontWeight: 'bold',
    padding: 6,
    rotations: 2,
    rotationAngles: [0],
    scale: 'sqrt',
    spiral: 'rectangular',
    transitionDuration: 1000,
  };

  const callbacks = {
    getWordTooltip: (word) => `${word.text}: TF-IDF score ${word.value.toFixed(2)}`,
  };

  return (
    <div className="wordcloud-container">
      <h2 className="text-xl font-bold text-white mb-4">Word Cloud</h2>
      <WordCloud words={words} options={options} callbacks={callbacks} />
    </div>
  );
};

export default WordCloudComponent;
