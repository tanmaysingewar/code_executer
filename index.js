const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()

const app = express();

//Connecting to MONGODB (Locally)
mongoose.connect(process.env.MONGO_CONN_LOCAL,{
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(()=>{
    console.log('DB IS CONNECTED')
})

const requestTimeoutMiddleware = (timeout) => {
    return (req, res, next) => {
      let isResponseSent = false;
  
      const requestTimer = setTimeout(() => {
        if (!isResponseSent) {
          isResponseSent = true;
          res.status(408).json({ 
            success: false,
            error: 'Request Timeout' });
          res.end();
        }
      }, timeout);
  
      req.on('end', () => {
        clearTimeout(requestTimer);
      });
  
      next();
    };
  };

//Importing route
// const userRoutes = require("./routes/user")
const runnerRoutes = require("./routes/runner")

//middlewares
app.use(bodyParser.json())
app.use(cors())

// app.use(requestTimeoutMiddleware(50)); // 5 seconds timeout
// app.use("/api",userRoutes)
app.use("/api/runner",runnerRoutes)

// Port 
const port = process.env.PORT || 8081

app.listen(port, ()=>{
    console.log('SERVER IS RUNNING AT',port)
})