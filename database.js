const mongoose = require("mongoose");

const uri = "mongodb+srv://Murilok7:Ling153423@clusterdopai.uljl3es.mongodb.net/?retryWrites=true&w=majority&appName=Clusterdopai";

mongoose.connect(uri)
  .then(() => console.log("✅ Conectado ao MongoDB Atlas"))
  .catch(err => console.error("❌ Erro ao conectar:", err));

module.exports = mongoose;
