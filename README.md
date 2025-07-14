# Chess App Frontend

This is the frontend for the Chess App, built with React, Tailwind CSS, and Axios. It provides a modern, responsive UI for playing real-time chess with authentication and user management.

## Features
- User authentication (signup, login, JWT-based session)
- Real-time chess gameplay via WebSocket
- Move validation, visual move hints, and check detection
- Responsive design with Tailwind CSS
- Toast notifications for game and connection events

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Setup
1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
2. Configure environment variables:
   - Create a `.env` file if needed (see `.env.example` if present).
   - Set the backend API URL and WebSocket URL if different from default.

### Development
To start the development server:
```bash
npm run dev
# or
yarn dev
```
The app will be available at [http://localhost:5173](http://localhost:5173) by default.

### Production Build
To build for production:
```bash
npm run build
# or
yarn build
```
The static files will be output to the `dist/` directory.

### Deployment
- Deploy the contents of `dist/` to your preferred static hosting (Vercel, Netlify, etc.).
- Ensure the backend API and WebSocket server are accessible from the deployed frontend.

## Environment Variables
- `VITE_API_URL` - The base URL for the backend API (default: `http://localhost:5000/api`)
- `VITE_WS_URL` - The WebSocket server URL (default: `ws://localhost:5000`)

## Project Structure
- `src/` - React components and logic
- `public/` - Static assets
- `index.html` - Main HTML entry point

## License
MIT
