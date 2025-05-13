const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 10000;
const DATA_FILE = path.join(__dirname, "messages.json");
const UPLOAD_DIR = "/tmp/uploads";

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use("/uploads", express.static(UPLOAD_DIR));

// Variável para status de digitação
let typingStatus = {}; // { Ewerton: true, Hellen: false }

// Endpoint: salvar mensagem de texto
app.post("/save-message", (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    const messageData = {
        user: req.body.user,
        content: req.body.content,
        replyTo: req.body.replyTo || null,
        timestamp: Date.now()
    };
    messages.push(messageData);
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
    res.json({ success: true });
});

// Endpoint: salvar mídia
app.post("/save-media", upload.single("media"), (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    messages.push({
        user: req.body.user,
        media: req.file.filename,
        timestamp: Date.now()
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
    res.json({ success: true });
});

// Endpoint: salvar mídia de visualização única
app.post("/save-single-view-media", upload.single("media"), (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    messages.push({
        user: req.body.user,
        media: req.file.filename,
        singleView: true,
        viewed: false,
        viewedBy: null,
        timestamp: Date.now()
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
    res.json({ success: true });
});

// Endpoint: marcar mídia como visualizada
app.post("/mark-as-viewed", (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    const messageIndex = messages.findIndex(msg => msg.media === req.body.media);

    if (messageIndex !== -1) {
        messages[messageIndex].viewed = true;
        messages[messageIndex].viewedBy = req.body.viewer;
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Mensagem não encontrada." });
    }
});

// Endpoint: carregar todas as mensagens
app.get("/load-messages", (req, res) => {
    res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
});

// Endpoint: atualizar status de digitação
app.post("/typing", (req, res) => {
    const { user, typing } = req.body;
    typingStatus[user] = typing;
    res.json({ success: true });
});

// Endpoint: pegar status de digitação
app.get("/typing-status", (req, res) => {
    res.json(typingStatus);
});

// Inicia o servidor
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
