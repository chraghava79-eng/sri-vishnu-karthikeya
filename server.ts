import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/checkout", async (req, res) => {
    try {
      const { customerEmail, productId } = req.body;
      const apiKey = process.env.DODO_PAYMENTS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Dodo Payments API Key not configured" });
      }

      // Dodo Payments API endpoint
      const isTestMode = process.env.DODO_PAYMENTS_ENVIRONMENT !== "live_mode";
      const baseUrl = isTestMode ? "https://test.dodopayments.com" : "https://app.dodopayments.com";
      
      const response = await fetch(`${baseUrl}/v1/payment-sessions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customer: {
            email: customerEmail
          },
          product_id: productId || "p_elite_access",
          quantity: 1,
          payment_methods: ["card"],
          return_url: `${req.headers.origin}/dashboard?payment=success`,
          cancel_url: `${req.headers.origin}/dashboard?payment=cancel`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create payment session");
      }

      res.json({ checkout_url: data.checkout_url });
    } catch (error) {
      console.error("Dodo Payments Error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
