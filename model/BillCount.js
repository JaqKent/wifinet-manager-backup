const { Schema, model } = require("mongoose");

const billCountSchema = new Schema(
  {
    billCount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
module.exports = model("BillCount", billCountSchema);
