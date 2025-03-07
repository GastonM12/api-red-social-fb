const express = require("express");
const router = express.Router();
const followController = require("../controller/follow");
const check = require("../middlewares/auth")


//definir rutas
router.get("/prueba-follow", followController.pruebaFollow);
router.post("/save", check.auth,followController.save);
router.delete("/unfollow/:id", check.auth,followController.unFollow);
router.get("/following/:id?/:page?", check.auth, followController.following);
router.get("/followers/:id?/:page?", check.auth, followController.followers);



//exportar ruter
module.exports = router;
