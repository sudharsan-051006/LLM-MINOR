import requests
import json
import re

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "mistral"


def call_llm(prompt: str) -> str:
    """
    Generic function to call Ollama
    """

    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False
            },
            timeout=120  # important for slow CPU
        )

        response.raise_for_status()
        data = response.json()

        return data.get("response", "").strip()

    except Exception as e:
        print("LLM ERROR:", e)
        return ""


def parse_llm_json(output: str):
    """
    Safely parse LLM output to JSON
    Handles bad formatting
    """

    try:
        return json.loads(output)

    except:
        # fallback if JSON fails
        score_match = re.search(r"\d+", output)
        score = int(score_match.group()) if score_match else 0

        return {
            "score": score,
            "feedback": output[:300]
        }


def grade_answer(question: str, answer: str):
    """
    Main grading function using Mistral
    """

    if not answer or not answer.strip():
        return {
            "score": 0,
            "max_score": 10,
            "feedback": "No answer provided"
        }

    # 🔥 STRICT PROMPT (prevents 10-Aug issue)
    prompt = f"""
You are a strict university evaluator.

Evaluate the student's answer.

RULES:
- Score must be integer between 0 and 10
- Return ONLY valid JSON
- Do NOT return text outside JSON
- Do NOT use words like Aug, Sep

FORMAT:
{{
  "score": 8,
  "feedback": "clear explanation"
}}

QUESTION:
{question}

STUDENT ANSWER:
{answer}
"""

    raw_output = call_llm(prompt)

    result = parse_llm_json(raw_output)

    return {
        "score": int(result.get("score", 0)),
        "max_score": 10,
        "feedback": result.get("feedback", "")
    }