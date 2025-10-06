import dotenv from "dotenv";
dotenv.config();

export const PORT = Number(process.env.PORT);

export const fe_url =
  process.env.NODE_ENV === "prod"
    ? (process.env.FE_URL_PROD as string)
    : "http://localhost:5173";
