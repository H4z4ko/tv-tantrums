# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Sensory Screen Time Guide Notes

This project uses React for the frontend (user interface), Node.js/Express for the backend (server logic), and SQLite for the database (storing show information). Tailwind CSS is used for styling.

**To run the project:**
1.  Make sure you have **Node.js** installed (which includes npm).
2.  Open a terminal or command prompt in the main project folder (the one containing this README and the `server`, `client`, `database` folders).
3.  **Install Backend Dependencies:** Run the command:
    ```bash
    npm install
    ```
4.  **Install Frontend Dependencies:** Navigate into the client folder and run install:
    ```bash
    cd client
    npm install
    cd ..
    ```
    *(This installs React, Tailwind, Chart.js, React Icons, etc.)*
5.  **IMPORTANT - Create/Update Database:** Run the data import script from the main project folder:
    ```bash
    npm run import-data
    ```
    *(This reads `database/reviewed_shows.json` and creates/updates `database/shows.db`)*
6.  **Run Development Servers:** Start both backend and frontend servers concurrently using:
    ```bash
    npm run dev
    ```
    *(This uses `nodemon` to watch backend files and `vite` for the frontend with hot-reloading)*
7.  Open your web browser to the address provided by Vite (usually `http://localhost:5173`). The backend API will be running on `http://localhost:3001` and proxied via Vite.