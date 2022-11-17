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
        //cors for localhost
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
        app.listen({ port: 9287 },()=>{
            console.log(app.printRoutes());
        })
    } catch (err) {
        console.log(err)
        process.exit(1)
    }
}
start()


// const Fastify = require('fastify')
// const fastify = Fastify({ logger: true })

// fastify.register((instance, opts, next) => {

//   instance.get('/', (req, res) => { res.send(req.raw.method) })
//   instance.post('/', (req, res) => { res.send(req.raw.method) })
//   instance.put('/', (req, res) => { res.send(req.raw.method) })
//   instance.patch('/', (req, res) => { res.send(req.raw.method) })

//   instance.get('/other', (req, res) => { res.send('other code') })

//   next()
// }, { prefix: 'user' })


// fastify.listen(3000, () => {
//   console.log(fastify.printRoutes());
// })