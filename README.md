# Chama Dispute Arbitrator 🤝

An AI-powered arbitrator designed to resolve disputes in Kenyan savings groups (Chamas) using bylaws, M-Pesa records, and fair reasoning.

## 🌟 The Problem
In Kenyan Chamas, disputes often arise regarding missed contributions, loan eligibility, and interpretation of bylaws. Manual resolution by committee members can be slow, subject to bias, or complicated by incomplete record-keeping. The **Chama Dispute Arbitrator** solves this by providing an objective, rules-based intelligence layer that interprets constitution articles and financial data in real-time to propose fair resolutions.

## 🧠 Agent Architecture

The application is built on a full-stack architecture using **React**, **Express**, and the **Gemini AI API**.

### Intelligence Layer
- **Model**: `gemini-3-flash-preview`
- **System Instructions**: Configured with a specialized "Chama Arbitrator" persona that understands Swahili, Sheng, and English. It is programmed to follow strict arbitration rules: cite bylaws, use factual M-Pesa data, and remain unbiased.

### Specialized Tools
- **`search_bylaws`**: RAG-style search across the group's primary constitution.
- **`search_additional_documents`**: Dynamic search across user-uploaded agreements or meeting minutes.
- **`get_member_financial_status`**: Real-time extraction of contribution history and balances from parsed M-Pesa records.
- **`calculate_loan_eligibility`**: Logic-driven tool that applies bylaw rules to member data.
- **`compare_members`**: Analysis tool for multi-party disputes.

### Data Flow
1. **Financial Records**: `mpesa_records.csv` is parsed on-demand to create up-to-date member profiles.
2. **Knowledge Base**: `chama_bylaws.txt` acts as the primary source of truth, supplemented by an `uploads/` directory for additional context.

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- A **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

## 💬 How to Interact
- **Chat**: Ask questions in English, Swahili, or Sheng (e.g., *"Jane hajalipa mwezi tatu. Anatakiwa suspend?"*).
- **Quick Actions**: Use the suggested prompts to check loan eligibility or calculate late fees instantly.
- **Knowledge Base**: Upload new rule documents (PDF/TXT/MD) using the upload icon to expand the arbitrator's memory.
- **Dashboard**: Monitor "Chama Health" and real-time M-Pesa logs via the Bento Grid interface.

## 👥 Team & Roles
- **Developer 1**: Data + RAG Setup (Knowledge Base initialization and search logic)
- **Developer 2**: Vertex AI Agent Builder (System prompts, persona, and Gemini integration)
- **Developer 3**: M-Pesa Parser + Server Logic (CSV parsing and tool-calling implementation)
- **Developer 4**: Web Interface (Frontend design, Bento Grid layout, and UX)

## ⚖️ Data Handling Policy
The Chama Dispute Arbitrator processes financial records locally on the server. We prioritize **political neutrality** and **rule-of-law** by ensuring the AI strictly cites provided bylaws rather than generating subjective opinions. All proposed resolutions are advisory, intended to assist the Chama committee in final decision-making.
