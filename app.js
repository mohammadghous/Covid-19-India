const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

app.use(express.json());

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

let db = null;

const dbPath = path.join(__dirname, "covid19India.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//Get All States API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//Get a State details API

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId}
    `;
  const state = await db.get(getStateDetailsQuery);
  response.send(convertDbObjectToResponseObject(state));
});

//Get a District details API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictDetailsQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId}
    `;
  const district = await db.get(getDistrictDetailsQuery);
  response.send(convertDbObjectToResponseObject1(district));
});

//Delete a District API

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId}
    `;
  const district = await db.get(deleteDistrictQuery);
  response.send("District Removed");
});

//Post New District API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `
    INSERT INTO 
    district (district_name, state_id, cases, cured, active, deaths)
    VALUES ('${districtName}',${stateId}, ${cases}, ${cured}, ${active}, ${deaths});
    `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//Put District API

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name = '${districtName}',
      state_id = ${stateId},
      cases = ${cases},
      cured = ${cured},
      active = ${active},
      deaths = ${deaths}
    WHERE district_id = ${districtId}
      `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//Get Statistics API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatisticsQuery = `
    SELECT 
     SUM(cases), SUM(cured), SUM(active), SUM(deaths)
    FROM district
    WHERE state_id = ${stateId}
    `;
  const statistics = await db.get(getStatisticsQuery);
  response.send({
    totalCases: statistics["SUM(cases)"],
    totalCured: statistics["SUM(cured)"],
    totalActive: statistics["SUM(active)"],
    totalDeaths: statistics["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateDetailsQuery = `
    SELECT state_id FROM district
    WHERE district_id = ${districtId}
    `;
  const state = await db.get(getStateDetailsQuery);

  const getStateNameQuery = `
  SELECT state_name as stateName FROM state WHERE state_id = ${state.state_id}
  `;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});
module.exports = app;
