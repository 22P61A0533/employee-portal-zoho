const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const authenticateToken = require("../middleware/authMiddleware");
const requirePermission = require("../middleware/roleMiddleware");

const router = express.Router();

/* =========================
   GET ALL USERS
========================= */

router.get(
  "/users",
  authenticateToken,
  requirePermission("view_users"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.status,
          u.created_at,
          COALESCE(r.name, 'Employee') AS role
        FROM users u
        LEFT JOIN user_roles ur
          ON u.id = ur.user_id
        LEFT JOIN roles r
          ON ur.role_id = r.id
        ORDER BY u.id
      `);

      res.json({
        users: result.rows,
      });
    } catch (error) {
      console.error("Get users error:", error);

      res.status(500).json({
        message: "Unable to fetch users",
      });
    }
  }
);

/* =========================
   CREATE USER
========================= */

router.post(
  "/users",
  authenticateToken,
  requirePermission("manage_users"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: "Name, email and password are required",
        });
      }

      await client.query("BEGIN");

      const existingUser = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "User with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `INSERT INTO users (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, status, created_at`,
        [name, email, hashedPassword]
      );

      const newUser = userResult.rows[0];

      const roleResult = await client.query(
        "SELECT id FROM roles WHERE name = 'Employee'"
      );

      const employeeRoleId = roleResult.rows[0].id;

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [newUser.id, employeeRoleId]
      );

      await client.query(
        `INSERT INTO audit_logs
         (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          req.user.userId,
          "CREATE_USER",
          `Created employee ${email}`,
        ]
      );

      await client.query("COMMIT");

      res.status(201).json({
        message: "Employee created successfully",
        user: {
          ...newUser,
          role: "Employee",
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Create user error:", error);

      res.status(500).json({
        message: "Unable to create user",
      });
    } finally {
      client.release();
    }
  }
);

/* =========================
   CHANGE USER ROLE
========================= */

router.put(
  "/users/:id/role",
  authenticateToken,
  requirePermission("manage_roles"),
  async (req, res) => {
    const client = await pool.connect();

    try {
      const userId = Number(req.params.id);
      const { role } = req.body;

      console.log("ROLE CHANGE REQUEST:", {
        userId,
        role,
      });

      if (!userId || !role) {
        return res.status(400).json({
          message: "User ID and role are required",
        });
      }

      const allowedRoles = ["Admin", "Manager", "Employee"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      if (userId === req.user.userId) {
        return res.status(400).json({
          message: "You cannot change your own role",
        });
      }

      await client.query("BEGIN");

      const userCheck = await client.query(
        "SELECT id, name, email FROM users WHERE id = $1",
        [userId]
      );

      if (userCheck.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "User not found",
        });
      }

      const roleResult = await client.query(
        "SELECT id, name FROM roles WHERE name = $1",
        [role]
      );

      if (roleResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: "Role not found in database",
        });
      }

      const roleId = roleResult.rows[0].id;

      /*
        Remove the old role
      */
      await client.query(
        `DELETE FROM user_roles
         WHERE user_id = $1`,
        [userId]
      );

      /*
        Insert the new role
      */
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)`,
        [userId, roleId]
      );

      /*
        Add audit log
      */
      await client.query(
        `INSERT INTO audit_logs
         (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          req.user.userId,
          "CHANGE_ROLE",
          `Changed ${userCheck.rows[0].email} role to ${role}`,
        ]
      );

      await client.query("COMMIT");

      console.log(
        `SUCCESS: User ${userId} role changed to ${role}`
      );

      res.json({
        message: `Role changed to ${role} successfully`,
        userId,
        role,
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("ROLE CHANGE ERROR:", error);

      res.status(500).json({
        message: "Unable to change user role",
        error: error.message,
      });
    } finally {
      client.release();
    }
  }
);

/* =========================
   UPDATE USER
========================= */

router.put(
  "/users/:id",
  authenticateToken,
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({
          message: "Name and email are required",
        });
      }

      const result = await pool.query(
        `UPDATE users
         SET name = $1,
             email = $2
         WHERE id = $3
         RETURNING id, name, email, status, created_at`,
        [name, email, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await pool.query(
        `INSERT INTO audit_logs
         (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          req.user.userId,
          "UPDATE_USER",
          `Updated user ${email}`,
        ]
      );

      res.json({
        message: "User updated successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("Update user error:", error);

      res.status(500).json({
        message: "Unable to update user",
      });
    }
  }
);

/* =========================
   DELETE USER
========================= */

router.delete(
  "/users/:id",
  authenticateToken,
  requirePermission("manage_users"),
  async (req, res) => {
    try {
      const userId = Number(req.params.id);

      if (userId === req.user.userId) {
        return res.status(400).json({
          message: "You cannot delete your own account",
        });
      }

      const userResult = await pool.query(
        "SELECT email FROM users WHERE id = $1",
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      await pool.query(
        "DELETE FROM users WHERE id = $1",
        [userId]
      );

      await pool.query(
        `INSERT INTO audit_logs
         (user_id, action, details)
         VALUES ($1, $2, $3)`,
        [
          req.user.userId,
          "DELETE_USER",
          `Deleted user ${userResult.rows[0].email}`,
        ]
      );

      res.json({
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);

      res.status(500).json({
        message: "Unable to delete user",
      });
    }
  }
);

/* =========================
   AUDIT LOGS
========================= */

router.get(
  "/audit-logs",
  authenticateToken,
  requirePermission("view_audit_logs"),
  async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          a.id,
          a.action,
          a.details,
          a.ip_address,
          a.created_at,
          u.name AS user_name,
          u.email AS user_email
        FROM audit_logs a
        LEFT JOIN users u
          ON a.user_id = u.id
        ORDER BY a.created_at DESC
      `);

      res.json({
        logs: result.rows,
      });
    } catch (error) {
      console.error("Audit logs error:", error);

      res.status(500).json({
        message: "Unable to fetch audit logs",
      });
    }
  }
);

module.exports = router;