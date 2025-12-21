const express = require('express');
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

require('dotenv').config();
const uri = process.env.MONGO_URI;


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
        const db = client.db('StudyDB');
        const partnerCollection = db.collection("partners");
        const requestCollection = db.collection("requests");

        // await client.db("admin").command({ ping: 1 });
        console.log(" Connected to MongoDB");

        app.get("/partners", async (req, res) => {
            const data = await partnerCollection.find().toArray();
            res.send(data);
        });

        app.post("/partners", async (req, res) => {
            try {
                const newPartner = req.body;
                const result = await partnerCollection.insertOne(newPartner);
                res.send({
                    success: true,
                    message: "Profile created successfully",
                    insertedId: result.insertedId
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    message: "Failed to create profile",
                    error: error.message
                });
            }
        });


        app.get("/partners/:id", async (req, res) => {
            const id = req.params.id;
            const partner = await partnerCollection.findOne({ _id: new ObjectId(id) });
            res.send(partner);
        });

        app.post("/partners/:id/request", async (req, res) => {
            const partnerId = req.params.id;
            const userEmail = req.body.userEmail;
            const partner = await partnerCollection.findOne({ _id: new ObjectId(partnerId) });
            if (!partner) return res.status(404).send({ message: "Partner not found" });

            await partnerCollection.updateOne(
                { _id: new ObjectId(partnerId) },
                { $inc: { partnerCount: 1 } }
            );

            const newRequest = {
                partnerId: partner._id,
                name: partner.name,
                profileimage: partner.profileimage,
                subject: partner.subject,
                studyMode: partner.studyMode,
                emailOfRequester: userEmail
            };

            await requestCollection.insertOne(newRequest);
            res.send({ message: "Partner request sent successfully" });
        });

        app.get("/requests", async (req, res) => {
            const userEmail = req.query.userEmail;
            const requests = await requestCollection.find({ emailOfRequester: userEmail }).toArray();
            res.send(requests);
        });

        app.get("/requests/:id", async (req, res) => {
            const id = req.params.id;
            const request = await requestCollection.findOne({ _id: new ObjectId(id) });
            res.send(request);
        });

        app.put("/requests/:id", async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body;
            const result = await requestCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updatedData }
            );
            res.send(result);
        });

        app.delete("/requests/:id", async (req, res) => {
            const id = req.params.id;
            await requestCollection.deleteOne({ _id: new ObjectId(id) });
            res.send({ message: "Deleted successfully" });
        });

    } finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(` Server running on port ${port}`);
});