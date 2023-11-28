const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;


//MIDDLEWARE
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
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

    const houseCollection = client.db('eraaRealDb').collection('allHouses');
    const reviewsCollection = client.db('eraaRealDb').collection('reviews');
    const wishListCollection = client.db('eraaRealDb').collection('wishList');


    app.get('/allHouses', async (req, res) => {
      const result = await houseCollection.find().toArray();
      res.send(result);
    })

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })
    // house details
    app.get('/allHouse', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await houseCollection.findOne(query);
      res.send(result);
    })

    // wishList collection
    app.post('/wishList', async (req, res) => {
      const wishList = req.body;
      const result = await wishListCollection.insertOne(wishList)
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