import google.generativeai as genai
import os
import json
import requests
import time
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY", "")
GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions"

# Current working Groq models (as of 2025)
GROQ_MODELS = [
    "llama-3.1-8b-instant",   # fast, free
    "llama-3.3-70b-versatile", # smarter, still free
    "mixtral-8x7b-32768",      # fallback
]

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel("gemini-2.0-flash")
else:
    gemini_model = None


def call_groq(prompt: str) -> str:
    """Try each Groq model until one works."""
    if not GROQ_API_KEY:
        raise Exception("No GROQ_API_KEY in .env")

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    last_error = None
    for model in GROQ_MODELS:
        try:
            body = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500,
                "temperature": 0.3
            }
            res  = requests.post(GROQ_URL, headers=headers, json=body, timeout=30)
            data = res.json()

            if "choices" in data:
                return data["choices"][0]["message"]["content"].strip()

            err = data.get("error", {}).get("message", str(data))
            print(f"Groq model {model} failed: {err}")
            last_error = err

        except Exception as e:
            print(f"Groq model {model} exception: {e}")
            last_error = str(e)

    raise Exception(f"All Groq models failed. Last error: {last_error}")


def call_gemini(prompt: str) -> str:
    if not gemini_model:
        raise Exception("Gemini not configured")
    response = gemini_model.generate_content(prompt)
    return response.text.strip()


def call_llm(prompt: str) -> str:
    """Groq first (higher free limits), Gemini as fallback."""
    try:
        return call_groq(prompt)
    except Exception as e:
        print(f"Groq failed: {e} — trying Gemini...")
        return call_gemini(prompt)


def analyze_ticket(message: str, product: str = "", channel: str = "") -> dict:
    prompt = f"""You are a customer support analyst. Analyze this ticket.
Return ONLY a valid JSON object. No extra text. No markdown. No explanation.

Ticket:
- Channel: {channel}
- Product: {product}
- Message: {message}

Return EXACTLY this JSON:
{{
  "category": "one of: Refund/Return, Shipping Delay, Product Defect, Login Issue, Payment Failed, Wrong Item, Account Problem, General Inquiry",
  "sentiment": "positive or negative or neutral",
  "frustration_score": <integer from 1 to 10>,
  "key_issue": "<one sentence describing the core problem>",
  "suggested_response": "<a helpful professional reply an agent should send>"
}}"""

    try:
        raw = call_llm(prompt)

        if "```" in raw:
            parts = raw.split("```")
            raw = parts[1] if len(parts) > 1 else parts[0]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        return json.loads(raw)

    except Exception as e:
        print(f"AI analysis failed: {e}")
        return {
            "category": "General Inquiry",
            "sentiment": "neutral",
            "frustration_score": 5,
            "key_issue": message[:120],
            "suggested_response": "Thank you for contacting us. We are looking into your issue and will respond shortly."
        }


def generate_insight_summary(tickets_data: list) -> str:
    if not tickets_data:
        return "No ticket data available yet. Please upload tickets first."

    lines = "\n".join([
        f"- [{t['category']}] Score:{t['frustration_score']}/10 — {t['key_issue']}"
        for t in tickets_data[:60]
    ])

    prompt = f"""You are a business analyst. Here are recent customer support tickets:

{lines}

Write a short executive summary (3-4 sentences) covering:
1. The biggest problem area right now
2. Which issue is most likely hurting revenue  
3. One specific action leadership should take immediately

Be direct, clear, and specific."""

    try:
        return call_llm(prompt)
    except Exception as e:
        return f"Summary generation failed: {e}"