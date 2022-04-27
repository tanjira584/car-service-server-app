const express = require("express");
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_NAME}:${process.env.DB_PASS}@cluster0.3jhfr.mongodb.net/carService?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        const userCollection = client.db("carService").collection("service");
        const orderCollection = client.db("carService").collection("order");

        app.post("/login", async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "1d",
            });
            res.send({ accessToken });
        });

        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = userCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        });
        app.get("/order", verifyJwt, async (req, res) => {
            const email = req.query.email;
            const decodeEmail = req.decode.email;
            if (email === decodeEmail) {
                const query = { email: email };
                const cursor = orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            } else {
                res.status(401).send({ message: "Unauthorize user" });
            }
        });
        app.post("/order", async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            res.send(result);
        });
        app.get("/service/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        });
        app.post("/services", async (req, res) => {
            const newService = req.body;
            const result = await userCollection.insertOne(newService);
            res.send(result);
        });
        app.delete("/service/:serviceId", async (req, res) => {
            const serviceId = req.params.serviceId;
            const query = { _id: ObjectId(serviceId) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        });
        app.put("/service/:id", async (req, res) => {
            const id = req.params.id;
            const updService = req.body;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updService.name,
                    description: updService.description,
                    price: updService.price,
                    img: updService.img,
                },
            };
            const result = await userCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.send(result);
        });
    } finally {
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("This is home route of server");
});
function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized user" });
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decode) => {
        if (err) {
            console.log("ace");
            return res.status(403).send({ message: "Forbiden access" });
        }
        req.decode = decode;
        next();
    });
}
app.listen(port, () => {
    console.log("Server is running successfully on Port: " + port);
});
