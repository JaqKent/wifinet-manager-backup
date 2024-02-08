const { Schema, model } = require("mongoose");

const playerBillCountSchema = new Schema(
    {
        PlayerBillCount: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);
module.exports = model("PlayerBillCount", playerBillCountSchema);