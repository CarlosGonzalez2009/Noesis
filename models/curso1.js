const mongoose = require('mongoose');

const CursoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  duracaoHoras: { type: Number },
  progresso: { type: Number, default: 0 }, // porcentagem 0–100
  dataInicio: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Curso', CursoSchema);
