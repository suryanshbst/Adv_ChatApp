import "dotenv/config";
import express from "express";
import cors from "cors";
import { mainRouter } from "./routes/mainRouter";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", mainRouter);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
