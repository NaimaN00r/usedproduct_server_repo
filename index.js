const express = require('express');
const cors=require('cors');
const jwt = require('jsonwebtoken'); 
const { MongoClient, ServerApiVersion, ObjectId,} = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port=process.env.PORT || 4500;


const app=express();

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3b6qmgb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(uri);
function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}

async function run(){
    try{
        const categoryCollection = client.db('Mobiles').collection('Category');
        const bookingsCollection = client.db('Mobiles').collection('bookings');
        const usersCollection = client.db('Mobiles').collection('users');
        const productsCollection = client.db('Mobiles').collection('products');
        const paymentsCollection = client.db('Mobiles').collection('payments');

        // NOTE: make sure you use verifyAdmin after verifyJWT
        // const verifyAdmin = async (req, res, next) =>{
        //     const decodedEmail = req.decoded.email;
        //     const query = { email: decodedEmail };
        //     const user = await usersCollection.findOne(query);

        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ message: 'forbidden access' })
        //     }
        //     next();
        // }

        app.get('/Category', async(req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });    
        

    }
    finally{

    }

}
run().catch(console.log())

app.get('/',async(req,res)=>{
    res.send('Alexa is running');
})



app.listen(port,()=>console.log(`Alexa is running on ${port}`))


        //  * API Naming Convention 
        //  * app.get('/bookings')
        //  * app.get('/bookings/:id')
        //  * app.post('/bookings')
        //  * app.patch('/bookings/:id')
        //  * app.delete('/bookings/:id')
        
