# 🛸 Openzess Frontend Web Interface

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E">
</p>

Welcome to the **Frontend Layer** of the Openzess robotics platform. This directory houses the modern, high-performance web interface designed for real-time control, monitoring, and orchestration of **OpenClaw** robotic systems.

---

## 🌟 Key Features

*   **Real-time Monitoring & Control:** Live data feed from the Openzess backend and python robotic control layer.
*   **Intuitive Dashboard:** A sleek, user-friendly interface for parameter tuning, calibration, and visual telemetry.
*   **Robust State Management:** Built to handle high-frequency robotic state updates without dropping frames.
*   **Cross-platform Access:** Responsive design allowing operation from desktops, tablets, or embedded screens.

## 🛠️ Tech Stack

This frontend is powered by modern web technologies optimized for speed and developer experience:

*   **[React 18](https://react.dev/)**: For building declarative, component-based UIs and robust state management.
*   **[TypeScript](https://www.typescriptlang.org/)**: Ensures type-safety, which is critical when dealing with complex hardware data structures and APIs.
*   **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for ultra-fast Hot Module Replacement (HMR) and optimized production builds.

---

## 🚀 Getting Started

To get the frontend running locally for development or testing:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16+ or v18+) installed.

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5173` (by default) with fast HMR enabled.

### 3. Build for Production
To generate optimized static assets for deployment:
```bash
npm run build
npm run preview # To preview the production build locally
```

---

## 🎨 UI/UX Architecture

The frontend is designed to be the "cockpit" of your robotics setup. It bridges the gap between complex robotic instructions (handled by our backend) and an easily digestible visual format.

*   **Telemetry Views:** Visualizations of force limits, hardware safety constraints, and motion data.
*   **Agent Interaction:** A dedicated interface to interact with the Openzess automation agent layer, bridging natural language or instruction input directly to the robotics layer.

---

## 🧩 Modularity and Customization

We built this interface with customizability in mind. Since every **OpenClaw** use-case is different (whether industrial, lab, or maker pipelines), the UI components are modular. You can easily extend the dashboard by creating new React components and subscribing them to our backend data streams.

---

## 🤝 Need to touch the Backend/Core?
If you're looking for the Python intelligence layer, core API endpoints, or overarching documentation, please head over to the [Root README](../README.md).
