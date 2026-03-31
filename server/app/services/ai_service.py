import os
import re
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

# ✅ Initialize Embeddings
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# ✅ Initialize Vector DB
vector_db = Chroma(
    persist_directory="./chroma_db",
    embedding_function=embeddings
)

# ✅ Initialize LLM
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0.2,
    groq_api_key=os.getenv("GROQ_API_KEY")
)


# 🔥 NEW: WhatsApp → HTML formatter
def whatsapp_to_html(text: str) -> str:
    if not text:
        return text

    # ✅ Fix broken bold patterns like <b></b>Text<b></b>
    text = re.sub(r"<b>\s*</b>(.*?)<b>\s*</b>", r"<b>\1</b>", text)

    # ✅ Convert *text* → <b>text</b>
    text = re.sub(r"\*(.*?)\*", r"<b>\1</b>", text)

    # ✅ Convert _text_ → <i>text</i>
    text = re.sub(r"_(.*?)_", r"<i>\1</i>", text)

    # ✅ Remove empty tags
    text = re.sub(r"<b>\s*</b>", "", text)
    text = re.sub(r"<i>\s*</i>", "", text)

    # ✅ Clean multiple <br>
    text = re.sub(r"(<br>\s*){3,}", "<br><br>", text)

    # ✅ Ensure spacing
    text = text.strip()

    return text

class AIService:

    @staticmethod
    async def ingest_pdf(file_path: str, course_id: str):
        """Reads a PDF and stores its content in Vector DB linked to course_id"""
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()

            print("DEBUG → documents loaded:", len(documents))

            # Split text
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=100
            )
            chunks = text_splitter.split_documents(documents)

            print("DEBUG → chunks created:", len(chunks))

            # ✅ Ensure consistent metadata type
            for chunk in chunks:
                chunk.metadata["course_id"] = str(course_id)

            # Store in DB
            vector_db.add_documents(chunks)
            vector_db.persist()

            print("DEBUG → total stored:", vector_db._collection.count())

            return {"message": "PDF ingested successfully"}

        except Exception as e:
            print(f"Error ingesting PDF: {e}")
            return {"error": str(e)}

    @staticmethod
    async def resolve_doubt(query: str, course_id: str):
        """Searches Vector DB for context, then answers"""

        try:
            # 🔍 Search with filter
            results = vector_db.similarity_search(
                query,
                k=3,
                filter={"course_id": str(course_id)}
            )

            print("DEBUG → results count:", len(results))

            # 🧪 Fallback if no results
            if not results:
                print("DEBUG → No vector results, using fallback LLM")

                fallback_response = llm.invoke(
                    f"""
Explain clearly like a teacher.

Rules:
- No AI disclaimers
- No mentioning PDFs or access issues
- Use simple explanation

Question:
{query}
"""
                )

                formatted = whatsapp_to_html(fallback_response.content)

                return {
                    "status": "GENERAL",
                    "answer": formatted,
                    "source": "LLM (No course context found)"
                }

            # ✅ Build context
            context_text = "\n\n".join(
                [doc.page_content for doc in results]
            )

            print("DEBUG → context preview:", context_text[:200])

            # 🤖 RAG Prompt
            prompt = f"""
You are a college Teaching Assistant.

Explain clearly in a student-friendly way.

Rules:
- DO NOT use HTML tags like <b> or <i>
- Use *text* for bold formatting ONLY
- No empty formatting like <b></b>
- Keep output clean and readable
- No AI disclaimers

Context:
{context_text}

Question:
{query}

Answer:
"""
            response = llm.invoke(prompt)

            formatted = whatsapp_to_html(response.content)

            return {
                "status": "RESOLVED",
                "answer": formatted,
                "source": "Course Materials"
            }

        except Exception as e:
            print("ERROR:", str(e))
            return {
                "status": "ERROR",
                "answer": f"Error processing request: {str(e)}",
                "source": None
            }