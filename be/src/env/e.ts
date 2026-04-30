import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;

const isProd =
  process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";

const FE_URL_PROD = (
  process.env.FE_URL_PROD ||
  process.env.FE_URL ||
  ""
).trim();
const FE_URL_DEV = (process.env.FE_URL_DEV || "http://localhost:5173").trim();

export const allowedOrigins = [FE_URL_DEV, FE_URL_PROD].filter(
  (origin) => origin.length > 0,
);

export const fe_url = isProd && FE_URL_PROD ? FE_URL_PROD : FE_URL_DEV;
