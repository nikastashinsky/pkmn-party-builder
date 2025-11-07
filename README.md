# Pokémon Team Builder & Assessor

A single-file React application that lets you build a Pokémon team and receive personalized narrative assessments with statistical analysis.

<img width="1454" height="1043" alt="Screenshot 2025-11-07 at 11 00 21 AM" src="https://github.com/user-attachments/assets/c9cad025-10cd-4392-869b-5b9b06d3613b" />


https://github.com/user-attachments/assets/fc07f4ff-ba9e-4e40-a9ea-c362a73104e2


<img width="967" height="875" alt="Screenshot 2025-11-07 at 11 16 24 AM" src="https://github.com/user-attachments/assets/8ace8366-4903-46b2-8a2a-9ee33a1506e5" />


## Features

- **Team Building**: Build a team of 6 Pokémon by searching and adding them to slots
- **Personality Assessment**: Input your Chinese Zodiac, Astral Sign, and Favorite Color
- **Personalized Narrative**: Receive a custom legend based on your personality traits
- **Statistical Analysis**: View Raw Power Score (RPS) and Type Diversity Score (DS)
- **Data Visualization**: Interactive Radar and Donut charts using Chart.js
- **Final Assessment**: Get color-coded overall score with personalized feedback

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)

## Usage

1. Click on an empty slot to search for a Pokémon
2. Enter a Pokémon name or ID and click "Search"
3. Review the Pokémon's stats and click "Add to Team"
4. Repeat until all 6 slots are filled
5. Click "Assess My Team!" to begin the assessment
6. Fill in your personality information and generate your legend
7. View statistical analysis and final assessment

## Technologies

- React 18
- Tailwind CSS
- Chart.js & react-chartjs-2
- PokeAPI

## Project Structure

- `App.jsx` - Main application component (single-file structure)
- `src/main.jsx` - React entry point
- `src/index.css` - Tailwind CSS imports
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind configuration

