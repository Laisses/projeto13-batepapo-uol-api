import dayjs from "dayjs";

export const routes = (app, db) => {
    const participants = db.collection("participants");
    const messages = db.collection("messages");

    app.post("/participants", async (req, res) => {
        const { name } = req.body;

        const users = await participants
            .find()
            .toArray();

        users.forEach(user => {
            if (user.name === name) {
                res.sendStatus(409);
            }
        })

        await participants.insertOne({
            name,
            lastStatus: Date.now()
        });

        await messages.insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(new Date()).format("HH:MM:ss")
        });

        res.sendStatus(201);
    });

    app.get("/participants", async (_req, res) => {
        const users = await participants.find().toArray();
        res.status(200).send(users);
    });

    app.post("/messages", async (req, res) => {
        const { to, text, type } = req.body;
        const from = req.headers.user;
        await messages.insertOne({
            from,
            to,
            text,
            type,
            time: dayjs(new Date()).format("HH:mm:ss")
        });

        res.sendStatus(201);
    });

    app.get("/messages", async (req, res) => {
        const { limit } = req.query;
        const { user } = req.headers;
        const allMessages = await messages.find().limit(Number(limit) || 0).toArray();

        const filteredMessages = allMessages.filter(message => {
            if ((message.to === user || message.from === user) && message.type === "private_message") {
                return true;
            } else if (message.type === "private_message"){
                return false;
            } else {
                return true;
            }
        })
        console.log(req.headers)
        res.status(200).send(filteredMessages);
    });
}