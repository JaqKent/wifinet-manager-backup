const router = require("express").Router();
const auth = require("./verifyToken");
const Client = require("../model/Client");
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

            // Armar paymentHistory según el formato de la planilla
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

                // Estado de pago: siempre boolean
                const paid = estado && estado.toString().trim().toUpperCase() === "P" ? true : false;

                // Fecha de pago
                let fechaPago = null;
                if (fechaPagoRaw) {
                    if (typeof fechaPagoRaw === "number") {
                        fechaPago = new Date((fechaPagoRaw - (25567 + 2)) * 86400 * 1000);
                    } else {
                        const d = new Date(fechaPagoRaw);
                        fechaPago = isNaN(d.getTime()) ? null : d;
                    }
                }

                // Mes en formato MM/YYYY (si hay fecha de pago, usar esa)
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

                // Evitar duplicados
                if (!paymentHistory.some(p => p.month === monthString)) {
                    paymentHistory.push({
                        month: monthString,
                        amount: Number(monto),
                        paid: paid,
                        paymentDate: fechaPago || null,
                        notes: typeof fila["Observaciones"] === "string" ? fila["Observaciones"] : ""
                    });
                }
            }

            // Filtrar pagos inválidos (por si acaso)
            const cleanPaymentHistory = paymentHistory.filter(p =>
                typeof p.month === "string" &&
                typeof p.amount === "number" && !isNaN(p.amount) &&
                typeof p.paid === "boolean"
            );

            // Solo actualizar si hay pagos válidos
            if (cleanPaymentHistory.length === 0) {
                noEncontrados.push(fila["Nombre y Apellido"] + " (sin pagos en Excel)");
                continue;
            }

            try {
                // Buscar todos los clientes una sola vez por iteración
                const todos = await Client.find({});
                let clienteMatch = todos.find(c => nombresCoinciden(fila["Nombre y Apellido"], c.name));

                if (!clienteMatch && direccionExcel) {
                    clienteMatch = todos.find(c => normalizar(c.address) === direccionExcel);
                }

                if (!clienteMatch && direccionExcel) {
                    clienteMatch = todos.find(c =>
                        nombresCoinciden(fila["Nombre y Apellido"], c.name) &&
                        normalizar(c.address) === direccionExcel
                    );
                }

                if (clienteMatch) {
                    console.log("Cliente:", clienteMatch.name);
                    console.log("Nuevo paymentHistory:", cleanPaymentHistory);
                    console.log("Actual paymentHistory:", clienteMatch.paymentHistory);

                    // Fusión con el historial existente
                    const pagosExistentes = Array.isArray(clienteMatch.paymentHistory) ? clienteMatch.paymentHistory : [];

                    const nuevosPagos = cleanPaymentHistory.filter(pNuevo =>
                        !pagosExistentes.some(pExistente =>
                            pExistente.month === pNuevo.month && pExistente.amount === pNuevo.amount
                        )
                    );

                    const pagosActualizados = [...pagosExistentes, ...nuevosPagos];

                    const updateResult = await Client.updateOne(
                        { _id: clienteMatch._id },
                        { $set: { paymentHistory: pagosActualizados } }
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