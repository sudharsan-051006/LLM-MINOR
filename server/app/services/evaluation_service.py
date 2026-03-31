from .pdf_parser import extract_text_from_pdf
from .llm_grader import grade_with_llm

def evaluate_submission(question_path: str, submission_path: str):
    # 1. Extract text
    question_text = extract_text_from_pdf(question_path)
    submission_text = extract_text_from_pdf(submission_path)

    # 2. Send to LLM
    result = grade_with_llm(question_text, submission_text)

    return result