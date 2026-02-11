import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(__dirname, "../../", `${process.env.NODE_ENV || "development"}.env`),
});

export const config = {
  DB_URL: process.env.DB_URL,
  REDIS_URL: process.env.REDIS_URL,
};
