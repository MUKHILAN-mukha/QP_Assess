from duckduckgo_search import DDGS
from typing import List, Dict

class WebSearcher:
    def __init__(self):
        self.ddgs = DDGS()
        
    def search(self, query: str, max_results: int = 3) -> List[Dict]:
        """
        Perform a DuckDuckGo search to ground the generated questions
        in current or external knowledge if the knowledge base is insufficient.
        """
        results = []
        try:
            for r in self.ddgs.text(query, max_results=max_results):
                results.append(r)
        except Exception as e:
            print(f"Web search error: {e}")
            
        return results

    def format_results_for_context(self, results: List[Dict]) -> str:
        """Format search results to be injected into the LLM prompt."""
        context = "Additional Web Context:\\n"
        for idx, res in enumerate(results):
            context += f"{idx+1}. {res.get('title')}: {res.get('body')}\\n\\n"
        return context
