A full-stack space travel management system. Google Maps meets an airline booking system, but for intergalactic travel.
What It Does

Browse planets and star systems
Find the best route between any two planets (fastest, safest, cheapest)
Track ships and missions
Real-time mission updates (coming soon)

Tech Stack
LayerTechnologyDatabasePostgreSQLBackendNode.js + ExpressFrontendReact (coming soon)PathfindingDijkstra's AlgorithmReal-timeSocket.IO (coming soon)VisualizationD3.js / Three.js (coming soon)
Project Structure
travel/
└── backend/
    ├── index.js       # Express server + API endpoints
    ├── .env           # Database config (do not commit)
    └── package.json
Database Schema

planets — name, galaxy, x/y coordinates
ships — name, speed, fuel capacity
routes — connections between planets with distance and danger level
missions — tracks ship journeys and status

API Endpoints
MethodEndpointDescriptionGET/planetsList all planetsPOST/planetsAdd a planetGET/shipsList all shipsPOST/shipsAdd a shipGET/routesList all routesPOST/routesAdd a routeGET/missionsList all missionsPOST/missionsCreate a missionGET/best-route?start=1&end=5Find shortest path between planets
Getting Started
Prerequisites

Node.js
PostgreSQL (MSYS2: pacman -S mingw-w64-ucrt-x86_64-postgresql)

Setup

Start PostgreSQL:

bashpg_ctl -D /ucrt64/var/lib/postgresql/data start

Install dependencies:

bashcd backend
npm install

Configure .env:

DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=intergalactic_travel
DB_PORT=5432

Run the server:

bashnode index.js

Test it:

http://localhost:3000/planets

RoadMAP
Database setup 
REST API(planets, ships, routes, missions) 
Dijkstra shortest path algorithm 
React frontend 
Galaxy map visualization 
Real time mission tracking 
Authentication 
Deployment (AWS + Vercel) 