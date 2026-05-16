import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Persistence Helpers ---
const DATA_DIR = path.join(process.cwd(), "data");
const DOCS_DIR = path.join(DATA_DIR, "documents");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR);

const BYLAWS_PATH = path.join(DATA_DIR, "chama_bylaws.txt");
const MEMBERS_PATH = path.join(DATA_DIR, "members.json");
const MPESA_PATH = path.join(DATA_DIR, "mpesa_records.csv");

// --- Multer Setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOCS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.csv', '.md', '.pdf']; // Basic support, PDF handling might need extra libs if we want to read it properly
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .txt, .csv, .md and .pdf files are allowed"));
    }
  }
});

// --- M-Pesa Parser & Logic ---

function parse_mpesa_records() {
  try {
    const raw = fs.readFileSync(MPESA_PATH, "utf-8");
    const lines = raw.split("\n").filter(line => line.trim() !== "");
    const headers = lines[0].split(",");
    const rows = lines.slice(1).map(line => {
      const values = line.split(",");
      return headers.reduce((obj: any, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });

    const stats: Record<string, any> = {};

    rows.forEach(row => {
      const member = row.Member;
      if (!stats[member]) {
        stats[member] = {
          name: member,
          total_contributions: 0,
          missed_payments: 0,
          late_fees_owed: 0,
          loan_balance: 0,
          records: []
        };
      }

      const amount = parseFloat(row.Amount) || 0;
      stats[member].records.push(row);

      if (row.Type === 'Contribution') stats[member].total_contributions += amount;
      if (row.Type === 'Late Fee') stats[member].late_fees_owed += amount;
      if (row.Type === 'MISSED') stats[member].missed_payments += 1;
      if (row.Type === 'Loan Disbursement') stats[member].loan_balance += amount;
    });

    return stats;
  } catch (error) {
    console.error("Parser Error:", error);
    return {};
  }
}

// --- Tool Implementations ---

function search_bylaws(query: string): string {
  try {
    const bylaws = fs.readFileSync(BYLAWS_PATH, "utf-8");
    const articles = bylaws.split(/ARTICLE \d+:/);
    const results: string[] = [];
    const keywords = query.toLowerCase().split(/\s+/);
    
    articles.forEach((article, index) => {
      if (index === 0) return;
      const fullArticle = `ARTICLE ${index}:${article}`;
      if (keywords.some(k => fullArticle.toLowerCase().includes(k))) {
        results.push(fullArticle.trim());
      }
    });

    return results.length > 0 
      ? results.join("\n\n---\n\n") 
      : "No specific bylaw found. Please check the general constitution text.";
  } catch (error) {
    return "Error reading bylaws.";
  }
}

function get_member_financial_status(member_name: string) {
  const stats = parse_mpesa_records();
  const name = Object.keys(stats).find(n => n.toLowerCase().includes(member_name.toLowerCase()));
  const member = name ? stats[name] : null;

  if (!member) return { error: `Member ${member_name} not found in M-Pesa records` };

  return {
    name: member.name,
    total_contributions: member.total_contributions,
    missed_payments: member.missed_payments,
    late_fees_owed: member.late_fees_owed,
    loan_balance: member.loan_balance,
    status: member.missed_payments >= 3 ? "SUSPENDED" : "ACTIVE"
  };
}

function calculate_loan_eligibility(member_name: string) {
  const status: any = get_member_financial_status(member_name);
  if (status.error) return status;

  const hasOutstandingLoan = status.loan_balance > 0;
  const maxLoanAmount = status.total_contributions * 3;
  const isEligible = !hasOutstandingLoan && status.status === "ACTIVE";

  return {
    name: status.name,
    eligible: isEligible,
    max_loan_amount: isEligible ? maxLoanAmount : 0,
    reason: hasOutstandingLoan 
      ? "Outstanding loan exists (ARTICLE 2, Section 2.5)" 
      : status.status === "SUSPENDED" 
        ? "Member is suspended due to missed payments" 
        : "Eligible for loan",
    bylaw_reference: "ARTICLE 2, Section 2.2 & 2.5"
  };
}

function compare_members(member_a_name: string, member_b_name: string) {
  const stats = parse_mpesa_records();
  const nameA = Object.keys(stats).find(n => n.toLowerCase().includes(member_a_name.toLowerCase()));
  const nameB = Object.keys(stats).find(n => n.toLowerCase().includes(member_b_name.toLowerCase()));

  const a = nameA ? stats[nameA] : null;
  const b = nameB ? stats[nameB] : null;

  if (!a || !b) return { error: "One or both members not found" };

  return {
    member_a: { name: a.name, contributions: a.total_contributions, missed: a.missed_payments },
    member_b: { name: b.name, contributions: b.total_contributions, missed: b.missed_payments },
    comparison: {
      who_contributed_more: a.total_contributions > b.total_contributions ? a.name : b.name,
      contribution_diff: Math.abs(a.total_contributions - b.total_contributions)
    }
  };
}

function search_additional_documents(query: string): string {
  try {
    const files = fs.readdirSync(DOCS_DIR);
    let allContent = "";
    const keywords = query.toLowerCase().split(/\s+/);

    files.forEach(file => {
      const filePath = path.join(DOCS_DIR, file);
      const content = fs.readFileSync(filePath, "utf-8");
      
      // Basic match for now: if any keyword is in the file
      if (keywords.some(k => content.toLowerCase().includes(k))) {
        allContent += `--- SOURCE: ${file} ---\n${content}\n\n`;
      }
    });

    return allContent || "No additional relevant documents found in the uploaded knowledge base.";
  } catch (error) {
    return "Error reading additional documents.";
  }
}

// --- Gemini Setup ---

const tools: { functionDeclarations: FunctionDeclaration[] } = {
  functionDeclarations: [
    {
      name: "search_bylaws",
      description: "Search chama bylaws and constitution for rules regarding membership, contributions, loans, and emergencies.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "The keyword or topic to search for in bylaws" }
        },
        required: ["query"]
      }
    },
    {
      name: "get_member_financial_status",
      description: "Get a member's current financial position including contributions, missed payments, and loan balance.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          member_name: { type: Type.STRING, description: "Full name of the member" }
        },
        required: ["member_name"]
      }
    },
    {
      name: "calculate_loan_eligibility",
      description: "Calculate if a member is eligible for a loan and determining the maximum amount allowed.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          member_name: { type: Type.STRING, description: "Full name of the member" }
        },
        required: ["member_name"]
      }
    },
    {
      name: "search_additional_documents",
      description: "Search uploaded documents (other than the primary bylaws) for additional context, rules, or agreements.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          query: { type: Type.STRING, description: "The keyword or topic to search for in uploaded documents" }
        },
        required: ["query"]
      }
    },
    {
      name: "compare_members",
      description: "Compare the financial positions of two members specifically for dispute resolution.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          member_a_name: { type: Type.STRING, description: "Name of the first member" },
          member_b_name: { type: Type.STRING, description: "Name of the second member" }
        },
        required: ["member_a_name", "member_b_name"]
      }
    }
  ]
};

const SYSTEM_PROMPT = `
Wewe ni Msuluhishi wa Migogoro ya Chama (Chama Dispute Arbitrator).

ROLE: You mediate disputes in Kenyan chamas (savings groups) using:
1. The chama's primary bylaws (constitution)
2. Additional uploaded documents (agreements, special minutes, supplementary rules)
3. M-Pesa financial records (Member records)
4. Fair, unbiased reasoning

LANGUAGE HANDLING:
- Accept Swahili, Sheng, and English.
- Respond in the same language user uses.
- Common Sheng: "mse" = member, "doh" = money, "kulipa" = pay, "chuja" = suspend/remove.

ARBITRATION RULES:
1. ALWAYS cite specific bylaw articles (e.g., "ARTICLE 1, Section 1.3") using tools.
2. NEVER invent financial figures - only use actual data from tools.
3. Be fair to BOTH parties.
4. If bylaws don't cover something, say so explicitly.
5. Propose resolutions that follow the chama's own rules.

RESPONSE STRUCTURE:
1. Summarize the dispute clearly.
2. Cite relevant bylaws found via search.
3. Present factual evidence from financial records.
4. Propose fair resolution based on bylaws.
5. Explain your reasoning in a calm, authoritative yet collective voice.
`;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.get("/api/data", (req, res) => {
  try {
    const stats = parse_mpesa_records();
    const membersList = Object.values(stats).map(m => ({
      name: m.name,
      late_fees_owed: m.late_fees_owed,
      missed_payments: m.missed_payments,
      loan_balance: m.loan_balance,
      total_contributions: m.total_contributions,
      status: m.missed_payments >= 3 ? "SUSPENDED" : "ACTIVE"
    }));

    // Get last 10 records for log
    const allRecords: any[] = [];
    Object.values(stats).forEach((m: any) => {
      m.records.forEach((r: any) => allRecords.push(r));
    });
    const sortedRecords = allRecords.sort((a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()).slice(0, 10);

    const uploadedDocs = fs.readdirSync(DOCS_DIR);

    res.json({ members: membersList, records: sortedRecords, documents: uploadedDocs });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ message: "File uploaded successfully", filename: req.file.filename });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Prepare contents for Gemini
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Generate content with tools
    let response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: tools.functionDeclarations }]
      }
    });

    // Handle tool calls iteratively
    while (response.functionCalls?.length) {
      const toolResponses = [];
      const previousContent = response.candidates?.[0]?.content;
      
      for (const call of response.functionCalls) {
        let toolResult;
        if (call.name === "search_bylaws") toolResult = search_bylaws(call.args.query as string);
        if (call.name === "search_additional_documents") toolResult = search_additional_documents(call.args.query as string);
        if (call.name === "get_member_financial_status") toolResult = get_member_financial_status(call.args.member_name as string);
        if (call.name === "calculate_loan_eligibility") toolResult = calculate_loan_eligibility(call.args.member_name as string);
        if (call.name === "compare_members") toolResult = compare_members(call.args.member_a_name as string, call.args.member_b_name as string);
        
        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: { result: toolResult },
            id: call.id
          }
        });
      }

      // Add the model's call and our response to the list of contents to preserve context
      if (previousContent) {
        contents.push(previousContent);
      }
      contents.push({ role: 'user', parts: toolResponses });

      response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: tools.functionDeclarations }]
        }
      });
    }

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message || "Failed to process dispute" });
  }
});

// --- Vite Middleware ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
