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
            time: Date.now()
        });

        res.sendStatus(201);
    });

    app.get("/participants", async (_req, res) => {

        const users = await participants
            .find()
            .toArray();

        res.status(200).send(users);
    });
}