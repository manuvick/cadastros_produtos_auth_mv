const jwt = require('jsonwebtoken');

function autenticar(req, res, next){
  const header = req.headers['authorization'];
  const token = header && header.split(' ')[1];
  if(!token) return res.status(401).json({erro: 'Token não fornecido. Faça login!'});

  jwt.verify(token, process.env.JWT_SECRET, (err, user)=>{
    if(err) return res.status(403).json({erro: 'Token inválido ou expirado'});
    req.usuario = user;
    next();
  });
}

function autorizarAdmin(req, res, next){
  if(req.usuario.perfil!== 'admin'){
    return res.status(403).json({erro: 'Só admin pode apagar/criar produtos!'});
  }
  next();
}

module.exports = { autenticar, autorizarAdmin };
