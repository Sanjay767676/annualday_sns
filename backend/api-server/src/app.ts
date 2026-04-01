import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import type { IncomingMessage, ServerResponse } from "node:http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true);
const QUIET_GET_PATHS = new Set([
  "/api/admin/faculty",
  "/api/admin/student",
  "/api/admin/stats",
]);

app.use(
  pinoHttp({
    logger,
    autoLogging: {
      ignore: (req) => req.url?.split("?")[0] === "/api/healthz",
    },
    customLogLevel: (req, res, err) => {
      if (err || res.statusCode >= 500) return "error";

      const method = req.method?.toUpperCase();
      const path = req.url?.split("?")[0] ?? "";
      const isRoutinePoll = method === "GET" && QUIET_GET_PATHS.has(path) && res.statusCode < 400;

      if (isRoutinePoll || res.statusCode === 304) return "silent";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req(req: IncomingMessage & { id?: string | number }) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res: ServerResponse) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "128kb" }));
app.use(express.urlencoded({ extended: true, limit: "128kb" }));

app.use("/api", router);
app.use("/", router);

export default app;
