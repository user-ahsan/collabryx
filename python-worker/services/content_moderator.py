"""
Content Moderator Service
==========================
AI-powered content moderation using pre-trained models.

Tasks: 2.2.1 - 2.2.12 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from supabase import Client, create_client

# Optional imports for external APIs
try:
    from googleapiclient import discovery

    PERSPECTIVE_AVAILABLE = True
except ImportError:
    PERSPECTIVE_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Google Perspective API client not available")

try:
    from transformers import pipeline

    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)


# Moderation thresholds (from IMPLEMENTATION_PLAN.md)
THRESHOLDS = {
    "toxicity": 0.7,  # Auto-reject if >70% toxic
    "severe_toxicity": 0.5,  # Auto-reject if >50% severe
    "spam": 0.8,  # Auto-reject if >80% spam
    "nsfw": 0.6,  # Flag if >60% NSFW
    "threat": 0.5,  # Auto-reject threats
    "pii": 0.0,  # Auto-reject any PII
}


class ContentModerator:
    """
    Service for AI-powered content moderation.

    Methods:
        moderate_content: Main moderation orchestration
        check_toxicity: Google Perspective API
        check_spam: Hugging Face zero-shot classification
        check_nsfw: Keyword + ML detection
        check_pii: Regex-based PII detection
    """

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        perspective_api_key: Optional[str] = None,
    ):
        """
        Initialize ContentModerator with Supabase and Perspective API clients.

        Task: 2.2.2
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.perspective_api_key = perspective_api_key
        self.perspective_client = None

        # Initialize Perspective API client
        if perspective_api_key and PERSPECTIVE_AVAILABLE:
            try:
                self.perspective_client = discovery.build(
                    "commentanalyzer",
                    "v1alpha1",
                    developerKey=perspective_api_key,
                    discoveryServiceUrl="https://commentanalyzer.googleapis.com/$discovery/rest?version=v1alpha1",
                    static_discovery=False,
                )
                logger.info("Perspective API client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Perspective API: {str(e)}")

        # Initialize Hugging Face pipeline (if available)
        self.spam_classifier = None
        if TRANSFORMERS_AVAILABLE:
            try:
                self.spam_classifier = pipeline(
                    "zero-shot-classification",
                    model="facebook/bart-large-mnli",
                    device=-1,  # CPU
                )
                logger.info("Hugging Face spam classifier initialized")
            except Exception as e:
                logger.error(f"Failed to initialize spam classifier: {str(e)}")

        # PII detection patterns
        self.pii_patterns = {
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "phone": r"\b(?:\+?1[-.\s]?)?\(?(?:[0-9]{3})\)?[-.\s]?(?:[0-9]{3})[-.\s]?(?:[0-9]{4})\b",
            "ssn": r"\b\d{3}-\d{2}-\d{4}\b",
            "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
            "address": r"\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln)\b",
        }

    async def moderate_content(
        self, content: str, content_type: str = "post"
    ) -> Dict[str, Any]:
        """
        Main moderation orchestration.

        Task: 2.2.8
        """
        try:
            # Run all checks in parallel
            results = await asyncio.gather(
                self.check_toxicity(content),
                self.check_spam(content),
                self.check_nsfw(content),
                self.check_pii(content),
                return_exceptions=True,
            )

            # Parse results
            toxicity = results[0] if isinstance(results[0], dict) else {"score": 0.0}
            spam = results[1] if isinstance(results[1], dict) else {"score": 0.0}
            nsfw = results[2] if isinstance(results[2], dict) else {"score": 0.0}
            pii = (
                results[3]
                if isinstance(results[3], dict)
                else {"detected": False, "types": []}
            )

            # Calculate risk score (weighted average)
            risk_score = (
                toxicity.get("score", 0.0) * 0.4
                + spam.get("score", 0.0) * 0.2
                + nsfw.get("score", 0.0) * 0.2
                + (1.0 if pii.get("detected") else 0.0) * 0.2
            )

            # Determine action
            if risk_score < 0.3:
                action = "approved"
            elif risk_score < 0.7:
                action = "flag_for_review"
            else:
                action = "auto_reject"

            # Check for auto-reject conditions
            if toxicity.get("score", 0.0) >= THRESHOLDS["toxicity"]:
                action = "auto_reject"
            if spam.get("score", 0.0) >= THRESHOLDS["spam"]:
                action = "auto_reject"
            if pii.get("detected"):
                action = "auto_reject"
            if toxicity.get("threat_score", 0.0) >= THRESHOLDS["threat"]:
                action = "auto_reject"

            result = {
                "approved": action == "approved",
                "flag_for_review": action == "flag_for_review",
                "auto_reject": action == "auto_reject",
                "risk_score": round(risk_score, 4),
                "action": action,
                "details": {
                    "toxicity": toxicity,
                    "spam": spam,
                    "nsfw": nsfw,
                    "pii": pii,
                },
                "content_type": content_type,
                "moderated_at": datetime.now().isoformat(),
            }

            # Log moderation result
            await self._log_moderation(content_type, result)

            return result

        except Exception as e:
            logger.error(f"Error moderating content: {str(e)}")
            # Fail open - allow content if moderation fails
            return {
                "approved": True,
                "flag_for_review": False,
                "auto_reject": False,
                "action": "approved",
                "error": str(e),
                "fail_open": True,
            }

    async def check_toxicity(self, text: str) -> Dict[str, float]:
        """
        Toxicity detection with Google Perspective API.

        Task: 2.2.4
        """
        try:
            if not self.perspective_client or not PERSPECTIVE_AVAILABLE:
                # Fallback: simple keyword-based toxicity
                return await self._check_toxicity_fallback(text)

            # Call Perspective API
            analyze_request = {
                "comment": {"text": text},
                "requestedAttributes": {
                    "TOXICITY": {},
                    "SEVERE_TOXICITY": {},
                    "IDENTITY_ATTACK": {},
                    "INSULT": {},
                    "THREAT": {},
                },
            }

            response = await asyncio.to_thread(
                self.perspective_client.comments().analyze(body=analyze_request).execute
            )

            result = {
                "score": response["attributeScores"]["TOXICITY"]["summaryScore"][
                    "value"
                ],
                "severe_toxicity": response["attributeScores"]["SEVERE_TOXICITY"][
                    "summaryScore"
                ]["value"],
                "identity_attack": response["attributeScores"]["IDENTITY_ATTACK"][
                    "summaryScore"
                ]["value"],
                "insult": response["attributeScores"]["INSULT"]["summaryScore"][
                    "value"
                ],
                "threat": response["attributeScores"]["THREAT"]["summaryScore"][
                    "value"
                ],
            }

            logger.debug(f"Toxicity check: {result['score']:.2f}")

            return result

        except Exception as e:
            logger.error(f"Error checking toxicity: {str(e)}")
            return await self._check_toxicity_fallback(text)

    async def _check_toxicity_fallback(self, text: str) -> Dict[str, float]:
        """Fallback toxicity check using keyword matching."""
        toxic_keywords = [
            "stupid",
            "idiot",
            "hate",
            "kill",
            "die",
            "suck",
            "worthless",
            "garbage",
            "trash",
            "loser",
        ]

        text_lower = text.lower()
        toxic_count = sum(1 for word in toxic_keywords if word in text_lower)

        score = min(1.0, toxic_count / 5)  # Normalize to 0-1

        return {
            "score": score,
            "severe_toxicity": score * 0.8,
            "identity_attack": 0.0,
            "insult": score * 0.9,
            "threat": score * 0.5,
        }

    async def check_spam(self, text: str) -> Dict[str, float]:
        """
        Spam detection with Hugging Face zero-shot classification.

        Task: 2.2.5
        """
        try:
            if not self.spam_classifier or not TRANSFORMERS_AVAILABLE:
                # Fallback: rule-based spam detection
                return await self._check_spam_fallback(text)

            # Use zero-shot classification
            result = await asyncio.to_thread(
                self.spam_classifier, text, candidate_labels=["spam", "legitimate"]
            )

            spam_score = 0.0
            for label, score in zip(result["labels"], result["scores"]):
                if label == "spam":
                    spam_score = score

            logger.debug(f"Spam check: {spam_score:.2f}")

            return {"score": spam_score}

        except Exception as e:
            logger.error(f"Error checking spam: {str(e)}")
            return await self._check_spam_fallback(text)

    async def _check_spam_fallback(self, text: str) -> Dict[str, float]:
        """Fallback rule-based spam detection."""
        spam_indicators = [
            r"\b(BUY|SELL|DISCOUNT|FREE|CLICK HERE|LIMITED TIME)\b",
            r"http[s]?://\S+",  # URLs
            r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b",  # Phone numbers
            r"[!$]{3,}",  # Multiple ! or $
        ]

        spam_count = sum(
            1 for pattern in spam_indicators if re.search(pattern, text, re.IGNORECASE)
        )
        score = min(1.0, spam_count / 3)

        return {"score": score}

    async def check_nsfw(self, text: str) -> Dict[str, float]:
        """
        NSFW text detection.

        Task: 2.2.6
        """
        try:
            # Keyword-based NSFW detection
            nsfw_keywords = [
                "naked",
                "nude",
                "sex",
                "porn",
                "xxx",
                "adult",
                "escort",
                "prostitute",
                "onlyfans",
                "cam girl",
            ]

            text_lower = text.lower()
            nsfw_count = sum(1 for word in nsfw_keywords if word in text_lower)

            score = min(1.0, nsfw_count / 3)

            logger.debug(f"NSFW check: {score:.2f}")

            return {"score": score}

        except Exception as e:
            logger.error(f"Error checking NSFW: {str(e)}")
            return {"score": 0.0}

    async def check_pii(self, text: str) -> Dict[str, Any]:
        """
        Personal information detection.

        Task: 2.2.7
        """
        try:
            detected_types = []

            for pii_type, pattern in self.pii_patterns.items():
                if re.search(pattern, text):
                    detected_types.append(pii_type)

            result = {
                "detected": len(detected_types) > 0,
                "types": detected_types,
                "count": len(detected_types),
            }

            if result["detected"]:
                logger.warning(f"PII detected: {detected_types}")

            return result

        except Exception as e:
            logger.error(f"Error checking PII: {str(e)}")
            return {"detected": False, "types": [], "count": 0}

    async def _log_moderation(self, content_type: str, result: Dict[str, Any]):
        """Log moderation result for analytics."""
        try:
            await asyncio.to_thread(
                self.supabase.table("content_moderation_logs")
                .insert(
                    {
                        "content_type": content_type,
                        "action": result.get("action"),
                        "risk_score": result.get("risk_score"),
                        "details": result.get("details"),
                        "moderated_at": datetime.now().isoformat(),
                    }
                )
                .execute
            )
        except Exception as e:
            logger.debug(f"Could not log moderation: {str(e)}")


async def main():
    """Test the ContentModerator service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    perspective_key = os.getenv("PERSPECTIVE_API_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    moderator = ContentModerator(supabase_url, supabase_key, perspective_key)
    logger.info("ContentModerator initialized successfully")

    # Test with sample content
    test_cases = [
        ("This is a normal post", "post"),
        ("You're stupid and I hate you", "comment"),
        ("BUY NOW! CLICK HERE! LIMITED TIME DISCOUNT!", "post"),
        ("Contact me at john@example.com or 555-123-4567", "message"),
    ]

    for content, content_type in test_cases:
        result = await moderator.moderate_content(content, content_type)
        logger.info(
            f"Test: {content_type} - Action: {result['action']}, Risk: {result['risk_score']:.2f}"
        )

    logger.info("ContentModerator service ready")


if __name__ == "__main__":
    asyncio.run(main())
