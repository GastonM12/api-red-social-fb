//importar modelo
const Follow = require("../models/follow");
const User = require("../models/user");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

//importar servicios

const followsService = require("../service/followService");

//acciones de prueba
const pruebaFollow = (req, res) => {
   return res.status(200).send({
      message: "Mensaje enviado desde : controllers/user.js",
   });
};

//Accion de guardar un follow (accion de seguir)

const save = (req, res) => {
   //conseguir datos por body
   const params = req.body;

   //sacar id del usuario identificado
   const identity = req.user;

   //crear objeto con modelo follow
   let userToFollow = new Follow({
      user: identity.id,
      followed: params.followed,
   });
   //guardar objeto en bbdd
   userToFollow
      .save()
      .then((followStored) => {
         if (!followStored) {
            res.status(500).send({
               status: "Error",
               message: "No se ah podido seguir al usuario ",
            });
         }

         return res.status(200).send({
            status: "Success",
            identity: req.user,
            follow: followStored,
         });
      })
      .catch((error) => {
         res.status(500).send({
            status: "Error",
            error,
         });
      });
};

//Accion de borrar un follow(accion de dejar de seguir)

const unFollow = (req, res) => {
   // Recoger el id del usuario identificado
   const userId = req.user.id;

   // Recoger el id del usuario a dejar de seguir desde los parámetros de la URL
   const followedId = req.params.id;

   // Verificar si el ID es válido
   if (!followedId) {
      return res.status(400).send({
         status: "error",
         message: "El ID del usuario a dejar de seguir es obligatorio",
      });
   }

   // Buscar y eliminar la relación de seguimiento
   Follow.deleteOne({ user: userId, followed: followedId })
      .then((result) => {
         if (result.deletedCount === 0) {
            return res.status(404).send({
               status: "error",
               message: "No se encontró la relación de seguimiento",
            });
         }

         return res.status(200).send({
            status: "success",
            identity: req.user,
            followDeleted: result,
         });
      })
      .catch((error) => {
         return res.status(500).send({
            status: "error",
            message: "Error al intentar dejar de seguir al usuario",
            error,
         });
      });
};
const following = async (req, res) => {
   try {
      //comprobar el id del usuario
      let userId = req.user.id;

      // Comprobar si se pasa un id por parámetros
      if (req.params.id) userId = req.params.id;

      //comprobar si me llegael id por parametro en la url

      let page = parseInt(req.params.page) || 1;
      let itemsPage = 5; // Número de usuarios por página

      // Usar .paginate() con await para que funcione de forma asincrónica
      const follows = await Follow.find({ user: userId })
         .populate("followed", "-password -role -__v -email")
         .paginate(page, itemsPage);

      // Verificar si no hay seguidores
      if (!follows || follows.length === 0) {
         return res.status(404).send({
            status: "error",
            message: "No se han encontrado seguidores.",
         });
      }
      let followUserId = await followsService.followsUserIds(req.user.id);
      // Calcular el número total de páginas
      const total = await Follow.countDocuments({ user: userId });
      const totalPages = Math.ceil(total / itemsPage);


      return res.status(200).send({
         status: "success",
         user: req.user,
         follows,
         total,
         pages: totalPages,
         user_following: followUserId.following,
         user_follow_me: followUserId.followers,
      });
   } catch (error) {
      // Manejo de errores
      return res.status(500).send({
         user: req.user,
         status: "error",
         message: "Error en la consulta de seguidores",
         error: error.message,
      });
   }
};

//Accion listado de usuarios que siguen a cualquier otro usuario
const followers = async (req, res) => {
   try {
      //comprobar el id del usuario
      let userId = req.user.id;

      // Comprobar si se pasa un id por parámetros
      if (req.params.id) userId = req.params.id;

      //comprobar si me llegael id por parametro en la url

      let page = parseInt(req.params.page) || 1;
      let itemsPage = 5; // Número de usuarios por página

      // Usar .paginate() con await para que funcione de forma asincrónica
      const follows = await Follow.find({ followed: userId })
         .populate("user followed", "-password -role -__v -email")
         .paginate(page, itemsPage);

      // Verificar si no hay seguidores
      if (!follows || follows.length === 0) {
         return res.status(404).send({
            status: "error",
            message: "No se han encontrado seguidores.",
         });
      }
      let followUserId = await followsService.followsUserIds(req.user.id);
      // Calcular el número total de páginas
      const total = await Follow.countDocuments({ user: userId });
      const totalPages = Math.ceil(total / itemsPage);

   

      return res.status(200).send({
         status: "success",
         user: req.user,
         message: "Listado de usuarios que me siguen",
         follows,
         total,
         pages: totalPages,
         user_following: followUserId.following,
         user_follow_me: followUserId.followers,
      });
   } catch (error) {
      // Manejo de errores
      return res.status(500).send({
         user: req.user,
         status: "error",
         message: "Error en la consulta de seguidores",
         error: error.message,
      });
   }
};
//exportar acciones
module.exports = {
   pruebaFollow,
   save,
   unFollow,
   followers,
   following,
};
