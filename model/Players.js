const { Schema, model } = require("mongoose");

const playersSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            min: 3,
            max: 50,
        },
        address: {
            type: String,
            required: false,
            min: 3,
            max: 50,
        },
        dni: {
            type: String,
            required: false,
            min: 8,
            max: 9,
        },
        birthday: {
            type: Date,
            required: false,
        },
        category: {
            type: String,
            required: false,
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
        price: {
            type: Number,
            required: false,
        },
        priceText: {
            type: String,
            required: false,
        },
        phone: {
            type: Number,
            required: false,
            default: ""
        },
        phoneAlt: {
            type: Number,
            required: false,
        },
        email: {
            type: String,
            required: false,
        },
        obraSocial: {
            type: String,
            required: false,
        },
        nickName: {
            type: String,
            required: false,
        },
        bloodType: {
            type: String,
            required: false,
        },
        tshirtSize: {
            type: String,
            required: false,
        },
        shortSize: {
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
                billId: { type: Schema.Types.ObjectId, ref: 'PlayersBill' },
                partialPayments: [
                    {
                        amount: Number,
                        date: Date,
                        notes: String,
                        billId: { type: Schema.Types.ObjectId, ref: 'PlayersBill' }
                    }
                ]
            }
        ],
    },
    { timestamps: true }
);

module.exports = model("Players", playersSchema);