from .pdf_parser import extract_text_pdf
from .ocr_parser import extract_text_ocr

def extract_text(file_path: str):
    try:
        text = extract_text_pdf(file_path)
        if text and text.strip():
            return text
    except:
        pass

    return extract_text_ocr(file_path)