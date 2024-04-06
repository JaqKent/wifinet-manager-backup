const router = require("express").Router();
const auth = require("./verifyToken");
const Player = require("../model/Players");
const { playersValidation } = require("../validation");

router.get("/get", async (req, res) => {
    const allPlayers = await Player.find();
    res.json(allPlayers);
});

router.get("/get/:id", (req, res) => {
    Player.find({ _id: req.params.id })
        .then((i) => res.send({ success: true, data: i }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

router.post(`/search`, auth, (req, res) => {
    let query = {};
    let { name, category } = req.body;

    if (name) {
        query.name = { $regex: name, $options: "i" };
    }
    if (category) {
        query.category = { $regex: category, $options: "i" };
    }

    Player.find(query)
        .sort({ createdAt: -1 })
        .then((i) => res.send({ success: true, data: i }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

router.post("/create", auth, async (req, res) => {
    const { error } = playersValidation(req.body);
    if (error) {
        return res.send({ success: false, message: error.details[0].message });
    }

    new Player({ createdBy: req.user._id, ...req.body })
        .save()
        .then((i) => res.send({ success: true, message: "Jugador guardado." }))
        .catch((err) => {
            res.send({
                success: false,
                message: "Se generó un error, reintente.",
                error: err,
            });
        });
});

// Editar el Jugador

router.put("/edit/:id", auth, (req, res) => {
    Player.findOneAndUpdate({ _id: req.params.id }, req.body)
        .then((i) => res.send({ success: true, message: "Jugador actualizado." }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

router.delete("/delete/:id", auth, (req, res) => {
    Player.findOneAndDelete({ _id: req.params.id })
        .then((i) => res.send({ success: true, message: "Jugador eliminado." }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

module.exports = router;
