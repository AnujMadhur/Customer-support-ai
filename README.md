# 🎯 Customer Support AI Platform

An AI-powered platform that analyzes customer support tickets, detects sentiment and frustration, and provides actionable insights through an interactive dashboard.

---

## 🚀 Features

* 📂 Upload CSV file of customer support tickets
* 🤖 AI-based analysis:

  * Sentiment detection (Positive / Neutral / Negative)
  * Frustration scoring (0–10)
  * Issue categorization
  * Key issue extraction
  * Suggested response generation
* 📊 Interactive dashboard:

  * Top issues by volume
  * Sentiment breakdown
  * Frustration analysis
  * Tickets by country & channel
* 🧠 AI-generated executive summary
* 🎫 Detailed ticket view with AI insights

---

## 🏗️ Tech Stack

### Backend

* Python
* FastAPI
* SQLite

### Frontend

* React (Vite)
* Recharts
* Axios

### AI Integration

* Groq API (LLM)
* Google Gemini API (fallback)

### DevOps

* Docker

---

## 📁 Project Structure

```
customer-support-ai/
│
├── backend/              # FastAPI backend
│   ├── main.py
│   ├── models/
│   ├── routes/
│   └── support.db
│
├── frontend/             # React dashboard
│   ├── src/
│   └── public/
│
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/your-username/customer-support-ai.git
cd customer-support-ai
```

---

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app
```

Backend will run on:
👉 http://127.0.0.1:8000/docs

---

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:
👉 http://localhost:5173/

---

### 4. Run with Docker (Optional)

```bash
docker compose up --build
```

---

## 📊 How to Use

1. Open the dashboard in browser
2. Upload a CSV file with customer support tickets
3. Wait for AI processing
4. Explore insights:

   * Charts
   * Ticket analysis
   * AI-generated summary

---

## 🧠 How It Works (Simple Flow)

1. User uploads CSV
2. Backend processes tickets
3. AI analyzes each ticket:

   * Detects sentiment
   * Calculates frustration
   * Extracts issue
   * Generates response
4. Data stored in database
5. Frontend fetches insights via API
6. Dashboard visualizes everything

---

## 💡 Use Cases

* Improve customer support efficiency
* Identify common product issues
* Understand customer sentiment
* Generate smart AI responses
* Business decision making

---

## ⚠️ Notes

* Requires API keys for AI services
* Free-tier APIs may have rate limits
* Large CSV files may take time to process

---

## 🔐 Environment Variables

Create a `.env` file inside `backend/`:

```
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
DATABASE_URL=./support.db
```

---

## 🧪 Example Dataset

Upload a CSV with columns like:

```
ticket_id,message,product,channel,country,resolution_status
```

---

## 🚀 Future Improvements

* Real-time streaming dashboard
* Authentication system
* Deployment on cloud (AWS / Vercel)
* More advanced AI insights
* Multilingual support

---

## 👨‍💻 Author

**Anuj Mahajan**

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
