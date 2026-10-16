const express=require("express");
const router=express.Router();
const {authenticate,authorize}=require("../middleware/middleware");
const roleController=require("../controllers/role.controller");

// admin can read roles, only superadmin can change them
router.get("/",authenticate,authorize("admin"),roleController.list);
router.get("/:id",authenticate,authorize("admin"),roleController.getById);
router.post("/",authenticate,authorize("superadmin"),roleController.create);
router.put("/:id",authenticate,authorize("superadmin"),roleController.update);
router.delete("/:id",authenticate,authorize("superadmin"),roleController.remove);

module.exports=router;
