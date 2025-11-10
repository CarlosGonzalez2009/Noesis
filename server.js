const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');

// Importar modelos
const User = require('./models/users.js');
const Curso = require('./models/cursos.js');

const app = express();
const porta = 3000;

// Conexão com MongoDB Atlas
mongoose.connect('mongodb+srv://Murilok7:Ling153423@clusterdopai.uljl3es.mongodb.net/sistemaLogin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado ao MongoDB Atlas'))
.catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // layout padrão

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true
}));

// Middleware para deixar o usuário disponível nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// Middleware de proteção de rotas
function protegerRota(req, res, next) {
  if (req.session.usuario) {
    next();
  } else {
    res.redirect('/login');
  }
}

// ---------- ROTAS PÚBLICAS ----------
app.get('/', (req, res) => res.redirect('/index'));

app.get('/login', (req, res) => {
  res.render('login', { layout: false, titulo: 'Login', erro: null });
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'registro.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'index.html'));
});

app.get('/erro', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'erro.html'));
});

// ---------- REGISTRO ----------
app.post('/registrar', async (req, res) => {
  try {
    const usuarioExistente = await User.findOne({ usuario: req.body.usuario });
    if (usuarioExistente) {
      return res.send('Usuário já existe');
    }

    const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);
    const novoUsuario = new User({
      usuario: req.body.usuario,
      senha: senhaCriptografada
    });

    await novoUsuario.save();
    res.redirect('/login');
  } catch (erro) {
    console.error('Erro ao registrar usuário:', erro);
    res.send('Erro ao registrar usuário');
  }
});

// ---------- LOGIN ----------
app.post('/logar', async (req, res) => {
  try {
    const usuario = await User.findOne({ usuario: req.body.usuario });

    if (!usuario) {
      return res.render('login', { layout: false, titulo: 'Login', erro: 'Usuário ou senha incorretos.' });
    }

    const senhaValida = await bcrypt.compare(req.body.senha, usuario.senha);
    if (!senhaValida) {
      return res.render('login', { layout: false, titulo: 'Login', erro: 'Usuário ou senha incorretos.' });
    }

    req.session.usuario = usuario;
    res.redirect('/home');
  } catch (erro) {
    console.error('Erro ao logar:', erro);
    res.send('Erro ao realizar login');
  }
});

// ---------- LOGOUT ----------
app.get('/sair', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Erro ao sair');
    }
    res.redirect('/index');
  });
});

// ---------- ROTAS PROTEGIDAS ----------
app.get('/home', protegerRota, (req, res) => {
  res.render('home', { usuario: req.session.usuario, titulo: 'Início' });
});

app.get('/curso2', protegerRota, async (req, res) => {
  const cursos = await Curso.find(); // mostra todos os cursos disponíveis
  res.render('curso2', { usuario: req.session.usuario, cursos, titulo: 'Cursos' });
});

app.get('/explore2', protegerRota, (req, res) => {
  res.render('explore2', { usuario: req.session.usuario, titulo: 'Explorar' });
});

app.get('/opt2', protegerRota, (req, res) => {
  res.render('opt2', { usuario: req.session.usuario, titulo: 'Oportunidades' });
});

app.get('/help2', protegerRota, (req, res) => {
  res.render('help2', { usuario: req.session.usuario, titulo: 'Ajuda' });
});

// ---------- EXEMPLO: ADICIONAR CURSO A UM USUÁRIO ----------
app.post('/adicionar-curso', protegerRota, async (req, res) => {
  try {
    const { nome, progresso, duracao } = req.body;
    const usuario = await User.findOne({ usuario: req.session.usuario.usuario });

    usuario.cursosEstudados.push({ nome, progresso, duracao });
    await usuario.save();

    res.redirect('/curso2');
  } catch (erro) {
    console.error('Erro ao adicionar curso:', erro);
    res.send('Erro ao adicionar curso');
  }
});

app.listen(porta, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${porta}/`);
});
