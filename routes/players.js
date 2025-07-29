const router = require("express").Router();
const auth = require("./verifyToken");
const Player = require("../model/Players");
const { playersValidation } = require("../validation");

router.get("/get", auth, async (req, res) => {
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

router.put("/payment/:id", auth, async (req, res) => {
    try {
        const { month, amount, paid, paymentDate, notes, partial, partialPayment, billId } = req.body;

        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).send({ success: false, message: "Jugador no encontrado" });

        if (!player.paymentHistory) player.paymentHistory = [];

        const idx = player.paymentHistory.findIndex(p => p.month === month);

        if (idx > -1) {
            if (partial && partialPayment) {
                if (!player.paymentHistory[idx].partialPayments) player.paymentHistory[idx].partialPayments = [];

                player.paymentHistory[idx].partialPayments.push({ ...partialPayment, billId });

                const totalPagado = player.paymentHistory[idx].partialPayments.reduce((sum, p) => sum + Number(p.amount), 0);
                player.paymentHistory[idx].paid = totalPagado >= amount;
                player.paymentHistory[idx].partial = !player.paymentHistory[idx].paid;
                player.paymentHistory[idx].amount = amount;
                player.paymentHistory[idx].notes = notes;
                player.paymentHistory[idx].paymentDate = paymentDate;
                player.paymentHistory[idx].billId = billId;
            } else {
                player.paymentHistory[idx] = {
                    ...player.paymentHistory[idx],
                    month,
                    amount,
                    paid,
                    paymentDate,
                    notes,
                    partial,
                    billId,
                    partialPayments: []
                };
            }
        } else {
            player.paymentHistory.push({
                month,
                amount,
                paid,
                paymentDate,
                notes,
                partial,
                billId,
                partialPayments: partial && partialPayment ? [{ ...partialPayment, billId }] : []
            });
        }

        await player.save();
        res.send({ success: true, data: player.paymentHistory });
    } catch (err) {
        console.error('Error en /payment/:id:', err);
        res.status(500).send({ success: false, message: err.message });
    }
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
