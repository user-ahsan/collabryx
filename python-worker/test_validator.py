"""
Test script for embedding validator
Tests all validation scenarios
"""

import math
from embedding_validator import EmbeddingValidator, ValidationStatus


def test_valid_embedding():
    """Test a valid normalized embedding"""
    print("Test 1: Valid embedding")
    embedding = [1.0 / math.sqrt(384)] * 384
    result = EmbeddingValidator.validate(embedding)
    assert result.is_valid, f"Expected valid, got: {result.message}"
    assert result.status == ValidationStatus.VALID
    print(f"✓ Passed: {result.message}")
    print(f"  Details: {result.details}")


def test_invalid_dimension():
    """Test embedding with wrong dimension"""
    print("\nTest 2: Invalid dimension")
    embedding = [0.5] * 256
    result = EmbeddingValidator.validate(embedding)
    assert not result.is_valid, "Expected invalid"
    assert result.status == ValidationStatus.INVALID_DIMENSION
    print(f"✓ Passed: {result.message}")


def test_nan_values():
    """Test embedding with NaN values"""
    print("\nTest 3: NaN values")
    embedding = [0.5] * 384
    embedding[10] = float('nan')
    result = EmbeddingValidator.validate(embedding)
    assert not result.is_valid, "Expected invalid"
    assert result.status == ValidationStatus.CONTAINS_NAN
    print(f"✓ Passed: {result.message}")


def test_infinity_values():
    """Test embedding with Infinity values"""
    print("\nTest 4: Infinity values")
    embedding = [0.5] * 384
    embedding[20] = float('inf')
    result = EmbeddingValidator.validate(embedding)
    assert not result.is_valid, "Expected invalid"
    assert result.status == ValidationStatus.CONTAINS_INF
    print(f"✓ Passed: {result.message}")


def test_all_zeros():
    """Test embedding with all zeros"""
    print("\nTest 5: All zeros")
    embedding = [0.0] * 384
    result = EmbeddingValidator.validate(embedding)
    assert not result.is_valid, "Expected invalid"
    assert result.status == ValidationStatus.ALL_ZEROS
    print(f"✓ Passed: {result.message}")


def test_not_normalized():
    """Test embedding that is not normalized"""
    print("\nTest 6: Not normalized")
    embedding = [0.5] * 384
    result = EmbeddingValidator.validate(embedding)
    assert not result.is_valid, "Expected invalid"
    assert result.status == ValidationStatus.NOT_NORMALIZED
    print(f"✓ Passed: {result.message}")
    print(f"  Magnitude: {result.details.get('magnitude', 'N/A')}")


def test_normalize_fix():
    """Test auto-fix normalization"""
    print("\nTest 7: Normalize auto-fix")
    embedding = [0.5] * 384
    fixed, result = EmbeddingValidator.validate_and_fix(embedding)
    assert result.is_valid, f"Expected valid after fix, got: {result.message}"
    print(f"✓ Passed: Normalization fixed successfully")
    print(f"  Original magnitude: {math.sqrt(sum(v * v for v in embedding)):.4f}")
    print(f"  Fixed magnitude: {result.details.get('magnitude', 'N/A'):.4f}")


def test_cannot_fix():
    """Test that invalid embeddings cannot be fixed"""
    print("\nTest 8: Cannot fix invalid embedding")
    embedding = [float('nan')] + [0.5] * 383
    fixed, result = EmbeddingValidator.validate_and_fix(embedding)
    assert not result.is_valid, "Expected invalid (cannot fix NaN)"
    assert result.status == ValidationStatus.CONTAINS_NAN
    print(f"✓ Passed: Correctly rejected unfixable embedding")


def test_edge_cases():
    """Test edge cases"""
    print("\nTest 9: Edge cases")
    
    # Test with very small values
    embedding = [1e-10] * 384
    result = EmbeddingValidator.validate(embedding)
    print(f"  Very small values: {result.status.value}")
    
    # Test with mixed positive/negative
    embedding = [(1.0 if i % 2 == 0 else -1.0) / math.sqrt(384) for i in range(384)]
    result = EmbeddingValidator.validate(embedding)
    assert result.is_valid, f"Expected valid, got: {result.message}"
    print(f"  Mixed positive/negative: ✓ Valid")


if __name__ == "__main__":
    print("=" * 60)
    print("Embedding Validator Tests")
    print("=" * 60)
    
    try:
        test_valid_embedding()
        test_invalid_dimension()
        test_nan_values()
        test_infinity_values()
        test_all_zeros()
        test_not_normalized()
        test_normalize_fix()
        test_cannot_fix()
        test_edge_cases()
        
        print("\n" + "=" * 60)
        print("All tests passed! ✓")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n✗ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        exit(1)
