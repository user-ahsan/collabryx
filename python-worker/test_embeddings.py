"""
Test script for the embedding generator
Run this to verify the embedding service works correctly
"""

import sys
import time
from embedding_generator import generator, construct_semantic_text


def test_model_loading():
    """Test that the model loads correctly"""
    print("Testing model loading...")
    info = generator.get_model_info()
    print(f"✓ Model loaded: {info['model_name']}")
    print(f"✓ Dimensions: {info['dimensions']}")
    print(f"✓ Device: {info['device']}")
    assert info['model_name'] == 'all-MiniLM-L6-v2'
    assert info['dimensions'] == 384
    print("✓ Model loading test passed\n")


def test_embedding_generation():
    """Test generating an embedding"""
    print("Testing embedding generation...")
    
    test_text = "Student React Developer passionate about Fintech"
    
    start_time = time.time()
    embedding = generator.generate_embedding(test_text)
    elapsed = (time.time() - start_time) * 1000
    
    print(f"✓ Generated embedding of length: {len(embedding)}")
    print(f"✓ Generation time: {elapsed:.2f}ms")
    
    assert len(embedding) == 384, f"Expected 384 dimensions, got {len(embedding)}"
    assert all(isinstance(v, float) for v in embedding), "Embedding should contain floats"
    
    # Check that embedding is normalized (magnitude should be close to 1)
    magnitude = sum(v * v for v in embedding) ** 0.5
    print(f"✓ Embedding magnitude: {magnitude:.6f}")
    assert 0.99 <= magnitude <= 1.01, f"Embedding not normalized: magnitude={magnitude}"
    
    print("✓ Embedding generation test passed\n")


def test_semantic_text_construction():
    """Test semantic text construction from profile data"""
    print("Testing semantic text construction...")
    
    profile = {
        'role': 'Student',
        'headline': 'React Developer',
        'bio': 'Passionate about building web applications',
        'looking_for': ['cofounder', 'teammate'],
        'location': 'San Francisco'
    }
    
    skills = [
        {'skill_name': 'React'},
        {'skill_name': 'TypeScript'},
        {'skill_name': 'Node.js'}
    ]
    
    interests = [
        {'interest': 'Fintech'},
        {'interest': 'EdTech'}
    ]
    
    semantic_text = construct_semantic_text(profile, skills, interests)
    
    print(f"Generated semantic text:\n{semantic_text}\n")
    
    assert 'Role: Student' in semantic_text
    assert 'Headline: React Developer' in semantic_text
    assert 'React' in semantic_text
    assert 'Fintech' in semantic_text
    assert 'cofounder' in semantic_text
    
    print("✓ Semantic text construction test passed\n")


def test_empty_profile():
    """Test handling of empty profile data"""
    print("Testing empty profile handling...")
    
    profile = {}
    skills = []
    interests = []
    
    semantic_text = construct_semantic_text(profile, skills, interests)
    
    print(f"Generated semantic text for empty profile:\n{semantic_text}\n")
    
    # Should still generate valid text
    embedding = generator.generate_embedding(semantic_text)
    assert len(embedding) == 768
    
    print("✓ Empty profile handling test passed\n")


def run_all_tests():
    """Run all tests"""
    print("=" * 50)
    print("Running Embedding Generator Tests")
    print("=" * 50 + "\n")
    
    try:
        test_model_loading()
        test_embedding_generation()
        test_semantic_text_construction()
        test_empty_profile()
        
        print("=" * 50)
        print("✓ ALL TESTS PASSED")
        print("=" * 50)
        return True
    except AssertionError as e:
        print(f"\n✗ TEST FAILED: {e}")
        return False
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
