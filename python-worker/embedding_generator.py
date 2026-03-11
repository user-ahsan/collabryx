"""
Embedding Generator Module
Uses Sentence Transformers to generate semantic embeddings for user profiles
"""

from sentence_transformers import SentenceTransformer
import torch
from typing import List

class EmbeddingGenerator:
    """
    Singleton class to handle embedding generation using sentence-transformers
    Model: all-MiniLM-L6-v2 (384 dimensions, optimized for semantic search)
    """
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingGenerator, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not hasattr(self, 'model'):
            # Load the all-MiniLM-L6-v2 model (384 dimensions)
            # Optimized for semantic search, lightweight, fast
            print("Loading embedding model...")
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            print(f"Embedding model loaded successfully. Using device: {self.device}")
    
    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text string
        
        Args:
            text: Input text to embed
            
        Returns:
            List of 768-dimensional floats representing the embedding
        """
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            # Generate embedding
            embedding = self.model.encode(
                text, 
                convert_to_tensor=True,
                normalize_embeddings=True
            )
            
            # Convert to list
            embedding = embedding.cpu().numpy().tolist()
            
            return embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            raise
    
    def get_model_info(self) -> dict:
        """Return model information"""
        return {
            "model_name": "all-MiniLM-L6-v2",
            "dimensions": 384,
            "device": self.device,
            "max_seq_length": 256,
            "description": "Lightweight model optimized for semantic search"
        }

# Singleton instance
generator = EmbeddingGenerator()


def construct_semantic_text(profile: dict, skills: list, interests: list) -> str:
    """
    Construct semantic text string from user profile data
    
    Args:
        profile: User profile dictionary
        skills: List of user skills
        interests: List of user interests
        
    Returns:
        Semantic text string for embedding
    """
    skills_text = ', '.join([s.get('skill_name', '') for s in skills]) if skills else 'None'
    interests_text = ', '.join([i.get('interest', '') for i in interests]) if interests else 'None'
    goals_text = ', '.join(profile.get('looking_for', [])) if profile.get('looking_for') else 'None'
    
    return f"""
Role: {profile.get('role', 'User')}.
Headline: {profile.get('headline', '')}.
Bio: {profile.get('bio', '')}.
Skills: {skills_text}.
Interests: {interests_text}.
Goals: {goals_text}.
Location: {profile.get('location', '')}.
    """.strip()
