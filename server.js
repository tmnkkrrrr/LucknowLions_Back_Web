const express = require("express");
const app = express();
const cors = require("cors");

require('dotenv').config();


const corsOptions = {
    origin: "*",
    credentials: true,
    optionSuccessStatus: 200
};


app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
    res.send("Lucknow Lions Web Back.............");
});


const port = process.env.PORT || 8010;
app.listen(port, () => {
    console.log(`Powerfull App listening on port ${port}`);
});