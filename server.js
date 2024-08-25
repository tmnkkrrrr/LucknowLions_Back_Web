const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config();

const port = process.env.PORT || 8006;

require('./database/checkDB');

const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200
};



app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

app.use('/api', require('./routes/routes'));


app.get("/", (req, res) => {
    res.send("Lucknow Lions Deployment Succefull.............");
});
app.listen(port, () => {
    console.log(`Powerfull App listening on port ${port}`);
});
