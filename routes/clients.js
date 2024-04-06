const router = require("express").Router();
const auth = require("./verifyToken");
const Client = require("../model/Client");
const { clientValidation } = require("../validation");

router.get("/get", auth, async (req, res) => {
  const allClients = await Client.find();
  res.json(allClients);
});

router.get("/get/:id", auth, (req, res) => {
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
