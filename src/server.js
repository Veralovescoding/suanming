const express = require('express');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const multer = require('multer');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;
const PROMPTS_FILE = path.join(__dirname, 'prompts.json');
const HISTORY_FILE = path.join(__dirname, 'history.json');
const RAG_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(RAG_DIR)) fs.mkdirSync(RAG_DIR, { recursive: true });

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const upload = multer({ dest: RAG_DIR });

// --- Persistence Helpers ---
function readJson(file) {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return []; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// --- API: Prompts ---
app.get('/api/prompts', (req, res) => res.json(readJson(PROMPTS_FILE)));
app.post('/api/prompts', (req, res) => {
  const { name, content } = req.body;
  const prompts = readJson(PROMPTS_FILE);
  const newItem = { id: 'v' + Date.now(), name, content, timestamp: Date.now() };
  prompts.push(newItem);
  writeJson(PROMPTS_FILE, prompts);
  res.json(newItem);
});

// --- API: History ---
app.get('/api/history', (req, res) => res.json(readJson(HISTORY_FILE).reverse()));
app.delete('/api/history', (req, res) => {
  writeJson(HISTORY_FILE, []);
  res.json({ success: true });
});

// --- API: RAG (Simple Text-based Knowledge) ---
app.get('/api/rag', (req, res) => {
  const files = fs.readdirSync(RAG_DIR).filter(f => f.endsWith('.txt'));
  const docs = files.map(f => ({ name: f, content: fs.readFileSync(path.join(RAG_DIR, f), 'utf8') }));
  res.json(docs);
});

app.post('/api/rag', upload.single('file'), (req, res) => {
  if (!req.file && !req.body.text) return res.status(400).json({ error: '请上传文件或输入文本' });
  
  const name = req.body.name || `doc_${Date.now()}.txt`;
  const content = req.body.text || fs.readFileSync(req.file.path, 'utf8');
  
  fs.writeFileSync(path.join(RAG_DIR, name), content, 'utf8');
  if (req.file) fs.unlinkSync(req.file.path);
  
  res.json({ success: true, name });
});

// --- Core Logic ---
function buildPrompt({ birthDate, birthTime, gender, city, customPromptTemplate, ragContext = "" }) {
  let template = customPromptTemplate || `你是一位八字分析师。用户信息：\${birthDate} \${birthTime} \${gender} \${city}。请给出详细分析。`;
  
  let finalPrompt = template
    .replace(/\${birthDate}/g, birthDate)
    .replace(/\${birthTime}/g, birthTime)
    .replace(/\${gender}/g, gender || '未提供')
    .replace(/\${city}/g, city || '未提供');

  if (ragContext) {
    finalPrompt = `参考知识库内容：\n${ragContext}\n\n基于上述知识对以下用户进行分析：\n${finalPrompt}`;
  }
  return finalPrompt;
}

async function callLLM(prompt, settings = {}) {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';

  if (!baseUrl || !apiKey) return "【演示模式】API Key 未配置。";

  const temperature = parseFloat(settings.temperature) || 0.7;
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model, temperature,
      messages: [{ role: 'system', content: '你是咕噜相师，一位专业且温暖的命理解读助手。' }, { role: 'user', content: prompt }]
    })
  });

  if (!resp.ok) throw new Error(`LLM Error: ${resp.status}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '无结果';
}

app.post('/api/analyze', async (req, res) => {
  try {
    const { birthDate, birthTime, gender, city, customPromptTemplate, settings, useRag } = req.body;
    
    let ragContext = "";
    if (useRag) {
      const files = fs.readdirSync(RAG_DIR).filter(f => f.endsWith('.txt'));
      ragContext = files.map(f => fs.readFileSync(path.join(RAG_DIR, f), 'utf8')).join("\n---\n");
    }

    const prompt = buildPrompt({ birthDate, birthTime, gender, city, customPromptTemplate, ragContext });
    const result = await callLLM(prompt, settings);

    // Save to history
    const history = readJson(HISTORY_FILE);
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      input: { birthDate, birthTime, gender, city },
      result
    };
    history.push(historyEntry);
    writeJson(HISTORY_FILE, history);

    res.json({ result, historyId: historyEntry.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Gulu Master running on http://localhost:${PORT}`));
