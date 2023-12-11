const { Schema, model } = require("mongoose");

const billSchema = new Schema(
  {
    billNumber: {
      type: Number,
      required: true,
    },
    plan: {
      type: String,
    },
    name: {
      type: String,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    price: {
      type: Number,
      required: true,
    },
    priceText: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    additionalNotes: {
      type: String,
      required: false,
    },
    partial: {
      type: Boolean,
      default: false,
    },
    userInfo: {
      createdBy: {
        type: Schema.Types.ObjectId,
        required: true,
      },
    },
  },
  { timestamps: true }
);
module.exports = model("Bill", billSchema);
