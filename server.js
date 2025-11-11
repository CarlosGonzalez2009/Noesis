const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const mongoose = require('mongoose');
const expressLayouts = require('express-ejs-layouts');

const User = require('./models/user1');
const Course = require('./models/curso1');

const app = express();
const porta = 3000;

// ===== Conexão com MongoDB Atlas =====
const MONGO_URI = 'mongodb+srv://Murilok7:Ling153423@clusterdopai.uljl3es.mongodb.net/sistemaLogin?retryWrites=true&w=majority';

console.log('🟡 Tentando conectar ao MongoDB Atlas...');

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 15000, // aumenta tempo de espera da conexão
})
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:');
    console.error(err.message);
    process.exit(1); // encerra o servidor se não conectar
  });



// ===== Configuração do EJS =====
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout'); // arquivo layout.ejs padrão

// ===== Middleware =====
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'segredo-super-seguro',
  resave: false,
  saveUninitialized: true
}));

// Deixa o usuário disponível nas views
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

// ===== Função para proteger rotas =====
function protegerRota(req, res, next) {
  if (req.session.usuario) next();
  else res.redirect('/login');
}

// ===== ROTAS PÚBLICAS =====
app.get('/', (req, res) => res.redirect('/index'));

app.get('/index', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'index.html')));
app.get('/explore', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'explore.html')));
app.get('/curso', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'curso.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'registro.html')));
app.get('/help', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'help-center.html')));
app.get('/opt', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'oportunidades.html')));
app.get('/erro', (req, res) => res.sendFile(path.join(__dirname, 'HTML', 'erro.html')));

app.get('/login', (req, res) => {
  res.render('login', { layout: false, titulo: 'Login', erro: null });
});

// ===== REGISTRO =====
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

// ===== LOGIN =====
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

// ===== LOGOUT =====
app.get('/sair', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send('Erro ao sair');
    res.redirect('/index');
  });
});

// ===== ROTAS PROTEGIDAS =====
app.get('/home', protegerRota, (req, res) => {
  res.render('home', { 
    layout: false, 
    titulo: 'Início', 
    usuario: req.session.usuario, 
    tema: req.session.tema || 'claro'
  });
});


app.get('/curso2', protegerRota, async (req, res) => {
  const cursos = await Course.find();
  res.render('curso2', { usuario: req.session.usuario, cursos, titulo: 'Cursos' });
});

app.get('/explore2', protegerRota, (req, res) => res.render('explore2', { usuario: req.session.usuario, titulo: 'Explorar' }));
app.get('/opt2', protegerRota, (req, res) => res.render('opt2', { usuario: req.session.usuario, titulo: 'Oportunidades' }));
app.get('/help2', protegerRota, (req, res) => res.render('help2', { usuario: req.session.usuario, titulo: 'Ajuda' }));

// ===== ADICIONAR CURSO AO USUÁRIO =====
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

// ===== INICIAR SERVIDOR =====
app.listen(porta, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${porta}/`);
});
