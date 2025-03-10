const { Schema, model } = require("mongoose");

const playersBillSchema = new Schema(
    {
        playerBillNumber: {
            type: Number,
            required: false,
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
        playerId: {
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
            required: false,
        },
        year: {
            type: Number,
            required: false,
        },
        additionalNotes: {
            type: String,
            required: false,
        },
        partial: {
            type: Boolean,
            default: false,
        },
        annualPayment: {
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
module.exports = model("PlayersBill", playersBillSchema);
