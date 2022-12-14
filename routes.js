import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { validateMessage, validateParticipant } from "./validator.js";

export const routes = (app, db) => {
    const participants = db.collection("participants");
    const messages = db.collection("messages");

    app.post("/participants", async (req, res) => {
        const { name } = req.body;
        const { error } = validateParticipant(req.body);
        const now = Date.now();

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            res.status(422).send(errors);
            return;
        }

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
            lastStatus: now
        });

        await messages.insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs(now).format("HH:MM:ss")
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

        const participant = await participants.findOne({ "name": from });
        const { error } = validateMessage(req.body);

        if (participant === null || participant === undefined) {
            res.status(422).send("username not found");
            return;
        }

        if (error) {
            const errors = error.details.map((detail) => detail.message);
            res.status(422).send(errors);
            return;
        }

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
        res.status(200).send(filteredMessages);
    });

    app.post("/status", async (req, res) => {
        const { user } = req.headers;

        const participant = await participants.findOne({ "name": user });

        if (!participant) {
            res.sendStatus(404);
            return;
        }

        await participants.updateOne(
            {"name": user},
            {$set: {"lastStatus": Date.now()}}
        );

        res.sendStatus(200);
    });

    app.delete("/messages/:id", async (req, res) => {
        const { user } = req.headers;
        const { id } = req.params;

        const message = await messages.findOne({_id: ObjectId(id)});

        if (!message) {
            res.sendStatus(404);
            return;
        }

        if (message.from !== user) {
            res.sendStatus(401);
            return;
        }

        await messages.deleteOne({_id: ObjectId(id)});
        res.sendStatus(200);

    });

    app.put("/messages/:id", async (req, res) => {
        const { id } = req.params;
        const { user } = req.headers;

        const message = await messages.findOne({_id: ObjectId(id)});

        if (!message) {
            res.sendStatus(404);
            return;
        }

        if (message.from !== user) {
            res.sendStatus(401);
            return;
        }

        const { error } = validateMessage(req.body);

        if(error) {
            const errors = error.details.map((detail) => detail.message);
            res.status(422).send(errors);
            return;
        }

        await messages.updateOne({_id: ObjectId(id)}, {$set: req.body});
        res.sendStatus(200);
    });

    const updateParticipants = async () => {
        const users = await participants.find().toArray();
        const now = Date.now();

        users.forEach(async user => {
            if ((now - user.lastStatus) > 10000) {

                await messages.insertOne({
                    from: user.name,
                    to: "Todos",
                    text: "sai na sala...",
                    type: "status",
                    time: dayjs(now).format("HH:MM:ss")
                });

                await participants.deleteOne({_id: user._id});
            }
        });
    };

    setInterval(updateParticipants, 15000);
};