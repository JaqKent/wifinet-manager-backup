const router = require("express").Router();
const auth = require("./verifyToken");
const Player = require("../model/Player");
const XLSX = require("xlsx");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

router.post("/import-payments", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).send({ success: false, message: "No se subió ningún archivo." });

        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const meses = [
            "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
            "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
        ];

        let actualizados = 0;
        let noEncontrados = [];
        let errores = [];

        function normalizar(str) {
            return (str || "")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, " ")
                .replace(/[,\.]/g, "")
                .trim()
                .toLowerCase();
        }

        function nombresCoinciden(nombreExcel, nombreDB) {
            const partesExcel = normalizar(nombreExcel).split(" ").filter(Boolean);
            const nombreDBNorm = normalizar(nombreDB);
            return partesExcel.every(parte => nombreDBNorm.includes(parte));
        }

        for (const fila of data) {
            const nombreExcel = normalizar(fila["Nombre y Apellido"]);
            const direccionExcel = normalizar(fila["Dirección"] || fila["Direccion"] || fila["Domicilio"] || fila["address"] || "");
            if (!nombreExcel) continue;

            const paymentHistory = [];
            const keys = Object.keys(fila);
            let firstMonthIdx = keys.findIndex(k => meses.includes(k));
            if (firstMonthIdx === -1) firstMonthIdx = 0;

            for (let i = 0; i < meses.length; i++) {
                const mes = meses[i];
                const idx = keys.findIndex((k, j) => j >= firstMonthIdx && k === mes);
                if (idx === -1) continue;

                const monto = fila[keys[idx]];
                const estado = fila[keys[idx + 1]];
                const fechaPagoRaw = fila[keys[idx + 2]];

                if (!monto || monto === "") continue;

                const paid = estado && estado.toString().trim().toUpperCase() === "P";

                let fechaPago = null;
                if (fechaPagoRaw) {
                    if (typeof fechaPagoRaw === "number") {
                        fechaPago = new Date((fechaPagoRaw - (25567 + 2)) * 86400 * 1000);
                    } else {
                        const d = new Date(fechaPagoRaw);
                        fechaPago = isNaN(d.getTime()) ? null : d;
                    }
                }

                let monthString = null;
                if (fechaPago) {
                    const mm = (fechaPago.getMonth() + 1).toString().padStart(2, "0");
                    const yyyy = fechaPago.getFullYear();
                    monthString = `${mm}/${yyyy}`;
                } else {
                    const mm = (i + 1).toString().padStart(2, "0");
                    const yyyy = new Date().getFullYear();
                    monthString = `${mm}/${yyyy}`;
                }

                if (!paymentHistory.some(p => p.month === monthString)) {
                    paymentHistory.push({
                        month: monthString,
                        amount: Number(monto),
                        paid,
                        paymentDate: fechaPago || null,
                        notes: typeof fila["Observaciones"] === "string" ? fila["Observaciones"] : ""
                    });
                }
            }

            const cleanPaymentHistory = paymentHistory.filter(p =>
                typeof p.month === "string" &&
                typeof p.amount === "number" && !isNaN(p.amount) &&
                typeof p.paid === "boolean"
            );

            if (cleanPaymentHistory.length === 0) {
                noEncontrados.push(fila["Nombre y Apellido"] + " (sin pagos en Excel)");
                continue;
            }

            try {
                const todos = await Player.find({});
                let playerMatch = todos.find(p => nombresCoinciden(fila["Nombre y Apellido"], p.name));

                if (!playerMatch && direccionExcel) {
                    playerMatch = todos.find(p => normalizar(p.address) === direccionExcel);
                }

                if (!playerMatch && direccionExcel) {
                    playerMatch = todos.find(p =>
                        nombresCoinciden(fila["Nombre y Apellido"], p.name) &&
                        normalizar(p.address) === direccionExcel
                    );
                }

                if (playerMatch) {
                    console.log("Jugador:", playerMatch.name);
                    console.log("Nuevo paymentHistory:", cleanPaymentHistory);
                    console.log("Actual paymentHistory:", playerMatch.paymentHistory);
                    const updateResult = await Player.updateOne(
                        { _id: playerMatch._id },
                        { $set: { paymentHistory: cleanPaymentHistory } }
                    );
                    if (updateResult.modifiedCount > 0) {
                        actualizados++;
                    } else {
                        errores.push({ nombre: fila["Nombre y Apellido"], error: "No se modificó el jugador (quizás los datos eran iguales o vacíos)" });
                    }
                } else {
                    noEncontrados.push(fila["Nombre y Apellido"] + (direccionExcel ? ` (${direccionExcel})` : ""));
                }
            } catch (err) {
                errores.push({ nombre: fila["Nombre y Apellido"], error: err.message });
            }
        }

        fs.unlinkSync(req.file.path);

        res.send({
            success: true,
            message: `Pagos importados. Jugadores actualizados: ${actualizados}`,
            noEncontrados,
            errores
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;