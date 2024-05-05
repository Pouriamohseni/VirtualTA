'use client'

const Admin = () => {
    return (
        <div>
            <h3>RasaServer1 Chat Logs</h3>
            <form id="queryForm">
                Start Time: <input type="datetime-local" id="startTime"></input><br/>
                End Time: <input type="datetime-local" id="endTime"></input><br/>
                User ID: <input type="text" id="userID" placeholder="Leave blank for everything..."></input><br/>
                Thread ID: <input type="text" id="threadID" placeholder="Leave blank for everything..."></input><br/>
                Message ID: <input type="text" id="messageID" placeholder="Leave blank for everything..."></input><br/>
                Side: <select id="side">
                    <option value="any">Any</option>
                    <option value="user">User</option>
                    <option value="bot">Bot</option>
                </select><br/>
                Flagged: <select id="flagged">
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                </select><br/>
                <button type="button" onclick="GetChatLogs()">Refresh</button>
            </form>

            <br/><br/>
            <h3>User and Bot Messages Over Time</h3>
            <canvas id="userBotChart" width="400" height="200"></canvas>

            <br/><br/>

            {/* <!-- Chat Logs Table --> */}
            <table class="contentTable" id="chatLogsTable">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>User ID</th>
                        <th>Thread ID</th>
                        <th>Message ID</th>
                        <th>Side</th>
                        <th>Message</th>
                        <th>Flagged</th>
                    </tr>
                </thead>
                <tbody>
                    {/* <!-- Log entries will be inserted here --> */}
                </tbody>
            </table>
        </div>
    );
};

export default Admin;
