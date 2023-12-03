const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


//MIDDLEWARE
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xq1u8gq.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const usersCollection = client.db('eraaRealDb').collection('users');
    const houseCollection = client.db('eraaRealDb').collection('allHouses');
    const reviewsCollection = client.db('eraaRealDb').collection('reviews');
    const wishListCollection = client.db('eraaRealDb').collection('wishList');

    //jwt related api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });
      res.send({ token });
    })

    //middleware
    const varifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.Authorization);
      if (!req.headers.Authorization) {
        return res.status(401).send({ message: 'forbidden access' });
      }
      const token = req.headers.Authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
      })

    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    // user related api
    app.get('/users', varifyToken, verifyAdmin, async (req, res) => {
      console.log(req.headers);
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get('/user/admin/:email', varifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorised access' })
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });

    })

    app.post('/users', async (req, res) => {
      const user = req.body;
      //insert email if user not signupn yet  1.email unique/upsert/simple
      const query = { email: user.email }
      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exist', insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })
    //admin related api
    app.patch('/users/admin/:id', varifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updateDoc)
      res.send(result);
    })

    // user delete api
    app.delete('/users/:id', varifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    })

    // allHouse collection api
    app.get('/allHouses', async (req, res) => {
      const result = await houseCollection.find().toArray();
      res.send(result);
    })


    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })
    // house details
    app.get('/allHouse/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: id }
      const result = await houseCollection.findOne(query);
      res.send(result);
    })

    //all wishlist collection
    app.get('/wishList', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const result = await wishListCollection.find(query).toArray()
      res.send(result);
    })

    // wishList collection
    app.post('/wishList', async (req, res) => {
      const wishList = req.body;
      const result = await wishListCollection.insertOne(wishList)
      res.send(result);
    })
    // delete operation
    app.delete('/wishList/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await wishListCollection.deleteOne(query);
      res.send(result);

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

app.get('/', (req, res) => {
  res.send('  Eraa imobiliria is a famous site to deal your home .');
})

app.listen(port, () => {
  console.log(`era real estate is running on port ${port}`);
})