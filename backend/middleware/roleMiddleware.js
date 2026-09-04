const pool = require("../db");

const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const result = await pool.query(
        `SELECT p.name
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1
         AND p.name = $2`,
        [req.user.userId, permissionName]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          message: "You do not have permission to access this resource",
        });
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);

      res.status(500).json({
        message: "Internal server error",
      });
    }
  };
};

module.exports = requirePermission;