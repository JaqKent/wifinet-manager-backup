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

router.put("/payment/:id", auth, async (req, res) => {
  try {
    const { month, amount, paid, paymentDate, notes, partial, partialPayment, billId } = req.body;

    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).send({ success: false, message: "Cliente no encontrado" });

    if (!client.paymentHistory) client.paymentHistory = [];

    const idx = client.paymentHistory.findIndex(p => p.month === month);

    if (idx > -1) {
      if (partial && partialPayment) {
        if (!client.paymentHistory[idx].partialPayments) client.paymentHistory[idx].partialPayments = [];

        client.paymentHistory[idx].partialPayments.push({ ...partialPayment, billId });

        const totalPagado = client.paymentHistory[idx].partialPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        client.paymentHistory[idx].paid = totalPagado >= amount;
        client.paymentHistory[idx].partial = !client.paymentHistory[idx].paid;
        client.paymentHistory[idx].amount = amount;
        client.paymentHistory[idx].notes = notes;
        client.paymentHistory[idx].paymentDate = paymentDate;
        client.paymentHistory[idx].billId = billId;
      } else {
        client.paymentHistory[idx] = {
          ...client.paymentHistory[idx],
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
      client.paymentHistory.push({
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
