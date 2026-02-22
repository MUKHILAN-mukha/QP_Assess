from langchain_chroma import Chroma
from langchain_community.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from typing import List
import chromadb

class Retriever:
    def __init__(self, persist_directory: str = "chroma_db"):
        self.embedding_function = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
        self.persist_directory = persist_directory
        self.client = chromadb.PersistentClient(path=persist_directory)
        
    def _get_vectorstore_for_subject(self, subject: str):
        safe_subject = "".join([c if c.isalnum() else "_" for c in subject])
        if not safe_subject:
            safe_subject = "default_subject"
            
        return Chroma(
            client=self.client,
            collection_name=safe_subject,
            embedding_function=self.embedding_function,
        )

    def add_documents(self, documents: List[str], metadatas: List[dict], subject: str):
        vectorstore = self._get_vectorstore_for_subject(subject)
        vectorstore.add_texts(texts=documents, metadatas=metadatas)
        
    def delete_document(self, subject: str, source_filename: str):
        safe_subject = "".join([c if c.isalnum() else "_" for c in subject])
        if not safe_subject:
            safe_subject = "default_subject"
            
        try:
            collection = self.client.get_collection(name=safe_subject)
            # Find and delete chunks where the "source" metadata matches the filename
            collection.delete(where={"source": source_filename})
            return True
        except Exception as e:
            print(f"Failed to delete document vectors: {e}")
            return False
            
    def delete_subject(self, subject: str):
        safe_subject = "".join([c if c.isalnum() else "_" for c in subject])
        if not safe_subject:
            safe_subject = "default_subject"
            
        try:
            self.client.delete_collection(name=safe_subject)
            return True
        except ValueError:
            # Collection might not exist, which is fine
            return True
        except Exception as e:
            print(f"Failed to delete subject collection: {e}")
            return False
        
    def search(self, query: str, subject: str, k: int = 5):
        vectorstore = self._get_vectorstore_for_subject(subject)
        return vectorstore.similarity_search(query, k=k)

