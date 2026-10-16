const express=require("express");
const router=express.Router();
const {authenticate,authorize}=require("../middleware/middleware");
const userRoleController=require("../controllers/user-role.controller");

// admin can view a user's roles, only superadmin can change them
router.get("/:userId",authenticate,authorize("admin"),userRoleController.getUserRoles);
router.post("/:userId",authenticate,authorize("superadmin"),userRoleController.addRoles);
router.put("/:userId",authenticate,authorize("superadmin"),userRoleController.setRoles);
router.delete("/:userId/:code",authenticate,authorize("superadmin"),userRoleController.removeRole);

module.exports=router;
