# Desktop (Electron) Legacy Shell

This folder contains the original **Electron desktop shell** that has been
retired in favor of the pure web version of Openzess.

It is kept here for reference only — it is **not** compiled by Vite or
TypeScript anymore (`tsconfig.app.json` only includes `src/`, and the
Electron plugin has been removed from `package.json`).

If you ever want to restore desktop mode:
1. Move these files back to `frontend/electron/`
2. Re-add `vite-plugin-electron`, `vite-plugin-electron-renderer`,
   `electron`, and `electron-builder` to `devDependencies`
3. Uncomment the `electron({...})` block in `frontend/vite.config.ts`

The React app itself never depended on Electron for core features — all
`window.electronAPI` calls are guarded and simply no-op in the browser
(the Companion avatar renders inline on the `/companion` page instead).
