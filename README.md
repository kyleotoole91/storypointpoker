# Story Point Poker

A real-time story point poker app for Scrum teams built with React, Vite, and Socket.IO. Supports multiple teams using the app simultaneously and includes both Fibonacci and T-shirt size voting systems.

## Features

- Real-time voting with WebSocket communication
- Support for multiple concurrent teams in separate rooms
- Choice between Fibonacci numbers and T-shirt sizes
- Visual results with pie charts
- Session persistence (remembers your name and room)
- Responsive design with Ocuco branding

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Development

1. Start the backend server:
```bash
npx tsx server/server.ts
```

2. In a separate terminal, start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Production Build

1. Build the frontend:
```bash
npm run build
```

This will create a `dist` folder with the production-ready assets.

2. To run the production build:

First, install a static file server if you haven't already:
```bash
npm install -g serve
```

Then serve the built files:
```bash
serve -s dist
```

The backend server still needs to be running:
```bash
npx tsx server/server.ts
```

## Usage

1. Open the app in your browser
2. Enter your name and a room ID (create a new room or join an existing one)
3. Share the room ID with your team members
4. Choose your voting system (Fibonacci or T-shirt sizes)
5. Vote on story points
6. Click "Reveal Cards" to show all votes
7. Use "Reset Votes" to start a new round

## Technical Details

- Frontend: React + TypeScript + Vite
- Backend: Express + Socket.IO
- State Management: React hooks + Socket.IO events
- Visualization: Chart.js with react-chartjs-2
