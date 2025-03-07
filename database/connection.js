const mongoose = require("mongoose");

const connection = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/mi_redsocial");
    console.log("conectado a la bd: mi_redsocial");
  } catch (error) {
    console.log(error);
    throw new Error("No se pudo establecer la conexion");
  }
};
module.exports = connection;
