const express = require('express')
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const cors = require('cors')
const port = process.env.PORT || 4000;

// middlewares
app.use(express.json())

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5174"
        ],

        credentials: true,
        optionSuccessStatus: 200,
    })
);

const uri = `mongodb+srv://asn:4nGKpNU3qWEe7nyU@cluster0.chd5zpb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        await client.connect();
        // ---------All collection hare------------
        const usersCollection = client.db('asn-group').collection('users')

        // --------user related api--------
        // when user register on site store user information database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const exitingUser = await usersCollection.findOne(query)
            if (exitingUser) {
                return res.send({ message: 'user already exits', insertedId: null })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })

        // User role and only user can access on the site
        app.get('/users/user/:email', async (req, res) => {
            const email = req.params.email;
            if (email != req.decoded.email) {
                return res.status(403).send({ message: 'Unauthorize access' })
            }
            const query = { email: email };
            const people = await usersCollection.findOne(query)
            let user = false;
            if (people) {
                user = people?.role === 'user';
            }
            res.send({ user })
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
                admin = user?.role === 'admin';
            }
            res.send({ admin })
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
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