const pool = require("../db"); // o como tengas tu conexión

// GUARDAR LEVANTAMIENTO
exports.createLevantamiento = async (req, res) => {
  const { clienteId, clienteNombre, direccion, personal, fecha } = req.body;

  const q = `
    INSERT INTO levantamientos
    (cliente_id, cliente_nombre, direccion, personal, fecha)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *;
  `;

  const values = [clienteId, clienteNombre, direccion, personal, fecha];
  const result = await pool.query(q, values);

  res.json(result.rows[0]);
};

// LISTAR LEVANTAMIENTOS
exports.getLevantamientos = async (req, res) => {
  const q = `SELECT * FROM levantamientos ORDER BY fecha DESC`;
  const result = await pool.query(q);
  res.json(result.rows);
};
