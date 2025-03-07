//importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");
//importar clave secreta

const libjwt = require("../service/jwt");
const secret = libjwt.secret;

//MIDDLEWARE de autenticacion
exports.auth = (req, res, next) => {
  //comprobar si me llega la cabecera de auth
  if (!req.headers.authorization) {
    return res.status(403).send({
      status: "error",
      messege: "La peticion no tiene la cabecera de autenticacion",
    });
  }
  //limpiear el token
  let token = req.headers.authorization.replace(/['"]+/g, "");
  //decodificar token
  try {
    let payload = jwt.decode(token, secret);
     
  
    
    //comprobar expiracion del token
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        status: "error",
        messahe: "Token expirado",
      });
    }
    //agregar datos de usuarios
    req.user = payload;
  } catch (error) {
    res.status(404).send({
      status: "error",
      message: "Token invalido",
      error,
    });
  }

  //pasar a ejecucion de accion
  next();
};
