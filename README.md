# 🐾 openzess

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/downloads/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Powered by Gemini](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20Flash-orange.svg)](https://ai.google.dev/)

> **"Make ownself openclaw"** — An open-source, autonomous AI agent powered by Google's Gemini.

**openzess** is a powerful, self-hosted AI assistant designed to execute tasks, write code, and act as your personal autonomous agent. Built with a robust Python backend and a responsive TypeScript frontend, it leverages the speed and reasoning capabilities of the `gemini-2.5-flash` model.

---

## ✨ Features

- **🧠 Powered by Gemini**: Utilizes Google's state-of-the-art `gemini-2.5-flash` model for rapid text and code generation.
- **🛠️ Autonomous Agent**: Includes core agentic behaviors (`agent.py`) capable of parsing instructions and executing workflows.
- **🖥️ Full-Stack Architecture**: Clean separation of concerns with a Python backend and a modern TypeScript frontend.
- **🐳 Docker Ready**: Instantly spin up the entire stack using the included `docker-compose.yml`.
- **🚀 Cross-Platform**: Native support for Windows (`start.bat`) and Linux/WSL (`start_wsl.sh`).

---

## 🏗️ Architecture

- `backend/`: Python-based API and agent logic.
- `frontend/`: TypeScript/React-based user interface for interacting with the agent.
- `main.py` / `agent.py`: Core AI logic and command-line entry points.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js (for frontend development)
- Docker & Docker Compose (optional, for containerized setup)
- A Google Gemini API Key. [Get one here](https://aistudio.google.com/app/apikey).

### 1. Clone the Repository

```bash
git clone https://github.com/debjitttdasss/openzess.git
cd openzess
```

### 2. Environment Setup

Copy the example environment file and add your Gemini API key:

```bash
cp .env.example .env
```

Open `.env` and configure your keys:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Running the Application

You can start the application using the provided helper scripts depending on your operating system, or via Docker.

#### Option A: Windows
Run the batch file to install dependencies and start the services:
```cmd
start.bat
```

#### Option B: Linux / WSL
Make the script executable and run it:
```bash
chmod +x start_wsl.sh
./start_wsl.sh
```

#### Option C: Docker (Recommended)
To run the entire stack (frontend + backend) in isolated containers:
```bash
docker-compose up --build
```

### 4. CLI Quickstart
To test the core Gemini integration directly from your terminal:
```bash
pip install -r requirements.txt
python main.py
```

---

## 🛣️ Roadmap

- [x] Basic Gemini API Integration
- [x] CLI Agent Implementation
- [x] Frontend / Backend Scaffolding
- [ ] Implement Tool-Use (File System, Terminal)
- [ ] Memory and Context Management
- [ ] Advanced UI/UX for the web interface

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📫 Contact

Debjit Das - [@debjitttdasss](https://github.com/rossdebbu)

Project Link: [https://github.com/debjitttdasss/openzess](https://github.com/rosdebbu/openzess)
