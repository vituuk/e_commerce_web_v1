const express=require("express");
const {authenticate,authorize}=require("../middleware/middleware");
const controller=require("../controllers/order.controller");
const reportController=require("../controllers/report.controller");

const router=express.Router();

router.use(authenticate);

// admin (declared before /:id so "admin" isn't read as an id)
router.get("/admin/report",authorize("admin"),reportController.report);
router.get("/admin/report/export",authorize("admin"),reportController.reportExport);
router.get("/admin",authorize("admin"),controller.listAll);
router.get("/admin/:id",authorize("admin"),controller.getAny);
router.patch("/admin/:id/status",authorize("admin"),controller.updateStatus);

// customer (own orders only)
router.post("/",controller.checkout);
router.get("/",controller.listMine);
router.get("/:id/invoice",reportController.invoice); // owner or admin, .docx
router.get("/:id",controller.getMine);
router.patch("/:id/cancel",controller.cancelMine);

module.exports=router;
