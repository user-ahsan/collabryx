"""
Embedding Generator Module
Uses Sentence Transformers to generate semantic embeddings for user profiles
"""

from sentence_transformers import SentenceTransformer
import torch
import asyncio
from typing import List
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)
from embedding_validator import EmbeddingValidator


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
        if not hasattr(self, "model"):
            print("Loading embedding model...")
            self.model = SentenceTransformer("all-MiniLM-L6-v2")
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            # No lock needed - SentenceTransformer.encode() is thread-safe
            print(f"Embedding model loaded successfully. Using device: {self.device}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for a text string with retry logic

        Args:
            text: Input text to embed (10-512 characters recommended)

        Returns:
            List of 384-dimensional floats representing the embedding

        Raises:
            ValueError: If text is empty or too short
            Exception: If embedding generation fails after retries
        """
        try:
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")

            if len(text.strip()) < 10:
                raise ValueError("Text too short (minimum 10 characters)")

            if len(text) > 2000:
                text = text[:2000]

            # SentenceTransformer.encode() is thread-safe, no lock needed
            embedding = self.model.encode(
                text, convert_to_tensor=True, normalize_embeddings=True
            )

            raw_embedding = embedding.cpu().numpy().tolist()

            fixed_embedding, validation_result = EmbeddingValidator.validate_and_fix(
                raw_embedding
            )

            if not validation_result.is_valid:
                raise ValueError(f"Invalid embedding: {validation_result.message}")

            return fixed_embedding
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
            "description": "Lightweight model optimized for semantic search",
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
        Semantic text string for embedding (max 2000 chars)
    """
    skills_text = (
        ", ".join([s.get("skill_name", "") for s in skills]) if skills else "None"
    )
    interests_text = (
        ", ".join([i.get("interest", "") for i in interests]) if interests else "None"
    )
    goals_text = (
        ", ".join(profile.get("looking_for", []))
        if profile.get("looking_for")
        else "None"
    )

    semantic_text = f"""
Role: {profile.get("role", "User")}.
Headline: {profile.get("headline", "")}.
Bio: {profile.get("bio", "")}.
Skills: {skills_text}.
Interests: {interests_text}.
Goals: {goals_text}.
Location: {profile.get("location", "")}.
    """.strip()

    return semantic_text[:2000]
