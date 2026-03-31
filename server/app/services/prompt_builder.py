def build_prompt(question_text: str, student_text: str):
    return f"""
You are a strict university professor.

QUESTION PAPER:
{question_text}

STUDENT ANSWERS:
{student_text}

Evaluate each answer:
- Give marks
- Provide feedback

Return JSON format:
{{
  "total": 100,
  "details": [
    {{"question": "...", "marks": 10, "feedback": "..."}}
  ]
}}
"""