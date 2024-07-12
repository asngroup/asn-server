const express = require('express')
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const port = process.env.PORT || 4000;




// middlewares
app.use(express.json())

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174",
            "https://asngroup.vercel.app"
        ],

        credentials: true,
        optionSuccessStatus: 200,
    })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.chd5zpb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        // await client.connect();
        // ---------All collection hare------------
        const usersCollection = client.db('asn-group').collection('users')
        const paymentCollection = client.db('asn-group').collection('payment')





        // JWT related api 
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ token });
        })

        // verify middleware 
        const verifyToken = (req, res, next) => {
            // console.log('inside verify Token ', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Khanpir Pola' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'Forbidden Access' })
                }
                req.decoded = decoded;
                next();
            })

        }

        // --------user related api--------
        // when user register on site store user information database
        app.post('/users', async (req, res) => {
            const user = req.body;
            // const query = { email: user.email }
            // const exitingUser = await usersCollection.findOne(query)
            // if (exitingUser) {
            //     return res.send({ message: 'user already exits', insertedId: null })
            // }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // User role and only user can access on the site
        // app.get('/users/:email', async (req, res) => {
        //     const email = req.params.email;
        //     if (email != req.decoded.email) {
        //         return res.status(403).send({ message: 'Unauthorize access' })
        //     }
        //     const query = { email: email };
        //     const people = await usersCollection.findOne(query)
        //     let user = false;
        //     if (people) {
        //         user = people?.role === 'user';
        //     }
        //     res.send({ user })
        // })

        // User Data Show   
        app.get('/users/:email', async (req, res) => {
            const query = { email: req.params.email }
            const result = await usersCollection.findOne(query);
            res.send(result);
        })


        app.get('/users', async (req, res) => {
            const user = req.body
            const query = await usersCollection.find(user).toArray()
            res.send(query)
        })
        

        // admin role only admin can access admin dashboard
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            if (email != req.decoded.email) {
                return res.status(403).send({ message: 'Unauthorize access' })
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user?.status === 'pending';
            }
            res.send({ admin })
        })



        // Make Admin Api
        app.patch('/users/admin/:id',   async (req, res) => {
            const id = req.params.id;
            // console.log(id)
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'approved'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result)
        })

        // -------- user section ---------





        // Payment related api  
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const paymentResult = await paymentCollection.insertOne(payment)
            res.send({ paymentResult })
        })


        //  show in paymentsCollection  
        app.get('/payments/:email', async (req, res) => {
            const query = { email: req.params.email }
            const result = await paymentCollection.find(query).toArray();
            res.send(result);
        })


        //  show in paymentsCollection  
        app.get('/payments', async (req, res) => {
            const result = await paymentCollection.find().toArray();
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


//  Testing server 
app.get('/', (req, res) => {
    res.send('ASN Group server is running')
})
app.listen(port, () => {
    console.log(`ASN server is running on port ${port}`)
})
