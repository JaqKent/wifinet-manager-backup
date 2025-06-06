const router = require("express").Router();
const auth = require("./verifyToken");
const Client = require("../model/Client");
const { clientValidation } = require("../validation");

router.get("/get", auth, async (req, res) => {
  const allClients = await Client.find();
  res.json(allClients);
});

router.get("/get/:id", (req, res) => {
  Client.find({ _id: req.params.id })
    .then((i) => res.send({ success: true, data: i }))
    .catch((err) => res.send({ success: false, message: err.message }));
});

router.post(`/search`, auth, (req, res) => {
  let query = {};
  let { name, address } = req.body;

  if (name) {
    query.name = { $regex: name, $options: "i" };
  }
  if (address) {
    query.address = { $regex: address, $options: "i" };
  }

  Client.find(query)
    .sort({ createdAt: -1 })
    .then((i) => res.send({ success: true, data: i }))
    .catch((err) => res.send({ success: false, message: err.message }));
});

// ...en tu archivo de rutas de clientes...
// ...en tu archivo de rutas de clientes...
router.put("/payment/:id", auth, async (req, res) => {
  try {
    const { month, amount, paid, paymentDate, notes, partial } = req.body; // <-- AGREGA partial AQUÍ

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).send({ success: false, message: "Cliente no encontrado" });

    if (!client.paymentHistory) client.paymentHistory = [];

    const idx = client.paymentHistory.findIndex(p => p.month === month);

    if (idx > -1) {
      client.paymentHistory[idx] = {
        ...client.paymentHistory[idx],
        month,
        amount,
        paid,
        paymentDate,
        notes,
        partial
      };
    } else {
      client.paymentHistory.push({ month, amount, paid, paymentDate, notes, partial });
    }

    await client.save();
    res.send({ success: true, data: client.paymentHistory });
  } catch (err) {
    console.error('Error en /payment/:id:', err);
    res.status(500).send({ success: false, message: err.message });
  }
});

router.post("/create", auth, async (req, res) => {
  const { error } = clientValidation(req.body);
  if (error) {
    return res.send({ success: false, message: error.details[0].message });
  }

  new Client({ createdBy: req.user._id, ...req.body })
    .save()
    .then((i) => res.send({ success: true, message: "Cliente guardado." }))
    .catch((err) => {
      res.send({
        success: false,
        message: "Se generó un error, reintente.",
        error: err,
      });
    });
});

// Editar el cliente

router.put("/edit/:id", auth, (req, res) => {
  Client.findOneAndUpdate({ _id: req.params.id }, req.body)
    .then((i) => res.send({ success: true, message: "Cliente actualizado." }))
    .catch((err) => res.send({ success: false, message: err.message }));
});

router.delete("/delete/:id", auth, (req, res) => {
  Client.findOneAndDelete({ _id: req.params.id })
    .then((i) => res.send({ success: true, message: "Cliente eliminado." }))
    .catch((err) => res.send({ success: false, message: err.message }));
});

module.exports = router;
