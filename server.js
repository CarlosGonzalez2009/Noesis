const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const porta = 3000;

const expressLayouts = require('express-ejs-layouts');

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(expressLayouts); // deve vir DEPOIS do view engine
app.set('layout', 'layout'); // procura o arquivo views/layout.ejs


// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'segredo-super-seguro',
    resave: false,
    saveUninitialized: true
}));

const urlMongo = 'mongodb+srv://Murilok7:Ling153423@clusterdopai.uljl3es.mongodb.net/?retryWrites=true&w=majority&appName=Clusterdopai';
const nomeBanco = 'sistemaLogin';

// Middleware para proteger rotas
function protegerRota(req, res, proximo) {
    if (req.session.usuario) {
        proximo();
    } else {
        res.redirect('/login');
    }
}

// Rotas públicas
app.get('/', (req, res) => {
  res.redirect('/index');
});

app.get('/explore', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'explore.html'));
});

app.get('/curso', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'curso.html'));
});

app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'help-center.html'));
});

app.get('/opt', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'oportunidades.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'registro.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'login.html'));
});

app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'index.html'));
});

app.get('/erro', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'erro.html'));
});

// Rotas protegidas (somente com login)
app.get('/curso2', protegerRota, (req, res) => {
  res.render('curso2', { 
    usuario: req.session.usuario,
    titulo: 'Cursos' // 👈 Adiciona aqui
  });
});

app.get('/explore2', protegerRota, (req, res) => {
  res.render('explore2', { 
    usuario: req.session.usuario,
    titulo: 'Explorar'
  });
});

app.get('/opt2', protegerRota, (req, res) => {
  res.render('opt2', { 
    usuario: req.session.usuario,
    titulo: 'Oportunidades'
  });
});

app.get('/help2', protegerRota, (req, res) => {
  res.render('help2', { 
    usuario: req.session.usuario,
    titulo: 'Ajuda'
  });
});

app.get('/home', protegerRota, (req, res) => {
  res.render('home', { 
    usuario: req.session.usuario,
    titulo: 'Início'
  });
});
// Registro de usuário
app.post('/registrar', async (req, res) => {
    const cliente = new MongoClient(urlMongo);

    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const usuarios = banco.collection('usuarios');
        const usuarioExistente = await usuarios.findOne({ usuario: req.body.usuario });

        if (usuarioExistente) {
            res.send('Usuário já existe');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);
            await usuarios.insertOne({ usuario: req.body.usuario, senha: senhaCriptografada });
            res.redirect('/login');
        }
    } catch (erro) {
        res.send('Erro ao registrar usuário');
        console.error(erro);
    } finally {
        await cliente.close();
    }
});

// Login de usuário
app.post('/logar', async (req, res) => {
    const cliente = new MongoClient(urlMongo);

    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const usuarios = banco.collection('usuarios');

        const usuario = await usuarios.findOne({ usuario: req.body.usuario });

        if (usuario) {
            const senhaValida = await bcrypt.compare(req.body.senha, usuario.senha);
            
            if (senhaValida) {
                req.session.usuario = usuario.usuario; // Salva o nome do usuário na sessão
                res.redirect('/home');
            } else {
                res.redirect('/erro');
            }   
        } else {
            res.redirect('/erro');
        }
    } catch (erro) {
        res.send('Erro ao realizar login');
        console.error(erro);
    } finally {
        await cliente.close();
    }
});

// Logout
app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Erro ao sair');
        }
        res.redirect('/index');
    });
});

app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}/`);
});
