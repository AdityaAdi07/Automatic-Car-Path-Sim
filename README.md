# Autonomous Vehicle Routing Algorithm

[![Vercel Deployment](https://vercelbadge.vercel.app/api/sushmaaditya717-gmailcoms-projects/auto-car-3kxfift0l)](https://auto-car-3kxfift0l-sushmaaditya717-gmailcoms-projects.vercel.app/) [![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A modern, interactive simulation platform for testing and visualizing autonomous vehicle routing algorithms in dynamic environments. Built with React and TypeScript, this project features real-time pathfinding, city and warehouse map layouts, and advanced obstacle and traffic handling.

## 🚀 Live Demo

Experience the simulation live: [auto-car-3kxfift0l-sushmaaditya717-gmailcoms-projects.vercel.app](https://auto-car-3kxfift0l-sushmaaditya717-gmailcoms-projects.vercel.app/)

---

## 📚 Project Background

Autonomous vehicles are revolutionizing transportation, logistics, and urban mobility. This project provides a research and educational platform to simulate, test, and visualize advanced routing algorithms in realistic, dynamic environments. It is ideal for:
- Academic research and teaching
- Demonstrating pathfinding and traffic management
- Prototyping and testing new algorithms
- Hackathons and student projects

## ✨ Features

- **Interactive Map**: Switch between city and warehouse layouts with a professional, responsive UI.
- **Autonomous Vehicles**: Multiple vehicles with real-time routing, rerouting, and collision avoidance.
- **Dynamic Obstacles**: Buildings, traffic zones (high/medium/low), and moving pedestrians.
- **Smart Rerouting**: Vehicles proactively reroute to avoid obstacles, traffic, and other cars.
- **Pedestrian & Car Sensing**: Vehicles slow down or reroute when sensing pedestrians or other cars ahead.
- **Real-Time Dashboard**: Live vehicle stats, health, speed, and decision logs.
- **Modern UI**: Clean, professional design with responsive controls and map selection.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Visualization**: SVG, Lucide Icons
- **Simulation Logic**: Custom pathfinding and traffic simulation in TypeScript
- **Deployment**: Vercel (with Vite)

## 📁 Folder Structure

```
Autonomous-Vehicle-Routing-Algorithm-main/
├── landing/                # Static landing page
├── project/                # Main simulation app
│   ├── src/
│   │   ├── components/     # React components (UI, panels, controls)
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Simulation and pathfinding logic
│   │   └── ...
│   ├── public/             # Static assets
│   ├── index.html          # App entry point
│   └── ...
├── README.md
└── vercel.json             # Vercel deployment config
```

## 🚦 Use Cases
- **Education**: Teach students about algorithms, AI, and traffic systems.
- **Research**: Prototype and benchmark new routing strategies.
- **Demonstration**: Showcase autonomous vehicle logic to stakeholders.
- **Development**: Build and test new features in a modular codebase.

## 🏁 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
https://github.com/AdityaAdi07/Automatic-Car-Path-Sim.git
cd Autonomous-Vehicle-Routing-Algorithm-main/project

# Install dependencies
npm install
# or
yarn install
```

### Running the App
```bash
npm run dev
# or
yarn dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🖥️ Main UI Highlights
- **Map Layout Dropdown**: Easily switch between city and warehouse maps.
- **Vehicle Dashboard**: Monitor all vehicles, their speed, battery, tire pressure, and last decisions.
- **Simulation Controls**: Start, pause, reset, and adjust simulation speed.
- **Environment Controls**: Add/remove traffic and pedestrians dynamically.
- **Detailed Vehicle Panel**: Inspect individual vehicle stats and logs.

## 🤝 Contributing

Contributions are welcome! To contribute:
1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

Please open issues for bugs, feature requests, or questions.

## 📄 License

This project is licensed under the MIT License.

---

**Developed with ❤️ for autonomous systems research and education.** 
