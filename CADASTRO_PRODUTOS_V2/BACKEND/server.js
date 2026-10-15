 require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const { autenticar, autorizarAdmin } = require('./middlewares/auth');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Testar a conexão
pool.query('SELECT NOW()')
  .then(() => console.log('Conectado com sucesso ao PostgreSQL (Supabase)'))
  .catch(err => console.error('Erro de conexão:', err.stack));

// ROTAS DE AUTENTICAÇÃO
app.use('/auth', authRoutes);

// -------------------------------------------------------------
// ROTAS DE PRODUTOS
// -------------------------------------------------------------

// PÚBLICA - qualquer um vê (batata continua aparecendo)
app.get('/produtos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY id ASC');
        res.json(result.rows);
    } catch (erro) {
        res.status(500).json({ erro: "Erro ao buscar produtos" });
    }
});

// PROTEGIDAS - só admin com token Bearer
app.post('/produtos', autenticar, autorizarAdmin, async (req, res) => {
    const { nome, preco, quantidade } = req.body;
    const p = parseFloat(preco);
    const q = parseInt(quantidade, 10);
    if (!nome || isNaN(p) || isNaN(q) || p <= 0 || q <= 0) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }
    try {
        const result = await pool.query('INSERT INTO produtos(nome, preco, quantidade) VALUES($1,$2,$3) RETURNING *', [nome, p, q]);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao salvar' });
    }
});

app.put('/produtos/:id', autenticar, autorizarAdmin, async (req,res)=>{
    const { id } = req.params;
    const { nome, preco, quantidade } = req.body;
    try{
        const result = await pool.query('UPDATE produtos SET nome=$1, preco=$2, quantidade=$3 WHERE id=$4 RETURNING *', [nome, preco, quantidade, id]);
        res.json(result.rows[0]);
    }catch(e){ res.status(500).json({erro:'Erro ao atualizar'}); }
});

app.delete('/produtos/:id', autenticar, autorizarAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
        if (result.rowCount === 0) return res.status(404).json({ erro: 'Produto não encontrado' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ erro: "Erro ao deletar" });
    }
});

app.delete('/produtos', autenticar, autorizarAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM produtos');
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ erro: "Erro ao limpar" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT} com autenticação!`);
});
