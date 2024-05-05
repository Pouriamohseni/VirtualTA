'use client'

const RasaAdminPanel = () => {
    return (
      <div>
        <h3>Rasa Server Status</h3>
        <table id="rasaServerStatus">
          <thead>
            <tr>
              <th>Server</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>RasaServer1 (Flask Backend)</td>
              <td id="rasaServer1Status">N/A</td>
            </tr>
            <tr>
              <td>Rasa (Core)</td>
              <td id="rasaCoreStatus">N/A</td>
            </tr>
          </tbody>
        </table>
        <br/><br/><br/>
        <h3>Rasa Actions</h3>
        <button onClick={() => RegenerateRasaConfig()}>Regenerate Rasa Config</button><br/><br/>
        <button onClick={() => KillRasaCore()}>Kill Rasa (Core)</button><br/><br/>
        <button onClick={() => RestartRasaCore()}>Restart Rasa (Core)</button><br/><br/>
        <button onClick={() => TrainRasaCore()}>Train Rasa (Core)</button><br/><br/>
  
        <h3>Rasa Backend Config</h3>
        <h4>Create Value</h4>
        <input type="text" id="newKey" placeholder="Key" />
        <input type="text" id="newValue" placeholder="Value" />
        <button onClick={() => SetConfigValue(document.getElementById('newKey').value, document.getElementById('newValue').value)}>Create</button>
        <br/><br/>
        <h4>Existing Configs</h4>
        <button onClick={() => GetRasaConfig()}>Refresh</button>
        <table id="configTable">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
              <th>Options</th>
            </tr>
          </thead>
        </table>
  
        <br/><br/>
      </div>
    );
  };
  
  export default RasaAdminPanel;
  