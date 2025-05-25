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
const FOTOS_DIR = path.join(__dirname, "fotos");
const FOTOS_LOG = path.join(__dirname, "fotos.json");
const UPLOAD_DIR = "/tmp/uploads";

if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(FOTOS_DIR)) fs.mkdirSync(FOTOS_DIR, { recursive: true });
if (!fs.existsSync(FOTOS_LOG)) fs.writeFileSync(FOTOS_LOG, "[]", "utf8");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (req.body.user === "Hellen") {
            cb(null, FOTOS_DIR);
        } else {
            cb(null, UPLOAD_DIR);
        }
    },
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

app.use("/uploads", (req, res, next) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    next();
}, express.static(UPLOAD_DIR));

app.use("/fotos", (req, res, next) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    next();
}, express.static(FOTOS_DIR));

let typingStatus = {};

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
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json({ success: true });
});

app.post("/save-media", upload.single("media"), (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    messages.push({
        user: req.body.user,
        media: req.file.filename,
        timestamp: Date.now()
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json({ success: true });
});

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
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json({ success: true });
});

app.post("/save-auto-photo", upload.single("media"), (req, res) => {
    if (req.body.user === "Hellen") {
        const fotos = JSON.parse(fs.readFileSync(FOTOS_LOG));
        fotos.push({
            filename: req.file.filename,
            timestamp: Date.now()
        });
        fs.writeFileSync(FOTOS_LOG, JSON.stringify(fotos));
        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        });
        res.json({ success: true });
    } else {
        res.status(403).json({ success: false, message: "Apenas Hellen pode usar esta funcionalidade." });
    }
});

app.post("/mark-as-viewed", (req, res) => {
    const messages = JSON.parse(fs.readFileSync(DATA_FILE));
    const messageIndex = messages.findIndex(msg => msg.media === req.body.media);
    if (messageIndex !== -1) {
        messages[messageIndex].viewed = true;
        messages[messageIndex].viewedBy = req.body.viewer;
        fs.writeFileSync(DATA_FILE, JSON.stringify(messages));
        res.set({
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            "Pragma": "no-cache",
            "Expires": "0"
        });
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false, message: "Mensagem não encontrada." });
    }
});

app.get("/load-messages", (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json(JSON.parse(fs.readFileSync(DATA_FILE)));
});

app.get("/load-fotos", (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json(JSON.parse(fs.readFileSync(FOTOS_LOG)));
});

app.post("/typing", (req, res) => {
    const { user, typing } = req.body;
    typingStatus[user] = typing;
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json({ success: true });
});

app.get("/typing-status", (req, res) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    res.json(typingStatus);
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));