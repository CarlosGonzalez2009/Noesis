const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  cursos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Curso' // referência à coleção Curso
  }]
});

module.exports = mongoose.model('User', UserSchema);
