const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const router = express.Router();

router.post('/registro', async (req,res)=>{
  const { nome, email, senha, perfil } = req.body;
  try{
    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO usuarios (nome,email,senha,perfil) VALUES ($1,$2,$3,$4) RETURNING id,nome,email,perfil',
      [nome, email, senhaHash, perfil || 'cliente']
    );
    res.status(201).json(result.rows[0]);
  }catch(e){
    res.status(400).json({erro: 'Email já existe'});
  }
});

router.post('/login', async (req,res)=>{
  const { email, senha } = req.body;
  const result = await pool.query('SELECT * FROM usuarios WHERE email=$1',[email]);
  if(result.rows.length===0) return res.status(401).json({erro:'Usuário não encontrado'});

  const usuario = result.rows[0];
  const ok = await bcrypt.compare(senha, usuario.senha);
  if(!ok) return res.status(401).json({erro:'Senha incorreta'});

  const token = jwt.sign({id: usuario.id, perfil: usuario.perfil}, process.env.JWT_SECRET, {expiresIn:'2h'});
  res.json({token, perfil: usuario.perfil, nome: usuario.nome});
});

module.exports = router;
