import React from 'react';
import WordCloud from 'react-wordcloud';

const options = {
  enableTooltip: true,
  fontSizes: [20, 80], // Adjusted font size range
  rotations: 2,
  rotationAngles: [-90, 0]
};

const WordCloudComponent = ({ words }) => (
  <WordCloud words={words} options={options} />
);

export default WordCloudComponent;
