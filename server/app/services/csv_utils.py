import os
from langchain_groq import ChatGroq
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter # Updated Import
from langchain_community.document_loaders import PyPDFLoader # Updated Import

# Initialize Embeddings (Local, Free)
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Initialize Vector DB (Persists to disk)
# Note: This will create a folder 'chroma_db' in your server directory
vector_db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile", 
    temperature=0.2, 
    groq_api_key=os.getenv("GROQ_API_KEY")
)

class AIService:
    
    @staticmethod
    async def ingest_pdf(file_path: str, course_id: str):
        """Reads a PDF and stores its content in Vector DB linked to course_id"""
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
            chunks = text_splitter.split_documents(documents)
            
            # Add metadata (course_id) to each chunk
            for chunk in chunks:
                chunk.metadata["course_id"] = course_id

            # Add to ChromaDB
            vector_db.add_documents(chunks)
            # vector_db.persist() # Optional: force save to disk immediately
            return {"message": "PDF ingested successfully"}
        except Exception as e:
            print(f"Error ingesting PDF: {e}")
            return {"error": str(e)}

    @staticmethod
    async def resolve_doubt(query: str, course_id: str):
        """Searches Vector DB for context, then answers"""
        
        try:
            # 1. Search Vector DB filtering by course_id
            results = vector_db.similarity_search(
                query, 
                k=3, 
                filter={"course_id": course_id}
            )
            
            context_text = "\n\n".join([doc.page_content for doc in results])
            
            if context_text:
                # Context found, generate answer
                prompt = f"""
                You are a helpful Teaching Assistant for the course. Use the following context from the course materials to answer the student's question.
                If the answer is not in the context, say you don't know.

                Context:
                {context_text}

                Question: {query}
                """
                response = llm.invoke(prompt)
                return {
                    "status": "RESOLVED",
                    "answer": response.content,
                    "source": "Course Materials"
                }
            else:
                # No context found
                return {
                    "status": "ESCALATED",
                    "answer": "I could not find relevant information in the course materials. Forwarding to Professor.",
                    "source": None
                }
        except Exception as e:
            # Fallback if vector search fails
            return {
                "status": "ERROR",
                "answer": f"Error processing request: {str(e)}",
                "source": None
            }