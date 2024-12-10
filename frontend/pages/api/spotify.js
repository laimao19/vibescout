import fs from 'fs';
import Papa from 'papaparse';

export default function handler(req, res) {
  try {
    const fileContent = fs.readFileSync('C:/Users/laima/fall2024/cs506/finalproject/vibescout/spotify-2023.csv', 'latin1');
    const result = Papa.parse(fileContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true
    });
    res.status(200).json(result.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load data' });
  }
}