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
        // app.get('/products', async(req, res) => {
        //     const query = {}
        //     const cursor = productsCollection.find(query);
        //     const services = await cursor.toArray();
        //     res.send(services);
        // });    
        // app.post('/Category/:title', async (req, res) => {
        //     const doctor = req.body;
        //     const title=req.params.title;
        //     const query = { title:title};
        //     const result = await productCollection.find(query);
        //     const trial = await result.insertOne(doctor);
        //     res.send(trial);
        // });
        app.get('/products/:title', async (req, res) => {
            const name = req.params.title;
            const query = { category: name };
            const service = await productsCollection.find(query).toArray();
            res.send(service);
        });
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            // const query = {
            //     appointmentDate: booking.appointmentDate,
            //     email: booking.email,
            //     treatment: booking.treatment 
            // }

            // const alreadyBooked = await bookingsCollection.find(query).toArray();

            // if (alreadyBooked.length){
            //     const message = `You already have a booking on ${booking.appointmentDate}`
            //     return res.send({acknowledged: false, message})
            // }

            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        })
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' });
        })
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        })
        app.put('/products2/:email',verifyJWT,  async (req, res) => {
            const email = req.params.email;
            const filter = {email:email}
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isVerified: 'verified'
                }
            }
            const result1 = await productsCollection.updateOne(filter, updatedDoc, options);
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result1);
        })
        app.put('/products/:id',verifyJWT,  async (req, res) => {
            const id = req.params.id;
            const filter = { _id:ObjectId(id)}
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    isAdvertise: 'Advertised'
                }
            }
            const result = await productsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // app.put('/products3/:id',  async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id:ObjectId(id)}
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             isWishList: 'Wishedlist'
        //         }
        //     }
        //     const result = await productsCollection.updateOne(filter, updatedDoc, options);
        //     res.send(result);
        // })
        

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
        
