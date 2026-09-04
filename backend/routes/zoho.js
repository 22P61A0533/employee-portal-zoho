const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/roleMiddleware");
const { getCRMLeads } = require("../services/zohoService");

const router = express.Router();

router.get(
  "/crm/leads",
  authenticateToken,
  requirePermission("access_crm"),
  async (req, res) => {
    try {
      const data = await getCRMLeads();

      await require("../db").query(
        `INSERT INTO audit_logs (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          req.user.userId,
          "ZOHO_CRM_ACCESS",
          "User accessed Zoho CRM Leads",
        ]
      );

      res.json({
        message: "Zoho CRM data retrieved successfully",
        data,
      });
    } catch (error) {
      console.error(
        "Zoho CRM error:",
        error.response?.data || error.message
      );

      res.status(500).json({
        message: "Unable to retrieve Zoho CRM data",
        error: error.response?.data || error.message,
      });
    }
  }
);

module.exports = router;