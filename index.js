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

       

        app.get('/Category', async(req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });    
       
        app.get('/products/:title', async (req, res) => {
            const name = req.params.title;
            const query = { category: name };
            const service = await productsCollection.find(query).toArray();
            res.send(service);
        });
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            

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
       
        app.get('/users/:role', async (req, res) => {
            const role = req.params.role;
            const query = { role: role};
            const user = await usersCollection.find(query).toArray();
            res.send(user);
        })
        app.get('/products1/:isAdvertise',verifyJWT, async (req, res) => {
            const isAdvertise = req.params.isAdvertise;
            console.log(isAdvertise);
            const query = { isAdvertise: isAdvertise};
            const result = await productsCollection.find(query).toArray();
            res.send(result);
        })
        app.post('/products',verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        app.get('/products',verifyJWT, async (req, res) => {
            const email = req.query.email;
           
            const query = { email: email };
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        })
        app.delete('/products/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/users/:id',verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.get('/bookings',verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email: email };
            const product = await bookingsCollection.find(query).toArray();
            res.send(product);
        })
        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingsCollection.findOne(query);
            res.send(booking);
        })
        app.post('/create-payment-intent',verifyJWT, async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });
        app.get('/bookings1/:email/:isWishList',verifyJWT, async (req, res) => {
            const email = req.params.email;
            const isWishList = req.params.isWishList;
            const query = { 
                email:email,
                isWishList:isWishList
             };
            const booking = await bookingsCollection.find(query).toArray();
            res.send(booking);
        })
        app.post('/payments',verifyJWT, async (req, res) =>{
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const filter1 = {id: id}

            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter1, updatedDoc)
            const updatedResult1 = await productsCollection.updateOne(filter, updatedDoc)

            res.send(result);
        })
       

    }
    finally{

    }

}
run().catch(console.log())

app.get('/',async(req,res)=>{
    res.send('Alexa is running');
})



app.listen(port,()=>console.log(`Alexa is running on ${port}`))


        
        
