const express = require("express");
const router = express.Router();
const publicationController = require("../controller/publication");
const check = require("../middlewares/auth");

const multer = require("multer");

//Configuracion de subida multer
const storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, "./upload/publications");
   },
   filename: (req, file, cb) => {
      cb(null, "img-" + Date.now() + "-" + file.originalname);
   },
});

const upload = multer({ storage });

//definir rutas
router.get("/prueba-publication", publicationController.pruebaPublication);
router.post("/save", check.auth, publicationController.save);
router.get("/detail/:id", check.auth, publicationController.detail);
router.delete("/delete/:id", check.auth, publicationController.remove);
router.get("/user/:id/:page?", check.auth, publicationController.user);
router.post(
   "/upload/:id",
   [check.auth, upload.single("file0")],
   publicationController.upload
);
router.get("/media/:file", publicationController.media);
router.get("/feed/:page?",check.auth, publicationController.feed);
//exportar ruter
module.exports = router;
