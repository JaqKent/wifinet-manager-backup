const { Schema, model } = require("mongoose");

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      min: 3,
      max: 50,
    },
    address: {
      type: String,
      required: true,
      min: 3,
      max: 50,
    },
    dni: {
      type: String,
      required: true,
      min: 8,
      max: 9,
    },
    inscriptionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    unSubscribingDate: {
      type: Date,
      required: false,
    },
    unSubscribingReason: {
      type: String,
      required: false,
    },
    plan: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    priceText: {
      type: String,
      required: true,
    },
    priceInstall: {
      type: Number,
      required: false,
    },
    phone: {
      type: Number,
      required: false,
    },
    phoneAlt: {
      type: Number,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    connectedTo: {
      type: String,
      required: false,
    },
    additionalNotes: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.ObjectId,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Client", clientSchema);
