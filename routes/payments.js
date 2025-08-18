const router = require("express").Router();
const auth = require("./verifyToken");
const Client = require("../model/Client");
const XLSX = require("xlsx");
const multer = require("multer");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });


router.post("/reset-payments", async (req, res) => {
    try {
        const result = await Client.updateMany({}, {
            $set: {
                paymentHistory: [],
                priceHistory: []
            }
        });

        res.send({
            success: true,
            message: `Historiales borrados. Clientes afectados: ${result.modifiedCount}`
        });
    } catch (error) {
        console.error("Error al resetear historiales:", error);
        res.status(500).send({ success: false, message: error.message });
    }
});

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
            const priceHistory = [];
            const keys = Object.keys(fila);
            let firstMonthIdx = keys.findIndex(k => meses.includes(k));
            if (firstMonthIdx === -1) firstMonthIdx = 0;

            // Detectar bloques de aumento
            let currentPrice = null;
            let currentStartMonth = null;

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];

                if (key.toUpperCase().includes("PRECIOS DESDE")) {
                    const match = key.match(/(\w+)\s+(\d{4})/);
                    if (match) {
                        const mesTexto = match[1].toUpperCase();
                        const año = match[2];
                        const mesesMap = {
                            "ENERO": "01", "FEBRERO": "02", "MARZO": "03", "ABRIL": "04",
                            "MAYO": "05", "JUNIO": "06", "JULIO": "07", "AGOSTO": "08",
                            "SEPTIEMBRE": "09", "OCTUBRE": "10", "NOVIEMBRE": "11", "DICIEMBRE": "12"
                        };
                        const mm = mesesMap[mesTexto];
                        if (mm) {
                            currentStartMonth = `${mm}/${año}`;
                            currentPrice = Number(fila[keys[i + 1]]);
                        }
                    }
                }

                if (currentPrice && meses.includes(key.toUpperCase())) {
                    const idx = i;
                    const fechaRaw = fila[keys[idx + 2]];
                    const fecha = new Date(fechaRaw);
                    if (!isNaN(fecha.getTime())) {
                        const mm = (fecha.getMonth() + 1).toString().padStart(2, "0");
                        const yyyy = fecha.getFullYear();
                        const monthString = `${mm}/${yyyy}`;

                        if (!priceHistory.some(p => p.month === monthString)) {
                            priceHistory.push({
                                month: monthString,
                                price: currentPrice,
                                appliedOn: fecha
                            });
                        }
                    }
                }
            }

            // Generar paymentHistory y priceHistory por cada mes pagado
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
                if (fechaPago && !isNaN(fechaPago.getTime())) {
                    const yyyy = fechaPago.getFullYear();
                    const mm = (fechaPago.getMonth() + 1).toString().padStart(2, "0");

                    if (yyyy === 2025 && parseInt(mm) >= 1 && parseInt(mm) <= 7) {
                        monthString = `${mm}/${yyyy}`;
                    } else {
                        console.warn(`❌ Fecha fuera de rango: ${fechaPago} (${fila["Nombre y Apellido"]})`);
                        continue;
                    }
                } else {
                    console.warn(`⚠️ Fecha inválida para ${mes} (${fila["Nombre y Apellido"]})`);
                    continue;
                }

                if (!paymentHistory.some(p => p.month === monthString)) {
                    paymentHistory.push({
                        month: monthString,
                        amount: Number(monto),
                        paid: paid,
                        paymentDate: fechaPago || null,
                        notes: typeof fila["Observaciones"] === "string" ? fila["Observaciones"] : ""
                    });
                }

                if (!priceHistory.some(p => p.month === monthString)) {
                    priceHistory.push({
                        month: monthString,
                        price: Number(monto),
                        appliedOn: fechaPago || null
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
                const todos = await Client.find({});
                const clienteMatch = todos.find(c =>
                    nombresCoinciden(fila["Nombre y Apellido"], c.name) &&
                    normalizar(c.address) === direccionExcel
                );

                if (clienteMatch) {
                    const updateResult = await Client.updateOne(
                        { _id: clienteMatch._id },
                        {
                            $set: {
                                paymentHistory: cleanPaymentHistory,
                                priceHistory: priceHistory
                            }
                        }
                    );

                    if (updateResult.modifiedCount > 0) {
                        actualizados++;
                    } else {
                        errores.push({ nombre: fila["Nombre y Apellido"], error: "No se modificó el cliente (quizás los datos eran iguales o vacíos)" });
                    }
                } else {
                    noEncontrados.push(fila["Nombre y Apellido"] + (direccionExcel ? ` (${fila["Dirección"] || fila["Direccion"] || fila["Domicilio"] || fila["address"]})` : ""));
                }
            } catch (err) {
                errores.push({ nombre: fila["Nombre y Apellido"], error: err.message });
            }
        }

        fs.unlinkSync(req.file.path);

        res.send({
            success: true,
            message: `Pagos importados. Clientes actualizados: ${actualizados}`,
            noEncontrados,
            errores
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;
