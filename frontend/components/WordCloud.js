import React from 'react';
import WordCloud from 'react-wordcloud';

const WordCloudComponent = ({ words, reviews }) => {
  // Process words to include sentiment
  const processedWords = words.map(word => {
    let totalSentiment = 0;
    let occurrences = 0;

    // Find this word in reviews and calculate average sentiment
    reviews.forEach(review => {
      if (review.keywords && review.keywords.includes(word.text)) {
        totalSentiment += (review.sentiment || 0.5);
        occurrences++;
      }
    });

    const avgSentiment = occurrences > 0 ? totalSentiment / occurrences : 0.5;

    // Determine color based on sentiment
    let color;
    if (avgSentiment > 0.6) {
      color = '#2ecc71'; // Green for positive
    } else if (avgSentiment < 0.4) {
      color = '#e74c3c'; // Red for negative
    } else {
      color = '#3498db'; // Blue for neutral
    }

    return {
      ...word,
      color,
      // Adjust value (size) based on both frequency and sentiment intensity
      value: word.value * (Math.abs(avgSentiment - 0.5) + 0.5)
    };
  });

  const options = {
    enableTooltip: true,
    fontSizes: [20, 80],
    rotations: 2,
    rotationAngles: [-90, 0],
    fontFamily: 'Inter',
    fontWeight: 'bold',
    padding: 3,
    deterministic: true, // Makes layout consistent between renders
    tooltipOptions: {
      content: (word) => `${word.text} (Mentions: ${word.originalValue}, Sentiment: ${word.sentiment?.toFixed(2)})`,
    }
  };

  const callbacks = {
    getWordTooltip: (word) => {
      const sentiment = word.sentiment > 0.6 ? "Positive" : word.sentiment < 0.4 ? "Negative" : "Neutral";
      return `${word.text} (${sentiment})`;
    },
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <WordCloud 
        words={processedWords} 
        options={options}
        callbacks={callbacks}
      />
    </div>
  );
};

export default WordCloudComponent;