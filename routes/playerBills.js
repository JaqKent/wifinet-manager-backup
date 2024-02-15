const router = require("express").Router();
const auth = require("./verifyToken");
const PlayersBill = require("../model/PlayersBill");
const Player = require("../model/Players");
const PlayerBillCount = require("../model/PlayerBillCount");
const nodemailer = require('nodemailer')

const moment = require("moment");

router.post("/send", auth, (req, res) => {

    // Plantilla HTML del mail que se va a enviar

    const HTMLTEMPLATE = `
            <h1>¡Hola, ${req.body.client}!</h1> 
            <hr> 
            <p>Tu comprobante ya está disponible para que la descargues</p>`

        , TRANSPORTCONFIG = {
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: { user: process.env.SENDERMAILACCOUNT, pass: process.env.SENDERMAILPASSWOR },
            tls: { rejectUnauthorized: false, ciphers: "SSLv3", },
        }

        , SENDMAILCONFIG = {
            from: `<${process.env.SENDERMAILACCOUNT}>`, to: req.body.email, subject: "Tu comprobante", html: HTMLTEMPLATE,
            attachments: { filename: `comprobante-${req.body.date}-${req.body.client}.pdf`, path: req.body.file },
        }

    nodemailer.createTransport(TRANSPORTCONFIG).sendMail(SENDMAILCONFIG)
        .then((info) => { res.send({ success: true, message: "¡Mail enviado!" }); })
        .catch((err) => { res.send({ success: false, message: `Ocurrió un error enviando el mail: ${err.message}` }) });

});

router.get("/get", auth, (req, res) => {
    PlayersBill.find()
        .sort({ createdAt: -1 })
        .then((i) => res.send({ success: true, data: i }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

router.get(`/get/:id`, auth, (req, res) => {
    PlayersBill.find({ _id: req.params.id })
        .then((i) => res.send({ success: true, data: i }))
        .catch((err) => res.send({ success: false, message: err.message }));
});

router.post("/create", auth, (req, res) => {

    let billNumber = 0;

    PlayerBillCount.find()
        .then((i) => {
            billNumber = i[0].playerBillCount;

            new PlayersBill({
                billNumber: playerBillNumber,
                userInfo: { createdBy: req.user._id },
                ...req.body,
            })
                .save()
                .then((bill) => {
                    PlayerBillCount.findOneAndUpdate({}, { $inc: { playerBillCount: 1 } })
                        .then(() => {
                            res.send({
                                success: true,
                                message: "Se ha guardado la boleta.",
                                id: bill._id,
                            });
                        })
                        .catch((err) =>
                            res.send({
                                success: false,
                                message: `Error al actualizar el contador de facturas: ${err.message}`,
                            })
                        );
                })
                .catch((err) =>
                    res.send({
                        success: false,
                        message: `Ha ocurrido un error al guardar la factura: ${err.message}`,
                    })
                );
        })
        .catch((err) =>
            res.send({
                success: false,
                message: `Ha ocurrido un error al obtener el contador de facturas: ${err.message}`,
            })
        );
});


router.post(`/search`, auth, (req, res) => {
    let query = {};
    let { dateFrom, dateTo } = req.body;

    if (dateFrom && !dateTo) {
        query.createdAt = { $gte: moment(dateFrom).startOf("day").format() };
    }
    if (dateTo && !dateFrom) {
        query.createdAt = { $lte: moment(dateTo).endOf("day").format() };
    }

    if (dateFrom && dateTo) {
        query.createdAt = {
            $gte: moment(dateFrom).startOf("day").format(),
            $lte: moment(dateTo).endOf("day").format(),
        };
    }

    PlayersBill.find(query)
        .sort({ createdAt: -1 })
        .then((i) => res.send({ success: true, data: i }))
        .catch((err) => res.send({ success: false, message: err.message }));
});


router.post(`/startCount`, (req, res) => {
    new PlayerBillCount({ playerBillCount: 0 }).save().then((i) => res.send(i));
});

router.delete(`/deleteBill/:id`, (req, res) => {
    PlayersBill.findOneAndDelete({ _id: req.params.id })
        .then(i => res.send({ success: true, message: "Boleta eliminada" }))
        .catch(err => (res.send({ success: false, message: `Ocurrió un error: ${err.message}` })))
})

module.exports = router;
