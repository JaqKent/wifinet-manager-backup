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
      required: false,
    },
    accountStatus: {
      month: { type: String },
      paid: { type: Boolean, default: false },
      price: { type: Number },
    },
    paymentHistory: [
      {
        month: { type: String },
        paid: { type: Boolean },
        amount: Number,
        paymentDate: Date,
        notes: String,
        partial: Boolean,
        billId: { type: Schema.Types.ObjectId, ref: 'Bill' },

        partialPayments: [
          {
            amount: Number,
            date: Date,
            notes: String,
            billId: { type: Schema.Types.ObjectId, ref: 'Bill' }
          }
        ]
      }
    ],
    priceHistory: [
      {
        month: String,
        price: Number
      }
    ],
  },
  { timestamps: true }
);

module.exports = model("Client", clientSchema);
