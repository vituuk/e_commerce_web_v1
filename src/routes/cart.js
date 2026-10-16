const express=require("express");
const {authenticate}=require("../middleware/middleware");
const controller=require("../controllers/cart.controller");

const router=express.Router();

// every cart route needs a logged-in user
router.use(authenticate);

router.get("/",controller.getCart);
router.delete("/",controller.clearCart);
router.post("/items",controller.addItem);
router.put("/items/:id",controller.updateItem);
router.delete("/items/:id",controller.removeItem);

module.exports=router;
