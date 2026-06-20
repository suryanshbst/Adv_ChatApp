import express from "express";
import cors from "cors";
import { mainRouter } from "./routes/mainRouter";
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", mainRouter);
app.listen(3002, () => {
  console.log("Server is running on port 3001");
});
