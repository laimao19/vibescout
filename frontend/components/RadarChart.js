import React from 'react';
import { Radar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';

// Register the required components with Chart.js
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function RadarChart({ userData, placeData }) {
  // Update labels to reflect the selected features
  const data = {
    labels: ['Valence', 'Energy', 'Loudness', 'Ambiance', 'Liveness'],
    datasets: [
      {
        label: 'User Preferences',
        data: userData,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
      {
        label: 'Place Features',
        data: placeData,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  };

  // Customize options to enhance readability
  const options = {
    scales: {
      r: {
        suggestedMin: 0,
        suggestedMax: 1,
        angleLines: {
          display: true
        },
        ticks: {
          stepSize: 0.2,
          display: true
        }
      }
    }
  };

  return <Radar data={data} options={options} />;
}

export default RadarChart;
