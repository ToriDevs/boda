const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const invitadosRouter = require('./invitados');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/api/invitados', invitadosRouter);
app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

