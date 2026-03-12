"""
Embedding Validator Module
Validates embedding quality before storage to prevent corrupted data
"""

import math
from typing import List, Tuple
from dataclasses import dataclass
from enum import Enum


class ValidationStatus(Enum):
    """Validation status enum"""
    VALID = "valid"
    INVALID_DIMENSION = "invalid_dimension"
    CONTAINS_NAN = "contains_nan"
    CONTAINS_INF = "contains_inf"
    NOT_NORMALIZED = "not_normalized"
    ALL_ZEROS = "all_zeros"


@dataclass
class ValidationResult:
    """Validation result dataclass"""
    is_valid: bool
    status: ValidationStatus
    message: str
    details: dict


class EmbeddingValidator:
    """Validates embedding quality before storage"""
    
    EXPECTED_DIMENSION = 384
    NORMALIZATION_TOLERANCE = 0.05
    MIN_MAGNITUDE = 1.0 - NORMALIZATION_TOLERANCE
    MAX_MAGNITUDE = 1.0 + NORMALIZATION_TOLERANCE
    
    @classmethod
    def validate(cls, embedding: List[float]) -> ValidationResult:
        """
        Validate embedding quality
        Returns ValidationResult with is_valid flag and details
        """
        if len(embedding) != cls.EXPECTED_DIMENSION:
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.INVALID_DIMENSION,
                message=f"Expected {cls.EXPECTED_DIMENSION} dimensions, got {len(embedding)}",
                details={"expected": cls.EXPECTED_DIMENSION, "actual": len(embedding)}
            )
        
        if any(math.isnan(v) for v in embedding):
            nan_count = sum(1 for v in embedding if math.isnan(v))
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.CONTAINS_NAN,
                message=f"Embedding contains {nan_count} NaN values",
                details={"nan_count": nan_count}
            )
        
        if any(math.isinf(v) for v in embedding):
            inf_count = sum(1 for v in embedding if math.isinf(v))
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.CONTAINS_INF,
                message=f"Embedding contains {inf_count} Infinity values",
                details={"inf_count": inf_count}
            )
        
        if all(v == 0 for v in embedding):
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.ALL_ZEROS,
                message="Embedding is all zeros",
                details={"magnitude": 0}
            )
        
        magnitude = math.sqrt(sum(v * v for v in embedding))
        if magnitude < cls.MIN_MAGNITUDE or magnitude > cls.MAX_MAGNITUDE:
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.NOT_NORMALIZED,
                message=f"Embedding magnitude {magnitude:.4f} outside acceptable range [{cls.MIN_MAGNITUDE:.4f}, {cls.MAX_MAGNITUDE:.4f}]",
                details={
                    "magnitude": magnitude,
                    "min_allowed": cls.MIN_MAGNITUDE,
                    "max_allowed": cls.MAX_MAGNITUDE
                }
            )
        
        return ValidationResult(
            is_valid=True,
            status=ValidationStatus.VALID,
            message="Embedding validation passed",
            details={
                "dimension": len(embedding),
                "magnitude": magnitude,
                "min_value": min(embedding),
                "max_value": max(embedding),
                "mean_value": sum(embedding) / len(embedding)
            }
        )
    
    @classmethod
    def normalize(cls, embedding: List[float]) -> List[float]:
        """Normalize embedding to unit vector"""
        magnitude = math.sqrt(sum(v * v for v in embedding))
        if magnitude == 0:
            return embedding
        return [v / magnitude for v in embedding]
    
    @classmethod
    def validate_and_fix(cls, embedding: List[float]) -> Tuple[List[float], ValidationResult]:
        """
        Validate embedding and attempt to fix minor issues
        Returns (fixed_embedding, validation_result)
        """
        result = cls.validate(embedding)
        
        if result.is_valid:
            return embedding, result
        
        if result.status == ValidationStatus.NOT_NORMALIZED:
            normalized = cls.normalize(embedding)
            new_result = cls.validate(normalized)
            if new_result.is_valid:
                return normalized, new_result
        
        return embedding, result
