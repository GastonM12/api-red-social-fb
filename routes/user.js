const express = require("express");
const router = express.Router();
const UserController = require("../controller/user");
const check = require("../middlewares/auth")
const multer = require("multer")

//Configuracion de subida multer
const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
     cb(null,"./upload/avatars")
    },
    filename:(req,file,cb)=>{
 
        cb(null,"avatar-"+Date.now()+"-"+file.originalname)
    }
});

const upload = multer({storage});

//definir rutas
router.get("/prueba-usuario",check.auth, UserController.pruebaUser);
router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/profile/:id",check.auth, UserController.profile);
router.get("/list/:page?",check.auth, UserController.list);
router.put("/update",check.auth, UserController.update);
router.post("/upload",[ check.auth, upload.single("file0")],UserController.upload);
router.get("/avatar/:file", UserController.avatar);
router.get("/counters/:id",check.auth, UserController.counter);

//exportar ruter
module.exports = router