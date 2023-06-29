const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`ERROR DB: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
//Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
        SELECT
            player_id as playerId,
            player_name as playerName
        FROM
            player_details
    `;
  const allPlayerInfo = await db.all(getAllPlayersQuery);
  response.send(allPlayerInfo);
});

//API 2
//Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `
        SELECT
            player_id as playerId,
            player_name as playerName
        FROM 
            player_details
        WHERE
            player_id = ${playerId};
    `;
  const particularPlayer = await db.get(getPlayerByIdQuery);
  response.send(particularPlayer);
});

//API 3
//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerByIdQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerByIdQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getParticularMatchDetailsQuery = `
        SELECT
            match_id as matchId,
            match as match,
            year as year
        FROM
            match_details
        WHERE
            match_id = ${matchId};
    `;
  const particularMatch = await db.get(getParticularMatchDetailsQuery);
  response.send(particularMatch);
});

//API 5
//Returns a list of all the matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesPlayedByPlayerQuery = `
        SELECT
            match_details.match_id as matchId,
            match_details.match as match,
            match_details.year as year
        FROM
            player_match_score INNER JOIN match_details
            ON player_match_score.match_id = match_details.match_id
        WHERE
            player_id = ${playerId};
    `;
  const matchesPlayedByPlayer = await db.all(getMatchesPlayedByPlayerQuery);
  response.send(matchesPlayedByPlayer);
});

//API 6
//Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getListOfPlayersInMatchQuery = `
        SELECT
            player_details.player_id as playerId,
            player_details.player_name as playerName
        FROM
            player_match_score INNER JOIN player_details
            ON player_match_score.player_id = player_details.player_id
        WHERE
            player_match_score.match_id = ${matchId};        
    `;
  const playersPlayerInMatch = await db.all(getListOfPlayersInMatchQuery);
  response.send(playersPlayerInMatch);
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
        SELECT
            player_details.player_id as playerId,
            player_details.player_name as playerName,
            SUM(player_match_score.score) as totalScore,
            SUM(player_match_score.fours) as totalFours,
            SUM(player_match_score.sixes) as totalSixes
        FROM
            player_match_score INNER JOIN player_details 
            ON player_match_score.player_id = player_details.player_id
        WHERE
            player_match_score.player_id = ${playerId}
        GROUP BY
            player_details.player_id;
    `;
  const playerStats = await db.get(getStatsQuery);
  response.send(playerStats);
});

app.get("/", async (request, response) => {
  const getAllDetailsOfMatchScoreQuery = `
    SELECT * FROM player_match_score;
    `;
  const result = await db.all(getAllDetailsOfMatchScoreQuery);
  response.send(result);
});

module.exports = app;
