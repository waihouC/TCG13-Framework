const express = require('express');
const hbs = require('hbs');
const wax = require('wax-on');
const fs = require('fs'); // import in the file system
const mysql = require("mysql2/promise");

let app = express();
// set which view engine to use
app.set('view engine', 'hbs');

// set where to find the static files
app.use(express.static('public'))

// setup wax on for template inheritance
wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// setup forms
app.use(express.urlencoded({
    extended:false
}))

const helpers = require('handlebars-helpers')({
  handlebars: hbs.handlebars
});

async function run() {
    const connection =  await mysql.createConnection({
        host: "localhost",
        user: "root",
        database: "sakila",
    });
    //console.log(connection);
    //let [rows] = await connection.execute("SELECT * FROM `actor`");
    //console.log(rows);

    // create the routes here
    app.get("/", async (req, res) => {
        let [actors] = await connection.execute("SELECT * from `actor`");
        res.render("index.hbs", {
        actors: actors,
        });
    });

    app.get("/actor/create", (req, res) => {
        res.render("create_actor.hbs");
    });
    
    // add new actor to db
    app.post("/actor/create", async (req, res) => {
        let firstName = req.body.first_name;
        let lastName = req.body.last_name;
        let query = `insert into actor (first_name, last_name) values (?,?)`;
        await connection.execute(query, [firstName, lastName]);
        res.redirect("/");
    });

    // get actor data to update
    app.get("/actor/:actor_id/edit", async (req, res) => {
        const [
          rows,
        ] = await connection.execute(`select * from actor where actor_id = ?`, [
          req.params.actor_id,
        ]);
        let actor = rows[0];
        res.render("edit_actor.hbs", {
          actor: actor,
        });
    });

    // update actor data to db
    app.post("/actor/:actor_id/edit", async (req, res) => {
        let firstName = req.body.first_name;
        let lastName = req.body.last_name;
        let query = `update actor set first_name = ?, last_name = ? where actor_id = ?`;
        await connection.execute(query, [firstName, lastName, req.params.actor_id]);
        res.redirect("/");
    });

    // get countries from db
    app.get("/country", async (req, res) => {
        let [countries] = await connection.execute(`select * from country`);
        //console.log(countries);
        res.render("country.hbs", {
            country: countries
        });
    });

    // get country to edit
    app.get("/country/:country_id/edit", async (req, res) => {
        const [rows] = await connection.execute(`select * from country where country_id = ?`, [
            req.params.country_id
        ]);
        //console.log(rows);
        let country = rows[0];
        res.render("edit_country.hbs", {
            country: country
        });
    });

    // update country to db
    app.post("/country/:country_id/edit", async (req, res) => {
        let country = req.body.country;
        let query = `update country set country = ? where country_id = ?`;
        await connection.execute(query, [country, req.params.country_id]);
        res.redirect("/country");
    });
}

run();

app.listen(3000, ()=>{
 console.log("Server started");
});