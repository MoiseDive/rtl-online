import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

const ADMIN_PASSWORD = "Moise@2810";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Mot de passe incorrect" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erreur de connexion" });
    }
  });

  app.get("/api/stream", async (_req, res) => {
    try {
      const config = await storage.getStreamConfig();
      res.json(config || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get stream config" });
    }
  });

  app.put("/api/stream", async (req, res) => {
    try {
      const config = await storage.updateStreamConfig(req.body);
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to update stream config" });
    }
  });

  app.get("/api/programs", async (_req, res) => {
    try {
      const allPrograms = await storage.getPrograms();
      res.json(allPrograms);
    } catch (error) {
      res.status(500).json({ message: "Failed to get programs" });
    }
  });

  app.post("/api/programs", async (req, res) => {
    try {
      const program = await storage.createProgram(req.body);
      res.status(201).json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to create program" });
    }
  });

  app.put("/api/programs/:id", async (req, res) => {
    try {
      const program = await storage.updateProgram(req.params.id, req.body);
      res.json(program);
    } catch (error) {
      res.status(500).json({ message: "Failed to update program" });
    }
  });

  app.delete("/api/programs/:id", async (req, res) => {
    try {
      await storage.deleteProgram(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete program" });
    }
  });

  app.get("/api/emissions", async (_req, res) => {
    try {
      const allEmissions = await storage.getEmissions();
      res.json(allEmissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get emissions" });
    }
  });

  app.post("/api/emissions", async (req, res) => {
    try {
      const emission = await storage.createEmission(req.body);
      res.status(201).json(emission);
    } catch (error) {
      res.status(500).json({ message: "Failed to create emission" });
    }
  });

  app.put("/api/emissions/:id", async (req, res) => {
    try {
      const emission = await storage.updateEmission(req.params.id, req.body);
      res.json(emission);
    } catch (error) {
      res.status(500).json({ message: "Failed to update emission" });
    }
  });

  app.delete("/api/emissions/:id", async (req, res) => {
    try {
      await storage.deleteEmission(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete emission" });
    }
  });

  app.get("/api/contact", async (_req, res) => {
    try {
      const info = await storage.getContactInfo();
      res.json(info || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get contact info" });
    }
  });

  app.put("/api/contact", async (req, res) => {
    try {
      const info = await storage.updateContactInfo(req.body);
      res.json(info);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
