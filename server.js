const Fastify = require('fastify')
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const autoload = require('@fastify/autoload');
const path = require('path');
const fastify_graceful_shutdown = require('fastify-graceful-shutdown')
const multiplayerSocketService = require('./app/services/multiplayerSocketService');
require('dotenv').config();


const start = async () => {
    try {
        const app = Fastify({
            logger:false,
            exitOnError: false
            // forceCloseConnections: true,
        });
        app.register(require('@fastify/multipart'), {
            limits: {
                fieldNameSize: 100, // Max field name size in bytes
                fieldSize: 100,     // Max field value size in bytes
                fields: 10,         // Max number of non-file fields
                fileSize: 1*1024*1024 ,  // 1MB in bytes
                files: 1,           // Max number of file fields
                headerPairs: 50   // Max number of header key=>value pairs
            }
        });
        multiplayerSocketService.init();
        app.register(cors, {
            origin: "https://minesweeper-go.ru",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        });
        app.setErrorHandler(function (error, request, reply) {
            console.log(error)
            reply.status(500).send({ message: "Ошибка сервера" })
        })
        app.register(require('@fastify/websocket'))
        app.register(require('@fastify/mongodb'), {
            forceClose: true,
            url: process.env.MONGO_URL,
        })
        app.register(require('@fastify/jwt'), {
            secret: process.env.JWT_SECRET,
        })
        app.register(autoload, {
            dir: path.join(__dirname,'./app/routes'),
            ignorePattern: /schemas$/
        })
        process.on('uncaughtException', function(err) {
            console.log('Caught exception: ' + err);
          });
          app.ready(err => {
            if (err) {
              console.log(err)
              return;
            }
            console.log('MongoDB connection established');
          });
        app.decorate("authenticate", async function(request, reply) {
            try {
                if (request.query?.token) request.headers.authorization = `Bearer ${request.query.token}` //for websockets
                await request.jwtVerify()
                const users = request.mongo.collection('users');
                const user = await users.count({token:request.headers.authorization.split(' ')[1]}, {limit: 1});
                if (!user) {
                    reply.code(401).send({message: "Unauthorized"})
                    return;  
                }
            } catch (err) {
                console.log(err)
                reply.send(err)
            }                  
        })

        app.addHook('onRequest', (req, res, next) => {
            const url_path = req.raw.url;
            console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${url_path} ${JSON.stringify(req.query)??""} ${JSON.stringify(req.params)??""}`);
            req.mongo = app.mongo.client.db('minesweeper_go');
            req.jwt = app.jwt;
            next()
        }) 
  
        app.listen(process.env.SERVER_PORT,"0.0.0.0" ,()=>{
            console.log("Server started")
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}
start()
