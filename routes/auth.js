// Authentication file

const router = require("express").Router();
const User = require("../model/User");
const auth = require("./verifyToken");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { registerValidation, loginValidation } = require("../validation");

router.post("/register", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("El correo ya existe.");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });

  try {
    await user.save();
    res.send({ user: user._id });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return res.send({
      success: false,
      meesage: "Email o contraseña incorrecta.",
    });

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.send({
      success: false,
      meesage: "Email o contraseña incorrecta.",
    });

  const token = jwt.sign({ _id: user._id }, process.env.TOKEN);
  res.header("auth-token", token).send({
    message: `Bienvenido ${user.name}`,
    id: user._id,
    name: user.name,
    token,
  });
});

router.get("/getUserInfo", auth, (req, res) => {
  User.find({ _id: req.user._id })
    .then((i) => res.send({ name: i[0].name }))
    .catch((err) => res.send({ name: "(No se ha logueado)" }));
});

module.exports = router;
