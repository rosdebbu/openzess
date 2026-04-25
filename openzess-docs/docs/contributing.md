# Contributing

We welcome contributions to OpenZess! Here's how to get involved.

## Development Setup

1. Fork and clone the repository
2. Follow the [Installation Guide](/guide/getting-started) to set up your environment
3. Create a feature branch: `git checkout -b feature/my-feature`

## Project Structure

```
openzess/
├── frontend/          # React + Vite UI
│   ├── src/
│   │   ├── pages/     # 21 page components
│   │   ├── components/# Shared UI components
│   │   ├── context/   # Theme context
│   │   └── utils/     # Personas, helpers
│   └── index.html
├── backend/           # FastAPI + Python
│   ├── server.py      # 30+ REST endpoints
│   ├── agent.py       # Core LLM agent
│   ├── database.py    # SQLAlchemy ORM
│   ├── plugins/       # Custom tool plugins
│   └── ...
├── openzess-docs/     # This documentation site
├── start_wsl.sh       # WSL boot script
├── .env               # Environment variables
└── docker-compose.yml # Docker configuration
```

## Adding a New Tool

1. Add the function to `agent.py`
2. Add the schema to `NATIVE_TOOL_SCHEMAS`
3. Register in `native_tool_funcs`

Or use the [Plugin System](/features/custom-plugins) for a zero-friction approach.

## Code Style

- **Frontend**: TypeScript with React functional components
- **Backend**: Python 3.10+ with type hints
- **Formatting**: Standard Prettier for TS, Black for Python

## Reporting Issues

Please file issues on [GitHub](https://github.com/rosdebbu/openzess/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Your OS and Node/Python versions
