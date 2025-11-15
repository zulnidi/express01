import express from "express";
import dotenv from "dotenv";
import router from "./routes/Canciones.Routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middlewares/ErrorHandler.js";

dotenv.config();

const app = express();

app.use(express.json());

// rutas
app.use("/canciones", router);

// middleware de errores 400 Y 500
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
};

start();
