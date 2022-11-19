const Fastify = require('fastify')
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const autoload = require('@fastify/autoload');
const path = require('path');
const fs = require('fs')
require('dotenv').config();


const start = async () => {
    try {
        const app = Fastify({
            logger:false,
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
        app.register(cors, {
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['*'],
            credentials: true,
        });
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

        app.decorate("authenticate", async function(request, reply) {
            try {
                await request.jwtVerify()
            } catch (err) {
                reply.send(err)
            }
        })
        app.addHook('onRequest', (req, res, next) => {
            console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${JSON.stringify(req.query)??""} ${JSON.stringify(req.params)??""}`);
            req.mongo = app.mongo.client.db('minesweeper_go');
            req.jwt = app.jwt;
            next()
        }) 
        app.listen({ port: process.env.SERVER_PORT },()=>{
            // console.log(app.printRoutes());
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}
start()
