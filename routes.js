export const routes = (app, db) => {
    app.get("/", (_req, res) => {
        res.status(200).send("OK");
    });
}