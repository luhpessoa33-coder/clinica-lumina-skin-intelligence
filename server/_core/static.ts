import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/** Serves the built client without loading development-only Vite dependencies. */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error("Diretório público não encontrado: execute o build antes de iniciar o servidor.");
  }

  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
