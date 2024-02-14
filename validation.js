const Joi = require("@hapi/joi");

// Validacion de registro

const registerValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(6).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

// Validation de login

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });

  return schema.validate(data);
};

// Validación de cliente

const clientValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    address: Joi.string().required().trim(),
    dni: Joi.string().required().trim(),
    inscriptionDate: Joi.date().optional().empty(""),
    unSubscribingDate: Joi.date().optional().empty(""),
    unSubscribingReason: Joi.string().trim().optional().empty(""),
    price: Joi.number().required(),
    priceText: Joi.string().required().trim(),
    priceInstall: Joi.number().optional().empty(""),
    phone: Joi.number().required(),
    phoneAlt: Joi.number().optional().empty(""),
    email: Joi.string().email().optional().empty(""),
    ipAddress: Joi.string().ip().optional().empty(""),
    isDown: Joi.boolean().required(),
    isSaving: Joi.boolean(),
    createdBy: Joi.string().trim(),
  });
  return schema.validate(data);
};

const billValidation = (data) => {
  const schema = Joi.object({
    billNumber: Joi.number().required(),
    createdAt: Joi.date().required(),
    dueDate: Joi.date().required(),
    clientInfo: {
      id: Joi.string().trim(),
      name: Joi.string().trim(),
      address: Joi.string().trim(),
      dni: Joi.string().required().trim(),
    },
    price: Joi.number().required(),
    priceText: Joi.string().trim().required(),
    month: Joi.string().trim().required(),
    additionalNotes: Joi.string(),
  });

  return schema.validate(data);
};

const playersValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().trim(),
    address: Joi.string().optional().trim(),
    dni: Joi.string().optional().trim(),
    birthday: Joi.date().optional().empty(""),
    category: Joi.string().optional().trim().empty(""),
    inscriptionDate: Joi.date().optional().empty(""),
    unSubscribingDate: Joi.date().optional().empty(""),
    unSubscribingReason: Joi.string().trim().optional().empty(""),
    price: Joi.number().optional(),
    priceText: Joi.string().optional().trim(),
    priceInstall: Joi.number().optional().empty(""),
    phone: Joi.number().optional(),
    phoneAlt: Joi.number().optional().empty(""),
    obraSocial: Joi.string().optional().trim().empty(""),
    nickName: Joi.string().optional().trim().empty(""),
    bloodType: Joi.string().optional().trim().empty(""),
    tshirtSize: Joi.string().optional().trim().empty(""),
    shortSize: Joi.string().optional().trim().empty(""),
    email: Joi.string().email().optional().empty(""),
    isDown: Joi.boolean().optional(),
    isSaving: Joi.boolean(),
    createdBy: Joi.string().trim(),
  });
  return schema.validate(data);
};

const playerBillsValidation = (data) => {
  const schema = Joi.object({
    billNumber: Joi.number().required(),
    createdAt: Joi.date().required(),
    dueDate: Joi.date().required(),
    playerInfo: {
      id: Joi.string().trim(),
      name: Joi.string().trim(),
      address: Joi.string().trim(),
      dni: Joi.string().required().trim(),
    },
    price: Joi.number().required(),
    priceText: Joi.string().trim().required(),
    month: Joi.string().trim().required(),
    additionalNotes: Joi.string(),
  });

  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.clientValidation = clientValidation;
module.exports.billValidation = billValidation;
module.exports.playersValidation = playersValidation;
module.exports.playerBillsValidation = playerBillsValidation;
