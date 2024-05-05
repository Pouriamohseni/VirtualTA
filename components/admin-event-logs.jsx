'use client'

const RasaServer1EventLogs = () => {
    return (
      <div>
        <h3>RasaServer1 Event Logs</h3>
        <br/><br/>
        <table id="configTable">
          <thead>
            <tr>
              <th>Option</th>
              <th>Value</th>
            </tr>
          </thead>
        </table>
        {/* Query Configuration Form */}
        <form id="queryForm">
          <label>
            Criticality: 
            <select id="criticality">
              <option value="Any">Any</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
              <option value="WARNING">WARNING</option>
              <option value="ERROR">ERROR</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </label><br/>
          <label>
            Start Time: 
            <input type="datetime-local" id="startTime" />
          </label><br/>
          <label>
            End Time: 
            <input type="datetime-local" id="endTime" />
          </label><br/>
          <label>
            Resource: 
            <input type="text" id="resource" placeholder="'System' for global logs, or put a resource name. Leave blank for everything..." />
          </label><br/>
          <button type="button" onClick={() => GetEventLogs()}>Refresh</button>
        </form>
  
        <h3>Logging Activity Over Time</h3>
        <canvas id="logChart" width="800" height="400"></canvas>
  
        {/* Event Logs Table */}
        <table className="contentTable" id="eventLogsTable">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Resource</th>
              <th>Message</th>
              <th>Criticality</th>
            </tr>
          </thead>
          <tbody>
            {/* Log entries will be inserted here */}
          </tbody>
        </table>
      </div>
    );
  };
  
  export default RasaServer1EventLogs;
  