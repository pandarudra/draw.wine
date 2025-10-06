export const be_url =
  import.meta.env.VITE_ENV === "prod"
    ? (import.meta.env.VITE_BE_URL as string)
    : "http://localhost:3000";
