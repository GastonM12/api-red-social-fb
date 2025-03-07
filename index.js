//importar dependencias
const connection = require("./database/connection");
const express = require("express");
const cors = require("cors");
//mensaje bienvenida
console.log("Api node para red social arrancada");

//conexion
connection();

//servidor node
const app = express();

//conf cors
app.use(cors());

//convertir los datps al body a objetos js
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//cargar conf  rutas
const userRoutes = require("./routes/user");
const publicationRoutes = require("./routes/publication");
const followRoutes = require("./routes/follow");

app.use("/api/user", userRoutes);
app.use("/api/publication", publicationRoutes);
app.use("/api/follow", followRoutes);
//ruta de prueba
app.get("/ruta-prueba", (req, res) => {
  return res.status(200).json({
    id: 1,
    nombre: "Gaston",
    web: "google.com",
  });
});
const PORT = 3910;
//poner servidor a escuchar peticiones
app
  .listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(`El puerto ${PORT} ya está en uso.`);
    } else {
      console.error(`Error desconocido: ${err.message}`);
    }
  });
