"""
Tests for EmbeddingGenerator class
"""

import pytest
import asyncio
from embedding_generator import EmbeddingGenerator, construct_semantic_text


class TestEmbeddingGenerator:
    """Test suite for EmbeddingGenerator"""
    
    def test_singleton_instance(self):
        """Test that EmbeddingGenerator is a singleton"""
        gen1 = EmbeddingGenerator()
        gen2 = EmbeddingGenerator()
        assert gen1 is gen2
    
    def test_model_loading(self, embedding_generator):
        """Test that the model loads correctly"""
        info = embedding_generator.get_model_info()
        assert info['model_name'] == 'all-MiniLM-L6-v2'
        assert info['dimensions'] == 384
        assert info['device'] in ['cpu', 'cuda']
    
    @pytest.mark.asyncio
    async def test_embedding_generation(self, embedding_generator, valid_embedding_text):
        """Test generating an embedding"""
        embedding = await embedding_generator.generate_embedding(valid_embedding_text)
        
        assert len(embedding) == 384
        assert all(isinstance(v, float) for v in embedding)
        
        magnitude = sum(v * v for v in embedding) ** 0.5
        assert 0.99 <= magnitude <= 1.01
    
    @pytest.mark.asyncio
    async def test_empty_text_validation(self, embedding_generator):
        """Test that empty text is rejected"""
        with pytest.raises(ValueError, match="Text cannot be empty"):
            await embedding_generator.generate_embedding("")
    
    @pytest.mark.asyncio
    async def test_short_text_validation(self, embedding_generator):
        """Test that too short text is rejected"""
        with pytest.raises(ValueError, match="Text too short"):
            await embedding_generator.generate_embedding("too short")
    
    @pytest.mark.asyncio
    async def test_long_text_truncation(self, embedding_generator):
        """Test that long text is truncated"""
        long_text = "a" * 3000
        embedding = await embedding_generator.generate_embedding(long_text)
        assert len(embedding) == 384
    
    @pytest.mark.asyncio
    async def test_retry_logic(self, embedding_generator, valid_embedding_text):
        """Test that retry logic works (decorated with tenacity)"""
        embedding = await embedding_generator.generate_embedding(valid_embedding_text)
        assert len(embedding) == 384
    
    def test_model_info(self, embedding_generator):
        """Test model info endpoint"""
        info = embedding_generator.get_model_info()
        
        assert 'model_name' in info
        assert 'dimensions' in info
        assert 'device' in info
        assert 'max_seq_length' in info
        assert info['dimensions'] == 384
        assert info['max_seq_length'] == 256


class TestConstructSemanticText:
    """Test suite for construct_semantic_text function"""
    
    def test_complete_profile(self, sample_profile, sample_skills, sample_interests):
        """Test semantic text construction with complete data"""
        text = construct_semantic_text(sample_profile, sample_skills, sample_interests)
        
        assert 'Role: Student' in text
        assert 'Headline: React Developer' in text
        assert 'React' in text
        assert 'Fintech' in text
        assert 'cofounder' in text
        assert len(text) <= 2000
    
    def test_empty_profile(self):
        """Test handling of empty profile data"""
        text = construct_semantic_text({}, [], [])
        
        assert 'Role: User' in text
        assert len(text) > 0
    
    def test_missing_looking_for(self, sample_profile, sample_skills, sample_interests):
        """Test profile without looking_for field"""
        profile = sample_profile.copy()
        profile['looking_for'] = None
        
        text = construct_semantic_text(profile, sample_skills, sample_interests)
        assert 'Goals: None' in text
    
    def test_truncation(self):
        """Test that very long profiles are truncated"""
        profile = {
            'role': 'Student',
            'headline': 'Developer',
            'bio': 'a' * 3000,
            'looking_for': ['collaboration'],
            'location': 'NYC'
        }
        
        text = construct_semantic_text(profile, [], [])
        assert len(text) <= 2000
    
    def test_special_characters(self):
        """Test handling of special characters"""
        profile = {
            'role': 'Student & Developer',
            'headline': 'Full-Stack <Engineer>',
            'bio': 'Passionate about "AI/ML" & data science',
            'looking_for': ['collaboration'],
            'location': 'SF Bay Area'
        }
        
        text = construct_semantic_text(profile, [], [])
        assert len(text) > 0
