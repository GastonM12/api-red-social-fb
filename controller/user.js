//importar dependencias y modulos
const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoosePaginate = require("mongoose-pagination");
const fs = require("fs");
const path = require("path")
//importar servicios
const jwt = require("../service/jwt");
const user = require("../models/user");
const followService = require("../service/followService")
const Follow = require("../models/follow");
const Publication = require("../models/publication");

//acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde : controllers/user.js",
    usuario: req.user,
  });
};

//registro de usuarios
const register = (req, res) => {
  //recoger datos de la peticion
  let params = req.body;
  console.log(params);

  //comprobar que me llegan bien
  if (!params.name || !params.email || !params.password || !params.nick) {
    console.log("validacion incorrecta");
    return res.status(400).json({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }

  //control de usuarios duplicados
  User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  })
    .exec()
    .then(async (user) => {
      if (user && user.length >= 1) {
        return res.status(200).send({
          status: "sucess",
          message: "El usuario ya existe",
        });
      }
      //cifrar la contraseña
      let pwd = await bcrypt.hash(params.password, 10);
      params.password = pwd;

      //crear objeto de usuario
      let user_to_save = new User(params);
      user_to_save
        .save()
        .then((userStored) => {
          return res.status(200).json({
            status: "success",
            message: "Usuario registrado correctamente",
            user: userStored,
          });
        })
        .catch((error) => {
          return res
            .status(500)
            .send({ status: "error", message: "error al guardar", error });
        });
    })
    .catch((error) => {
      return res
        .status(500)
        .json({ status: error, message: "Error en la consulta de usuario" });
    });

  //guardar usuarios en la base de datos
};

//Loguear usuario
const login = (req, res) => {
  //recoger parametros body
  const params = req.body;

  if (!params.email || !params.password) {
    return res.status(400).send({
      status: "error",
      message: "Faltan datos por enviar",
    });
  }
  //buscar en la base de datos si existe
  User.findOne({ email: params.email })

    .then(async (user) => {
      if (!user) {
        return res
          .status(404)
          .send({ status: "error", message: "No existe en la base de datos" });
      }

      //comprobar su contraseña
      let pwd = await bcrypt.compareSync(params.password, user.password);
      if (!pwd) {
        return res.status(400).send({
          status: "error",
          message:
            "No te has identificado correctamente verifica tu contraseña",
        });
      }

      //devolver token
      const token = jwt.createToken(user);

      //devolver datos del usuario
      return res.status(200).send({
        status: "success",
        message: "Accion loguin",
        user: {
          id: user._id,
          name: user.name,
          nick: user.nick,
        },
        token,
      });
    })
    .catch((error) => {
      return res
        .status(500)
        .send(
          { status: "error", message: "No existe en la base de datos" },
          error
        );
    });
};

//BUSCAR PERFIL DEL USUARIO
const profile = async (req, res) => {
  //recibir el parametro del id del usuario por url
  const id = req.params.id;

  //consulta para sacar los datos del usuario
  User.findById(id)
    .select({ password: 0, role: 0 })
    .exec()
    .then(async(userProfile) => {
      if (!userProfile) {
        return res.status(404).send({
          status: "error",
          message: "El usuario no existe",
        });
      }
     //Info de seguimiento

     //const followInfo =  await followService.followThisUser(req.user.id, id)
     const followInfo = await followService.followThisUser(req.user.id)
     
     return res.status(200).send({
        status: "success",
        user: userProfile,
       following:followInfo.following,
       followers:followInfo.followers
      });
    })
    .catch((error) => {
      res.status(500).send({
        status: "error",
        message: "Hubo un error en la búsqueda del usuario",
        error,
      });
    });
};

//LISTAR LOS USUARIOS POR PAGINAS
const list = async (req, res) => {
  try {
    let page = parseInt(req.params.page) || 1;
    let itemsPerPage = 5;

    const result = await User.find().select("-password -email -__v  -role").sort("_id").paginate(page, itemsPerPage);
    

    let followUserId =  await followService.followsUserIds(req.user.id)
    return res.status(200).send({
      status: "success",
      message: "Lista de usuarios paginada",
      users: result, // Lista de usuarios en la página actual
      total: result.total, // Total de usuarios en la BD
      itemsPerPage,
      pages: Math.ceil(result.total / itemsPerPage), // Total de páginas
      page,
      user_following: followUserId.following,
      user_follow_me:followUserId.followers
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Hubo un error en la búsqueda de usuarios",
      error: error.message,
    });
  }
};

//ACTUALIZAR DATOS DE LOS USUARIOS

const update = (req, res) => {
  //recoger info del usuario a actualizar
  const userIdentity = req.user;
  const userToUpdate = req.body;
  //Eliminar campos sobrantes

  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;

  //Comprobar si el usuario ya existe
  User.find({
    $or: [
      { email: userToUpdate.email.toLowerCase() },
      { nick: userToUpdate.nick.toLowerCase() },
    ],
  })
    .exec()
    .then(async (user) => {
      let userIsset = false;
      user.forEach((user) => {
        if (user && user._id != userIdentity.id) userIsset = true;
      });
      if (userIsset) {
        return res.status(200).send({
          status: "sucess",
          message: "El usuario ya existe",
        });
      }
      if (userToUpdate.password) {
        //cifrar la contraseña
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      }else{
        delete userToUpdate.password
      }

      try {
        let userUpdate = await User.findByIdAndUpdate(
         {_id: userIdentity.id},
          userToUpdate,
          { new: true }
        );
        if (!userUpdate) {
          return res.status(400).send({
            status: "error",
            message: "hubo un error al acutalizar usuario",
          });
        }
        //Buscar y actualizar
        return res.status(200).send({
          status: "success",
          message: "Se actualizo correctamente",
          user: userUpdate,
        });
      } catch (error) {
        return res.status(500).send({
          status: "error",
          message: "hubo un error al acutalizar usuario",
          error,
        });
      }
    });
};

//SUBIDA DE IMAGENES PARA EL PERFIL DEL USUARIO

const upload = (req, res) => {
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
  User.findOneAndUpdate(
    { _id: req.user.id },
    { imagen: req.file.filename },
    { new: true }
  )
    .exec()
    .then((userUpdate) => {
      if (!userUpdate) {
        res.status(400).send({
          status: "Error",
          message: "userUpdate no existe",
        });
      }
      return res.status(200).send({
        statuss: "success",
        user: userUpdate,
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

//Sacar el avatar

const avatar = (req, res) => {
  // Sacar el parametro de la url
  const file = req.params.file;

  //Montar el path real de la imagen
  const filePath = "./upload/avatars/" + file;

  //comprobar si exite
  fs.stat(filePath,(error,exists)=>{

      if (!exists) {
        return res.status(404).send({
          status: "error",
          message: "No existe la imagen",
        });
      }
      return res.sendFile(path.resolve(filePath))
  })
};
const counter = async(req,res )=>{
  let userId = req.params.id

  if(req.params.id){
    userId = req.params.id;
  }

  try{
    const following = await Follow.countDocuments({"user":userId})
    const followed = await Follow.countDocuments({"followed":userId})
    const publications = await Publication.countDocuments({"user":userId})
    
    return res.status(200).send({
      status:"Succes",
      userId,
      following:following,
      followed:followed,
      publications:publications
    })
  }catch(error){
    return res.status(200).send({
      status:"Error",
       error:error.message
    })
  }
  
}
//exportar acciones
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counter
};
