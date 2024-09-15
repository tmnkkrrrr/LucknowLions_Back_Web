const express = require("express");
const router = express.Router();

router.use('/v1/visitor/', require('../controllers/VisitorController'));
router.use('/v1/admin/', require('../controllers/AdminController'));
router.use('/v1/website/', require('../controllers/WebsiteController'));



module.exports = router;
