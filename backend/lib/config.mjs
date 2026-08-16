import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectRoot = path.resolve(backendRoot, "..");

export const config = {
    host: process.env.BOSQUE_API_HOST || "127.0.0.1",
    port: Number(process.env.BOSQUE_API_PORT || 4180),
    jwtSecret: process.env.BOSQUE_JWT_SECRET || "dev-change-this-secret",
    projectRoot,
    publicRoot: projectRoot,
    dataDir: path.join(backendRoot, "data"),
    uploadDir: path.join(backendRoot, "uploads"),
    maxJsonBytes: Number(process.env.BOSQUE_MAX_JSON_BYTES || 6_000_000),
    amazon: {
        accessKey: process.env.AMAZON_ACCESS_KEY || "",
        secretKey: process.env.AMAZON_SECRET_KEY || "",
        partnerTag: process.env.AMAZON_PARTNER_TAG || "",
        marketplace: process.env.AMAZON_MARKETPLACE || "www.amazon.com",
        host: process.env.AMAZON_PAAPI_HOST || "webservices.amazon.com",
        region: process.env.AMAZON_PAAPI_REGION || "us-east-1"
    }
};
