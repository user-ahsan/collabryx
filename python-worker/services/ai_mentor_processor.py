"""
AI Mentor Processor Service
============================
Gemini-powered AI mentor for career and project guidance.

Tasks: 3.1.1 - 3.1.10 (TASKS.md)
Created: 2026-03-18
"""

import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from supabase import Client, create_client

# Gemini API import
try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("Google Gemini SDK not available")

logger = logging.getLogger(__name__)


class AIMentorProcessor:
    """
    Service for AI mentor processing with Gemini.

    Methods:
        generate_response: Generate AI mentor response
        summarize_session: Summarize completed session
        extract_action_items: Parse action items from response
        save_insight_to_profile: Save insights to user profile
    """

    def __init__(
        self, supabase_url: str, supabase_key: str, gemini_api_key: Optional[str] = None
    ):
        """
        Initialize AIMentorProcessor with Supabase and Gemini clients.

        Task: 3.1.2
        """
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.gemini_api_key = gemini_api_key
        self.model = None

        # Initialize Gemini
        if gemini_api_key and GEMINI_AVAILABLE:
            try:
                genai.configure(api_key=gemini_api_key)
                self.model = genai.GenerativeModel("gemini-pro")
                logger.info("Gemini model initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini: {str(e)}")

        # System prompt for mentor persona
        self.system_prompt = """
You are Collabryx AI Mentor, an expert career and project advisor.

Your role:
- Help users validate startup ideas
- Provide technical architecture guidance
- Suggest skill development paths
- Connect users with relevant resources
- Offer actionable, specific advice

Style:
- Encouraging but honest
- Action-oriented with concrete steps
- Reference user's profile context
- Keep responses concise (2-4 paragraphs max)
- Use bullet points for action items
"""

    async def generate_response(
        self, user_id: str, message: str, session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate AI mentor response with user context.

        Task: 3.1.4
        """
        try:
            # Get user profile context
            user_context = await self._get_user_context(user_id)

            # Build conversation history if session exists
            conversation_history = []
            if session_id:
                conversation_history = await self._get_session_history(session_id)

            # Build prompt with context
            prompt = self._build_prompt(message, user_context, conversation_history)

            # Generate response
            if self.model:
                response = await asyncio.to_thread(self.model.generate_content, prompt)
                response_text = response.text
            else:
                # Fallback response
                response_text = self._generate_fallback_response(message, user_context)

            # Extract action items
            action_items = self.extract_action_items(response_text)

            # Save to database
            saved_message = await self._save_message(
                session_id=session_id, user_id=user_id, role="user", content=message
            )

            saved_response = await self._save_message(
                session_id=session_id,
                user_id=user_id,
                role="assistant",
                content=response_text,
            )

            logger.info(f"Generated AI mentor response for user {user_id}")

            return {
                "response": response_text,
                "action_items": action_items,
                "session_id": session_id or saved_message.get("session_id"),
                "message_id": saved_response.get("id"),
                "suggested_next_steps": self._suggest_next_steps(
                    response_text, user_context
                ),
            }

        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            return {
                "response": "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
                "action_items": [],
                "error": str(e),
            }

    async def summarize_session(
        self, session_id: str, messages: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Summarize completed AI mentor session.

        Task: 3.1.5
        """
        try:
            # Get messages if not provided
            if not messages:
                messages = await self._get_session_history(session_id)

            if not messages or len(messages) < 2:
                return {
                    "summary": "Session too short to summarize",
                    "action_items": [],
                    "skills_identified": [],
                }

            # Build conversation text
            conversation_text = "\n".join(
                [
                    f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                    for m in messages[-10:]  # Last 10 messages
                ]
            )

            # Generate summary
            summary_prompt = f"""
Summarize this AI mentor session in 2-3 sentences:

{conversation_text}

Provide:
1. Brief summary of what was discussed
2. Top 3 action items (if any)
3. Skills mentioned that should be saved to profile

Format as JSON:
{{
  "summary": "...",
  "action_items": ["...", "..."],
  "skills": ["...", "..."]
}}
"""

            if self.model:
                summary_response = await asyncio.to_thread(
                    self.model.generate_content, summary_prompt
                )
                summary_text = summary_response.text
            else:
                summary_text = (
                    '{"summary": "Session completed", "action_items": [], "skills": []}'
                )

            # Parse JSON from response
            summary_data = self._parse_json_response(summary_text)

            # Update session with summary
            await asyncio.to_thread(
                self.supabase.table("ai_mentor_sessions")
                .update(
                    {
                        "status": "completed",
                        "summary": summary_data.get("summary", ""),
                        "action_items": summary_data.get("action_items", []),
                        "completed_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", session_id)
                .execute
            )

            # Save identified skills to profile
            if summary_data.get("skills"):
                await self._save_skills_to_profile(
                    messages[0]["user_id"], summary_data["skills"]
                )

            logger.info(f"Summarized session {session_id}")

            return {
                "session_id": session_id,
                "summary": summary_data.get("summary", ""),
                "action_items": summary_data.get("action_items", []),
                "skills_identified": summary_data.get("skills", []),
            }

        except Exception as e:
            logger.error(f"Error summarizing session: {str(e)}")
            return {
                "session_id": session_id,
                "summary": "Could not summarize session",
                "action_items": [],
                "error": str(e),
            }

    def extract_action_items(self, text: str) -> List[Dict[str, str]]:
        """
        Parse action items from AI response.

        Task: 3.1.6
        """
        try:
            action_items = []

            # Common action item patterns
            patterns = [
                r"(?:Action Item|Step|To-do|TODO)[:\s]+([^\n]+)",
                r"^[-•*]\s*(?:Action:|Step:|Do:)?\s*([^\n]+)",
                r"(?:You should|Consider|Try to|Next,)\s+([^\n]+)",
            ]

            for pattern in patterns:
                matches = re.finditer(pattern, text, re.MULTILINE | re.IGNORECASE)
                for match in matches:
                    action_text = match.group(1).strip()
                    if action_text and len(action_text) < 200:
                        action_items.append(
                            {
                                "task": action_text,
                                "priority": "medium",
                                "completed": False,
                            }
                        )

            # Limit to top 5
            return action_items[:5]

        except Exception as e:
            logger.error(f"Error extracting action items: {str(e)}")
            return []

    async def save_insight_to_profile(self, message_id: str) -> Dict[str, Any]:
        """
        Save user insights to profile.

        Task: 3.1.7
        """
        try:
            # Get message
            response = await asyncio.to_thread(
                self.supabase.table("ai_mentor_messages")
                .select("content, user_id, session_id")
                .eq("id", message_id)
                .single()
                .execute
            )

            if not response.data:
                return {"status": "not_found", "error": "Message not found"}

            message = response.data
            user_id = message["user_id"]
            content = message["content"]

            # Extract skills from message
            skills = self._extract_skills_from_text(content)

            # Save to user_skills
            saved_skills = []
            for skill_name in skills:
                result = await self._save_skill_to_user(user_id, skill_name)
                if result:
                    saved_skills.append(skill_name)

            logger.info(f"Saved {len(saved_skills)} skills to user {user_id} profile")

            return {
                "status": "success",
                "skills_saved": saved_skills,
                "message_id": message_id,
            }

        except Exception as e:
            logger.error(f"Error saving insight: {str(e)}")
            return {"status": "error", "error": str(e)}

    # Helper methods

    async def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """Get user profile context for personalization."""
        try:
            response = await asyncio.to_thread(
                self.supabase.table("profiles")
                .select(
                    "id, display_name, headline, bio, looking_for, skills, interests"
                )
                .eq("id", user_id)
                .single()
                .execute
            )

            return response.data or {}

        except Exception as e:
            logger.error(f"Error getting user context: {str(e)}")
            return {}

    async def _get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for session."""
        try:
            response = await asyncio.to_thread(
                self.supabase.table("ai_mentor_messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .limit(20)
                .execute
            )

            return response.data or []

        except Exception as e:
            logger.error(f"Error getting session history: {str(e)}")
            return []

    def _build_prompt(
        self, message: str, user_context: Dict, conversation_history: List[Dict]
    ) -> str:
        """Build complete prompt with context."""
        context_text = f"""
User Profile:
- Name: {user_context.get("display_name", "User")}
- Headline: {user_context.get("headline", "Not specified")}
- Looking for: {user_context.get("looking_for", "Not specified")}
- Skills: {", ".join(user_context.get("skills", [])) or "Not specified"}
- Interests: {", ".join(user_context.get("interests", [])) or "Not specified"}
"""

        history_text = ""
        if conversation_history:
            history_text = "\nConversation History:\n" + "\n".join(
                [
                    f"{'User' if m['role'] == 'user' else 'Assistant'}: {m['content']}"
                    for m in conversation_history[-6:]  # Last 6 messages
                ]
            )

        return (
            f"{self.system_prompt}\n\n{context_text}\n{history_text}\n\nUser: {message}"
        )

    def _generate_fallback_response(self, message: str, user_context: Dict) -> str:
        """Generate response when Gemini is unavailable."""
        return f"""Thank you for your message! I'm here to help with your career and project goals.

Based on your profile ({user_context.get("headline", "your background")}), here are some general suggestions:

• Consider reaching out to potential collaborators in your network
• Continue developing your skills in areas you're interested in
• Validate your ideas by talking to potential users

For more personalized advice, please check back when our AI service is fully operational."""

    def _suggest_next_steps(self, response: str, user_context: Dict) -> List[str]:
        """Suggest next steps based on response."""
        suggestions = []

        if "cofounder" in response.lower() or "team" in response.lower():
            suggestions.append("Browse matches to find potential cofounders")

        if "skill" in response.lower() or "learn" in response.lower():
            suggestions.append(
                "Update your profile with new skills you want to develop"
            )

        if "validate" in response.lower() or "idea" in response.lower():
            suggestions.append("Create a post to gather feedback on your idea")

        return suggestions[:3]

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Parse JSON from AI response."""
        try:
            # Extract JSON from text
            json_match = re.search(r"\{[^}]+\}", text, re.DOTALL)
            if json_match:
                import json

                return json.loads(json_match.group())
        except Exception as e:
            logger.debug(f"Could not parse JSON: {str(e)}")

        return {"summary": text[:200], "action_items": [], "skills": []}

    def _extract_skills_from_text(self, text: str) -> List[str]:
        """Extract skill names from text."""
        # Common tech skills to look for
        skill_keywords = [
            "python",
            "javascript",
            "react",
            "node",
            "typescript",
            "aws",
            "docker",
            "kubernetes",
            "machine learning",
            "ai",
            "frontend",
            "backend",
            "fullstack",
            "mobile",
            "ios",
            "android",
        ]

        text_lower = text.lower()
        found_skills = [skill for skill in skill_keywords if skill in text_lower]

        return list(set(found_skills))

    async def _save_message(
        self, session_id: Optional[str], user_id: str, role: str, content: str
    ) -> Dict[str, Any]:
        """Save message to database."""
        try:
            # Create or get session
            if not session_id:
                session_response = await asyncio.to_thread(
                    self.supabase.table("ai_mentor_sessions")
                    .insert(
                        {
                            "user_id": user_id,
                            "status": "active",
                            "started_at": datetime.now().isoformat(),
                        }
                    )
                    .execute
                )
                session_id = (
                    session_response.data[0]["id"] if session_response.data else None
                )

            # Save message
            message_response = await asyncio.to_thread(
                self.supabase.table("ai_mentor_messages")
                .insert(
                    {
                        "session_id": session_id,
                        "user_id": user_id,
                        "role": role,
                        "content": content,
                        "created_at": datetime.now().isoformat(),
                    }
                )
                .execute
            )

            return {
                "id": message_response.data[0]["id"] if message_response.data else None,
                "session_id": session_id,
            }

        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            return {}

    async def _save_skills_to_user(self, user_id: str, skills: List[str]):
        """Save skills to user profile."""
        for skill_name in skills:
            await self._save_skill_to_user(user_id, skill_name)

    async def _save_skill_to_user(self, user_id: str, skill_name: str) -> Optional[str]:
        """Save single skill to user."""
        try:
            # Get or create skill
            skill_response = await asyncio.to_thread(
                self.supabase.table("skills")
                .select("id")
                .ilike("name", skill_name)
                .limit(1)
                .execute
            )

            skill_id = None
            if skill_response.data:
                skill_id = skill_response.data[0]["id"]
            else:
                # Create skill
                create_response = await asyncio.to_thread(
                    self.supabase.table("skills")
                    .insert({"name": skill_name, "category": "technology"})
                    .execute
                )
                skill_id = (
                    create_response.data[0]["id"] if create_response.data else None
                )

            if skill_id:
                # Link to user
                await asyncio.to_thread(
                    self.supabase.table("user_skills")
                    .insert(
                        {
                            "user_id": user_id,
                            "skill_id": skill_id,
                            "proficiency_level": "intermediate",
                        }
                    )
                    .execute
                )

            return skill_id

        except Exception as e:
            logger.debug(f"Could not save skill {skill_name}: {str(e)}")
            return None


async def main():
    """Test the AIMentorProcessor service."""
    import os

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials")
        return

    processor = AIMentorProcessor(supabase_url, supabase_key, gemini_key)
    logger.info("AIMentorProcessor initialized successfully")
    logger.info("AIMentorProcessor service ready")


if __name__ == "__main__":
    asyncio.run(main())
