import { useEffect, useState } from "react";
import "./App.css";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const [crmLeads, setCrmLeads] = useState([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmError, setCrmError] = useState("");

  /* SESSION TIMEOUT */
  useEffect(() => {
    if (!user) {
      return;
    }

    const timeout = setTimeout(() => {
      alert("Your session has expired. Please login again.");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
      setUsers([]);
      setLogs([]);
      setCrmLeads([]);
      setActiveSection("dashboard");
      setEmail("");
      setPassword("");
    }, 60 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [user]);

  const getToken = () => {
    return localStorage.getItem("token");
  };

  /* ZOHO SERVICES */
  const services = [
    {
      name: "Zoho People",
      description: "Employee information and HR management",
      permission: "access_people",
      icon: "👥",
    },
    {
      name: "Zoho CRM",
      description: "Customer and sales management",
      permission: "access_crm",
      icon: "📊",
    },
    {
      name: "Zoho Desk",
      description: "Customer support and ticket management",
      permission: "access_desk",
      icon: "🎧",
    },
    {
      name: "Zoho Books",
      description: "Accounting and financial management",
      permission: "access_books",
      icon: "💰",
    },
  ];

  const hasServiceAccess = permission => {
    if (!user) {
      return false;
    }

    if (user.role === "Admin") {
      return true;
    }

    if (user.role === "Manager") {
      return [
        "access_people",
        "access_crm",
        "access_desk",
      ].includes(permission);
    }

    return permission === "access_people";
  };

  /* ZOHO CRM */
  const getCRMLeads = async () => {
    setCrmLoading(true);
    setCrmError("");

    try {
      const response = await fetch(
        `${API}/api/zoho/crm/leads`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setCrmError(
          data.message || "Unable to load Zoho CRM data"
        );
        setCrmLoading(false);
        return;
      }

      setCrmLeads(data.data?.data || []);
      setActiveSection("crm");
    } catch (error) {
      console.error(error);
      setCrmError("Unable to connect to Zoho CRM");
    }

    setCrmLoading(false);
  };

  const openService = serviceName => {
    if (serviceName === "Zoho CRM") {
      getCRMLeads();
      return;
    }

    alert(
      `🔐 Secure Access\n\n${serviceName}\n\nYour ${user.role} permissions have been verified successfully.\n\nAccess is provided through the Employee Portal.`
    );
  };

  /* LOGIN */
  const handleLogin = async event => {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setMessage("");
      setEmail("");
      setPassword("");
      setActiveSection("dashboard");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    }
  };

  /* LOGOUT */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setUsers([]);
    setLogs([]);
    setCrmLeads([]);
    setActiveSection("dashboard");
    setEmail("");
    setPassword("");
    setMessage("");
  };

  /* GET USERS */
  const getUsers = async () => {
    try {
      const response = await fetch(`${API}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to load users");
        return;
      }

      setUsers(data.users || data);
    } catch (error) {
      console.error(error);
      alert("Unable to load users");
    }
  };

  /* GET AUDIT LOGS */
  const getAuditLogs = async () => {
    try {
      const response = await fetch(
        `${API}/api/admin/audit-logs`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to load audit logs");
        return;
      }

      setLogs(data.logs || data);
    } catch (error) {
      console.error(error);
      alert("Unable to load audit logs");
    }
  };

  /* OPEN USERS */
  const openUsers = () => {
    setActiveSection("users");
    getUsers();
  };

  /* OPEN AUDIT LOGS */
  const openLogs = () => {
    setActiveSection("logs");
    getAuditLogs();
  };

  /* ADD USER */
  const handleAddUser = async event => {
    event.preventDefault();

    if (!newName || !newEmail || !newPassword) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch(`${API}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to create user");
        return;
      }

      alert("Employee created successfully");

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setShowAddForm(false);

      getUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to create employee");
    }
  };

  /* CHANGE ROLE */
  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            role: newRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to update role");
        getUsers();
        return;
      }

      alert("Role updated successfully");

      getUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to update role");
    }
  };

  /* START EDIT */
  const startEdit = employee => {
    setEditingUser(employee.id);
    setEditName(employee.name);
    setEditEmail(employee.email);
  };

  /* CANCEL EDIT */
  const cancelEdit = () => {
    setEditingUser(null);
    setEditName("");
    setEditEmail("");
  };

  /* UPDATE USER */
  const handleUpdateUser = async userId => {
    if (!editName || !editEmail) {
      alert("Name and email are required");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getToken()}`,
          },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to update user");
        return;
      }

      alert("Employee updated successfully");

      cancelEdit();
      getUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to update employee");
    }
  };

  /* DELETE USER */
  const handleDeleteUser = async userId => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to delete user");
        return;
      }

      alert("Employee deleted successfully");

      getUsers();
    } catch (error) {
      console.error(error);
      alert("Unable to delete employee");
    }
  };

  /* INITIAL USER CHECK */
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
  }, []);

  /* LOGIN PAGE */
  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo-circle">EP</div>

          <h1>Employee Portal</h1>

          <p className="subtitle">
            Secure access to your employee services
          </p>

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={event => setEmail(event.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={event =>
                setPassword(event.target.value)
              }
            />

            <button type="submit" className="login-button">
              Login
            </button>
          </form>

          {message && <p className="error">{message}</p>}

          <p className="login-footer">
            Secure Employee Access Portal
          </p>
        </div>
      </div>
    );
  }

  /* DASHBOARD */
  const renderDashboard = () => {
    const accessibleServices = services.filter(service =>
      hasServiceAccess(service.permission)
    );

    return (
      <>
        <div className="page-heading">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back, {user.name}</p>
          </div>

          <div className="security-badge">
            🔒 Secure Session
          </div>
        </div>

        <div className="user-info">
          <p>
            <strong>Name:</strong> {user.name}
          </p>

          <p>
            <strong>Email:</strong> {user.email}
          </p>

          <p>
            <strong>Role:</strong> {user.role}
          </p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👤</div>

            <div>
              <span>Current Role</span>
              <strong>{user.role}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔐</div>

            <div>
              <span>Authentication</span>
              <strong>JWT Protected</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📱</div>

            <div>
              <span>Available Services</span>
              <strong>{accessibleServices.length}</strong>
            </div>
          </div>
        </div>

        <div className="section-heading">
          <h2>My Zoho Services</h2>

          <p>
            Access the Zoho services assigned to your role.
          </p>
        </div>

        <div className="service-grid">
          {accessibleServices.map(service => (
            <div className="service-card" key={service.name}>
              <div className="service-icon">
                {service.icon}
              </div>

              <h3>{service.name}</h3>

              <p>{service.description}</p>

              <button
                onClick={() => openService(service.name)}
              >
                Open Service
              </button>
            </div>
          ))}
        </div>

        {user.role === "Admin" && (
          <div className="admin-summary">
            <div>
              <h2>Administrator Access</h2>

              <p>
                You have full access to employee management,
                roles, permissions and audit logs.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={openUsers}
            >
              Manage Employees
            </button>
          </div>
        )}
      </>
    );
  };

  /* CRM PAGE */
  const renderCRM = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <h2>Zoho CRM</h2>

            <p>
              Real-time CRM Leads retrieved securely through
              the Employee Portal.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={getCRMLeads}
          >
            Refresh Leads
          </button>
        </div>

        {crmLoading && (
          <div className="form-card">
            <h3>Loading Zoho CRM...</h3>
            <p>
              Securely retrieving CRM data through the backend.
            </p>
          </div>
        )}

        {crmError && (
          <div className="form-card">
            <h3>Unable to load CRM data</h3>
            <p>{crmError}</p>
          </div>
        )}

        {!crmLoading && !crmError && (
          <div className="table-card">
            <div className="table-header">
              <h3>CRM Leads</h3>

              <span>
                {crmLeads.length} lead
                {crmLeads.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Company</th>
                  </tr>
                </thead>

                <tbody>
                  {crmLeads.map((lead, index) => (
                    <tr key={lead.id || index}>
                      <td>{lead.First_Name || "-"}</td>
                      <td>{lead.Last_Name || "-"}</td>
                      <td>{lead.Email || "-"}</td>
                      <td>{lead.Company || "-"}</td>
                    </tr>
                  ))}

                  {crmLeads.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        No CRM leads found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
    );
  };

  /* USERS PAGE */
  const renderUsers = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <h2>Employee Management</h2>

            <p>
              Manage employees, roles and access permissions.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Close Form" : "+ Add Employee"}
          </button>
        </div>

        {showAddForm && (
          <div className="form-card">
            <h3>Add New Employee</h3>

            <form onSubmit={handleAddUser}>
              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Employee name"
                  value={newName}
                  onChange={event =>
                    setNewName(event.target.value)
                  }
                />

                <input
                  type="email"
                  placeholder="Employee email"
                  value={newEmail}
                  onChange={event =>
                    setNewEmail(event.target.value)
                  }
                />

                <input
                  type="password"
                  placeholder="Temporary password"
                  value={newPassword}
                  onChange={event =>
                    setNewPassword(event.target.value)
                  }
                />
              </div>

              <div className="form-actions">
                <button type="submit">
                  Create Employee
                </button>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="table-card">
          <div className="table-header">
            <h3>Employees</h3>

            <span>
              {users.length} employee
              {users.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map(employee => (
                  <tr key={employee.id}>
                    <td>
                      {editingUser === employee.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={event =>
                            setEditName(event.target.value)
                          }
                        />
                      ) : (
                        <div className="employee-cell">
                          <div className="small-avatar">
                            {employee.name
                              ? employee.name
                                  .charAt(0)
                                  .toUpperCase()
                              : "U"}
                          </div>

                          <span>{employee.name}</span>
                        </div>
                      )}
                    </td>

                    <td>
                      {editingUser === employee.id ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={event =>
                            setEditEmail(event.target.value)
                          }
                        />
                      ) : (
                        employee.email
                      )}
                    </td>

                    <td>
                      {employee.id === user.id ? (
                        <span className="role">
                          {employee.role}
                        </span>
                      ) : (
                        <select
                          value={employee.role || "Employee"}
                          onChange={event =>
                            handleRoleChange(
                              employee.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">
                            Manager
                          </option>
                          <option value="Employee">
                            Employee
                          </option>
                        </select>
                      )}
                    </td>

                    <td>
                      <span className="status">
                        ● {employee.status || "active"}
                      </span>
                    </td>

                    <td>
                      {employee.id === user.id ? (
                        <span className="action-badge">
                          Current User
                        </span>
                      ) : editingUser === employee.id ? (
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() =>
                              handleUpdateUser(employee.id)
                            }
                          >
                            Save
                          </button>

                          <button
                            className="cancel-button"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() =>
                              startEdit(employee)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDeleteUser(employee.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  /* ROLES PAGE */
  const renderRoles = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <h2>Roles & Permissions</h2>

            <p>
              Role-based access control for the Employee Portal.
            </p>
          </div>
        </div>

        <div className="role-grid">
          <div className="role-card">
            <div className="role-card-icon">👑</div>

            <h3>Admin</h3>

            <p>Full system access.</p>

            <ul>
              <li>Manage employees</li>
              <li>Manage roles</li>
              <li>View audit logs</li>
              <li>Access all Zoho services</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-card-icon">👔</div>

            <h3>Manager</h3>

            <p>Management-level access.</p>

            <ul>
              <li>View dashboard</li>
              <li>Zoho People</li>
              <li>Zoho CRM</li>
              <li>Zoho Desk</li>
            </ul>
          </div>

          <div className="role-card">
            <div className="role-card-icon">👤</div>

            <h3>Employee</h3>

            <p>Limited employee access.</p>

            <ul>
              <li>View dashboard</li>
              <li>Zoho People</li>
              <li>No admin controls</li>
              <li>Restricted services</li>
            </ul>
          </div>
        </div>

        <div className="rbac-info">
          <h3>How RBAC Works</h3>

          <p>
            Every API request is authenticated using JWT and
            checked against the user's assigned role and
            permissions before access is granted.
          </p>
        </div>
      </>
    );
  };

  /* AUDIT LOGS */
  const renderLogs = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <h2>Audit Logs</h2>

            <p>
              Track important employee portal activities.
            </p>
          </div>

          <button onClick={getAuditLogs}>
            Refresh Logs
          </button>
        </div>

        <div className="table-card">
          <div className="table-header">
            <h3>System Activity</h3>

            <span>{logs.length} records</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      {log.user_name || "System"}
                    </td>

                    <td>
                      <span className="action-badge">
                        {log.action}
                      </span>
                    </td>

                    <td>{log.details}</td>

                    <td>{log.ip_address || "-"}</td>

                    <td>
                      {log.created_at
                        ? new Date(
                            log.created_at
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan="5">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  /* MAIN PORTAL */
  return (
    <div className="portal">
      <header className="header">
        <div className="brand">
          <div className="brand-icon">EP</div>

          <div>
            <h1>Employee Portal</h1>

            <p>
              Secure access to employee services
            </p>
          </div>
        </div>

        <div className="profile">
          <div className="profile-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <div className="avatar">
            {user.name
              ? user.name.charAt(0).toUpperCase()
              : "U"}
          </div>

          <div className="role">{user.role}</div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-title">
            MAIN MENU
          </div>

          <button
            className={
              activeSection === "dashboard"
                ? "active-menu"
                : ""
            }
            onClick={() =>
              setActiveSection("dashboard")
            }
          >
            🏠 Dashboard
          </button>

          {user.role === "Admin" && (
            <>
              <div className="sidebar-title admin-title">
                ADMINISTRATION
              </div>

              <button
                className={
                  activeSection === "users"
                    ? "active-menu"
                    : ""
                }
                onClick={openUsers}
              >
                👥 Employees
              </button>

              <button
                className={
                  activeSection === "roles"
                    ? "active-menu"
                    : ""
                }
                onClick={() =>
                  setActiveSection("roles")
                }
              >
                🔐 Roles & Permissions
              </button>

              <button
                className={
                  activeSection === "logs"
                    ? "active-menu"
                    : ""
                }
                onClick={openLogs}
              >
                📋 Audit Logs
              </button>
            </>
          )}
        </aside>

        <main className="content">
          {activeSection === "dashboard" &&
            renderDashboard()}

          {activeSection === "crm" &&
            hasServiceAccess("access_crm") &&
            renderCRM()}

          {activeSection === "users" &&
            user.role === "Admin" &&
            renderUsers()}

          {activeSection === "roles" &&
            user.role === "Admin" &&
            renderRoles()}

          {activeSection === "logs" &&
            user.role === "Admin" &&
            renderLogs()}
        </main>
      </div>
    </div>
  );
}

export default App;

