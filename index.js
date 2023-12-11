const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require(`cors`);
const dotenv = require("dotenv");

dotenv.config();

// Conectar a db

mongoose.connect(
  process.env.DATABASE,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true },
  () => {
    console.log("Se conectó a la base de datos");
  }
);

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Rutas

const authRoute = require("./routes/auth");
const clientRoute = require("./routes/clients");
const billRoute = require("./routes/bills");

// Middlewares de ruta

app.use("/api/user", authRoute);
app.use("/api/clients", clientRoute);
app.use("/api/bills", billRoute);

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.use("*", express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
}

app.set(`port`, process.env.PORT || 8000);
const main = async () => {
  await app.listen(app.get(`port`));
  console.log(`Servidor iniciado en puerto ${app.get(`port`)}`);
};
main();

if (!process.env.DATABASE.includes("nathan")) {
  console.log("===============================================================================================")
  console.log("======================= WARNING || USING PRODUCTION DATABASE || WARNING =======================")
  console.log("===============================================================================================")
}