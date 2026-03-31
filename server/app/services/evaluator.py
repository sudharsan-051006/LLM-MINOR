from openai import OpenAI

client = OpenAI()

def evaluate_with_llm(prompt: str):
    res = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
    )
    return res.choices[0].message.content