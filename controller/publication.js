const publication = require("../models/publication");
const Publication = require("../models/publication");
//importar servicios

const followService = require("../service/followService");

//importar modulos

const fs = require("fs");
const path = require("path");

//acciones de prueba
const pruebaPublication = (req, res) => {
   return res.status(200).send({
      message: "Mensaje enviado desde : controllers/user.js",
   });
};
const save = (req, res) => {
   //recoger datos del body
   const params = req.body;
   //si no me llega, dar respuesta negativa
   if (!params.text)
      return res
         .status(400)
         .send({ status: "error", message: "debes enviar el comentario" });
   //crear y rellenar el objeto del modelo
   let newPublication = new Publication(params);
   newPublication.user = req.user.id;
   //guardar objeto en la base de datos
   newPublication
      .save()
      .then((pulicationStored) => {
         //devolver respuesta
         return res.status(200).send({
            status: "success",
            message: "Publicacion guardada",
            pulicationStored,
         });
      })
      .catch((error) => {
         res.status(400).send({
            status: "error",
            message: "no se ha guardado la publicacion",
            error,
         });
      });
};

//Guardar publicaciones

//Sacar una sola publicacion
const detail = (req, res) => {
   //sacar el id de publicacion de la url
   const publicacionId = req.params.id;
   //fin con la condicion del id
   publication
      .findById(publicacionId)
      .then((pulicationStored) => {
         //devolver respuesta
         return res.status(200).send({
            status: "success",
            message: "Mostrar publicacion",
            pulicationStored,
         });
      })
      .catch((error) => {
         res.status(400).send({
            status: "error",
            message: "Mostrar la publicacion",
            error,
         });
      });
};
//Eliminar publicacion
const remove = (req, res) => {
   //sacar el id de la publicacion a eliminar
   const publicacionId = req.params.id;

   //find y luego remove
   Publication.deleteOne({ user: req.user.id, _id: publicacionId })
      .then((result) => {
         if (result.deletedCount === 0) {
            return res.status(404).send({
               status: "error",
               message: "No se encontró la publicacion a eliminar",
            });
         }

         return res.status(200).send({
            status: "success",
            message: "Se elimino la publicacion correctamente ",
            publicacionId,
         });
      })
      .catch((error) => {
         return res.status(500).send({
            status: "error",
            message: "Error al eliminar la publicacion",
            error,
         });
      });
};
//Listar todas las publicaciones

//Listar publicaciones de un usuario
const user = async (req, res) => {
   try {
      //sacar el id de usuario
      let userId = req.params.id;
      //controlar la pagina
      // Comprobar si se pasa un id por parámetros
      if (req.params.id) userId = req.params.id;

      //comprobar si me llegael id por parametro en la url

      let page = parseInt(req.params.page) || 1;

      if (req.params.page) page = req.params.page;

      let itemsPerPage = 5;

      //find, populate , ordenar, paginar

      let resulta = Publication.find({ user: userId });

      let result = await resulta
         .populate("user", "-password -__v -role -email")
         .sort("create_at")
         .paginate(page, itemsPerPage);

      if (!result) {
         return res.status(404).send({
            status: "error",
            message: "No se han encontrado publica.",
         });
      }
      const total = await Publication.countDocuments({ user: userId });
      const totalPages = await Math.ceil(total / itemsPerPage);

      return res.status(200).send({
         status: "success",
         message: "ruta user ",
         publications: result,
         total,
         totalPages,
      });
   } catch {}
};

//subir fichero

const upload = (req, res) => {
   //sacar publicationID

   const publicationId = req.params.id;
   //Recoger el fichero de imagen y comprobar si existe
   if (!req.file) {
      return res.status(404).send({
         status: "Error",
         message: "No has cargado ninguna imagen",
      });
   }

   //conseguir el nombre del archivo
   let image = req.file.originalname;

   //sacar extencion del archivo
   let extencion = image.split(".")[1];
   //comprobar extencion
   if (extencion != "jpg" && extencion != "png" && extencion != "gif") {
      //si no es correcrto, borrar el archivo
      const filePath = req.file.path;
      const fileDelte = fs.unlinkSync(filePath);

      return res.status(400).send({
         status: "Error",
         message: "La extencion del la imagen es invalida",
      });
   }

   //si es correcto, guardar la imagen en la base de datos
   Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId },
      { file: req.file.filename },
      { new: true }
   )
      .exec()
      .then((publicationUpdate) => {
         return res.status(200).send({
            statuss: "success",
            publication: publicationUpdate,
            file: req.file,
         });
      })
      .catch((error) => {
         res.status(500).send({
            status: "Error",
            message: "ah ocurrido un error al subir la imagen",
            error,
         });
      });
};

const media = (req, res) => {
   // Sacar el parametro de la url
   const file = req.params.file;

   //Montar el path real de la imagen
   const filePath = "./upload/publications/" + file;

   //comprobar si exite
   fs.stat(filePath, (error, exists) => {
      if (!exists) {
         return res.status(404).send({
            status: "error",
            message: "No existe la imagen",
         });
      }
      return res.sendFile(path.resolve(filePath));
   });
};

//listar todas las publicaciones (FEED)

const feed = async (req, res) => {
   //sacar la pagina actual

   if (!req.user || !req.user.id) {
      return res.status(401).send({
         status: "error",
         message: "Usuario no autenticado",
      });
   }

   let page = 1;
   if (req.params.page) page = req.params.page;
   //establecer numero de elementos por pagina
   const myFollows = await followService.followsUserIds(req.user.id);
   let itemsPerPage = 5;
   //sacar array de identificadores de usuarios que yo sigo como usuario logueado
   try {
      const myFollows = await followService.followsUserIds(req.user.id);
      //find a publicaciones in

      const publications = await Publication.find({
         user: myFollows.following,
      })
         .populate("user", "-password -role -__v -email")
         .sort("-create_at")
         .paginate(page, itemsPerPage);

      return res.status(200).send({
         statuss: "success",
         message: "Ruta de publicaciones",
         following: myFollows.following,
         publications,
         total: publications.length,
         page,
         pages: Math.ceil(publications.length / itemsPerPage),
      });
   } catch (error) {
      //find a publicaciones in
      return res.status(500).send({
         statuss: "error",
         message: error.message,
      });
   }
};
//exportar acciones
module.exports = {
   pruebaPublication,
   save,
   detail,
   remove,
   user,
   upload,
   media,
   feed,
};
