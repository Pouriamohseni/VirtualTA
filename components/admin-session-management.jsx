'use client'

const UserManagement = () => {
    return (
      <div>
        <h3>Create User</h3>
        <form id="createUserForm">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required /><br/>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" required /><br/>
          <label htmlFor="first_name">First Name:</label>
          <input type="text" id="first_name" name="first_name" required /><br/>
          <label htmlFor="last_name">Last Name:</label>
          <input type="text" id="last_name" name="last_name" required /><br/>
          <label htmlFor="mfa_enabled">MFA Enabled:</label>
          <input type="checkbox" id="mfa_enabled" name="mfa_enabled" /><br/>
        </form>
        <button onClick={() => createUser()}>Create User</button>
  
        <p>MFA Secret: <input type="text" id="mfaSecret" /></p>
  
        <h3>Enable MFA</h3>
        <form id="enableMFAForm">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" required /><br/>
        </form>
        <button onClick={() => enableMFA()}>Enable MFA</button>
  
        <h3>Rasa Session Management</h3>
        <table id="sessionTable">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Expires</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {/* Session data rows will be inserted here */}
          </tbody>
        </table>
  
        <h3>Users</h3>
        <table id="userTable">
          <thead>
            <tr>
              <th>Email</th>
              <th>Options</th>
            </tr>
          </thead>
          <tbody>
            {/* User data rows will be inserted here */}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default UserManagement;
  