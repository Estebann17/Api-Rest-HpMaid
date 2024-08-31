const express = require("express");
const mongoose = require("mongoose");

const userRoutes = require("./routes/userRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const cardRoutes = require("./routes/cardRoutes");
const followRoutes = require("./routes/followRoutes");
const apiCardsRoutes = require("./routes/apiCardsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const viewRoutes = require("./routes/viewRoutes");

const path = require("path");
require("dotenv").config();
const app = express();
const cors = require("cors");
const multer = require("multer");

app.use(
  cors({
    origin: "*",
    methods: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
    credentials: true,
    allowedHeaders:
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  })
);

mongoose.connect(
  "mongodb+srv://gus:gNuUFitOXcBANaAG@cardquest.p7p0gl6.mongodb.net/?retryWrites=true&w=majority"
);

const db = mongoose.connection;

db.on("error", (err) => {
  console.error("Error de conexión:", err);
});

db.once("open", () => {
  console.log("¡Conexión exitosa a la base de datos!");
});

app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/users", userRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/apiCards", apiCardsRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/views", viewRoutes);

app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
