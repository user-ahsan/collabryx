"""
Matches Seeder
Creates match suggestions using Supabase REST API
Also creates corresponding match scores for each suggestion
"""

import random
import time
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class MatchesSeeder(BaseSeeder):
    """Seeder for match suggestions with incremental seeding and match_scores"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_matches = set()
        # Pre-fetched data for match_score computation
        self._skills_map: Dict[str, List[str]] = {}
        self._interests_map: Dict[str, List[str]] = {}

    # =========================================================================
    # DATA FETCHING - skills & interests for match_score computation
    # =========================================================================

    def fetch_user_skills_map(self) -> Dict[str, List[str]]:
        """Fetch all user_skills grouped by user_id"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/user_skills?select=user_id,skill_name",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            rows = response.json() or []
            skills_map: Dict[str, List[str]] = {}
            for row in rows:
                uid = row["user_id"]
                if uid not in skills_map:
                    skills_map[uid] = []
                skills_map[uid].append(row["skill_name"])
            print(
                f"{Fore.YELLOW}  → Loaded skills for {len(skills_map)} users{Style.RESET_ALL}"
            )
            return skills_map
        except Exception as e:
            print(
                f"{Fore.YELLOW}  ⚠️ Failed to fetch skills map: {e}{Style.RESET_ALL}"
            )
            return {}

    def fetch_user_interests_map(self) -> Dict[str, List[str]]:
        """Fetch all user_interests grouped by user_id"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/user_interests?select=user_id,interest",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            rows = response.json() or []
            interests_map: Dict[str, List[str]] = {}
            for row in rows:
                uid = row["user_id"]
                if uid not in interests_map:
                    interests_map[uid] = []
                interests_map[uid].append(row["interest"])
            print(
                f"{Fore.YELLOW}  → Loaded interests for {len(interests_map)} users{Style.RESET_ALL}"
            )
            return interests_map
        except Exception as e:
            print(
                f"{Fore.YELLOW}  ⚠️ Failed to fetch interests map: {e}{Style.RESET_ALL}"
            )
            return {}

    # =========================================================================
    # MATCH SCORE CREATION
    # =========================================================================

    def create_match_score(
        self,
        suggestion_id: str,
        user_id: str,
        matched_user_id: str,
        match_percentage: int,
    ) -> Optional[str]:
        """
        Create a match_score for a given match_suggestion.

        Computes plausible score breakdown from the match_percentage and
        real intersecting skill/interest data from the database.
        """
        # Build overlapping skills from real data
        user_skills = self._skills_map.get(user_id, [])
        matched_skills = self._skills_map.get(matched_user_id, [])
        overlapping_skills = list(set(user_skills) & set(matched_skills))

        # Build complementary explanation using unique skills
        unique_user_skills = [s for s in user_skills if s not in matched_skills]
        unique_matched_skills = [s for s in matched_skills if s not in user_skills]
        complementary_skills = (unique_user_skills + unique_matched_skills)[:5]

        # Build shared interest tags
        user_interests = self._interests_map.get(user_id, [])
        matched_interests = self._interests_map.get(matched_user_id, [])
        shared_interest_tags = list(set(user_interests) & set(matched_interests))

        # Derive sub-scores from match_percentage with jitter
        base = match_percentage / 100.0
        skills_overlap_raw = len(overlapping_skills)

        skills_overlap_score = min(
            100, skills_overlap_raw * 25
        )  # Each overlapping skill ≈ 25 pts
        complementary_score = min(
            100, len(complementary_skills) * 20
        )  # Each complementary skill ≈ 20 pts
        shared_interest_score = min(
            100, len(shared_interest_tags) * 25
        )  # Each shared interest ≈ 25 pts
        semantic_similarity = base + random.uniform(-0.1, 0.1)
        semantic_similarity = max(0.0, min(1.0, semantic_similarity))
        activity_match = base + random.uniform(-0.15, 0.15)
        activity_match = max(0.0, min(1.0, activity_match))

        # overall_score should be correlated with match_percentage
        overall_score = base + random.uniform(-0.1, 0.1)
        overall_score = max(0.3, min(0.95, overall_score))

        # Generate insight strings
        insights_list = []
        if overlapping_skills:
            skill_list = ", ".join(overlapping_skills[:3])
            insights_list.append(
                f"Strong skill overlap in {skill_list}"
            )
        if complementary_skills:
            comp_list = ", ".join(complementary_skills[:2])
            insights_list.append(
                f"Complementary skills: {comp_list}"
            )
        if shared_interest_tags:
            interest_list = ", ".join(shared_interest_tags[:2])
            insights_list.append(
                f"Shared interests: {interest_list}"
            )

        if not insights_list:
            insights_list.append(
                "General compatibility based on profile analysis"
            )

        # Build complementary explanation text
        explanation_parts = []
        if overlapping_skills:
            explanation_parts.append(
                f"Both skilled in {', '.join(overlapping_skills[:3])}"
            )
        if shared_interest_tags:
            explanation_parts.append(
                f"Share interest in {', '.join(shared_interest_tags[:2])}"
            )
        complementary_explanation = (
            "; ".join(explanation_parts)
            if explanation_parts
            else "Potential for collaboration"
        )

        score_data = {
            "suggestion_id": suggestion_id,
            "semantic_similarity": round(semantic_similarity, 4),
            "skills_overlap": min(100, skills_overlap_score),
            "complementary_score": complementary_score,
            "shared_interests": shared_interest_score,
            "activity_match": round(activity_match, 4),
            "overall_score": round(overall_score, 4),
            "model_version": "rule-based-v1",
            "model_config": {
                "weights": {
                    "semantic_similarity": 0.35,
                    "skills_overlap": 0.30,
                    "complementary_score": 0.15,
                    "shared_interests": 0.10,
                    "activity_match": 0.10,
                },
                "version": "v1",
            },
            "overlapping_skills": overlapping_skills
            if overlapping_skills
            else [],
            "complementary_explanation": complementary_explanation,
            "shared_interest_tags": shared_interest_tags
            if shared_interest_tags
            else [],
            "insights": insights_list,
        }

        return self.create_single("match_scores", score_data)

    # =========================================================================
    # EXISTING MATCH LOGIC
    # =========================================================================

    def fetch_existing_matches(self):
        """Fetch existing match suggestions for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/match_suggestions?select=id,user_id,matched_user_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            matches = response.json() or []
            self.existing_matches = {
                f"{m['user_id']}:{m['matched_user_id']}" for m in matches
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_matches)} existing matches{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch existing matches: {e}{Style.RESET_ALL}")

    def match_exists(self, user_id: str, matched_user_id: str) -> bool:
        """Check if match already exists (either direction)"""
        match_key = f"{user_id}:{matched_user_id}"
        reverse_key = f"{matched_user_id}:{user_id}"
        return (
            match_key in self.existing_matches
            or reverse_key in self.existing_matches
        )

    # =========================================================================
    # CORE LOGIC
    # =========================================================================

    def create_match_suggestion(
        self,
        user_id: str,
        matched_user_id: str,
        match_percentage: int,
        reasons: List[Dict] = None,
    ) -> bool:
        """
        Create a match suggestion and its corresponding match_score.

        Returns True if both the suggestion and (optionally) its score were created.
        """
        # Check for duplicate (either direction)
        if self.match_exists(user_id, matched_user_id):
            self.stats["skipped"] += 1
            return False

        if reasons is None:
            reasons = [
                {"type": "skill", "label": "Complementary Skills"},
                {
                    "type": "interest",
                    "label": f"Shared Interest: {random.choice(['Startups', 'AI/ML', 'Open Source'])}",
                },
            ]

        suggestion = {
            "user_id": user_id,
            "matched_user_id": matched_user_id,
            "match_percentage": match_percentage,
            "reasons": reasons,
            "ai_confidence": random.uniform(0.7, 0.95),
            "ai_explanation": "Strong match based on complementary skills and shared interests.",
            "status": "active",
        }

        result = self.create_single("match_suggestions", suggestion)
        if result:
            self.existing_matches.add(f"{user_id}:{matched_user_id}")
            self.stats["created"] += 1

            # Create corresponding match_score (best-effort, non-blocking)
            score_id = self.create_match_score(
                suggestion_id=result,
                user_id=user_id,
                matched_user_id=matched_user_id,
                match_percentage=match_percentage,
            )
            if not score_id:
                # Score creation failure doesn't fail the suggestion
                print(
                    f"{Fore.YELLOW}  ⚠️ Match score not created for suggestion {result}{Style.RESET_ALL}"
                )

        return result is not None

    # =========================================================================
    # MAIN SEED METHOD
    # =========================================================================

    def seed(self, limit_per_user: int = None) -> Dict[str, int]:
        """Seed match suggestions (and match_scores) incrementally"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit_per_user is None:
            limit_per_user = (
                int(config.LIMIT_MATCHES_PER_USER)
                if config.LIMIT_MATCHES_PER_USER != "-1"
                else 5
            )

        # Fetch existing matches for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing matches for duplicate checking...{Style.RESET_ALL}"
        )
        self.fetch_existing_matches()

        # Pre-fetch skills & interests for match_score computation
        print(
            f"{Fore.YELLOW}⏳ Loading user skills and interests for match scoring...{Style.RESET_ALL}"
        )
        self._skills_map = self.fetch_user_skills_map()
        self._interests_map = self.fetch_user_interests_map()

        # Show current database status
        existing_matches = len(self.existing_matches)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🎯 Existing Matches: {Fore.GREEN}{existing_matches:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Adding {limit_per_user} matches per user (Incremental Mode)...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING MATCH SUGGESTIONS ({limit_per_user} per user){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        # Limit to first 50 users to avoid too many suggestions
        for i, user_id in enumerate(user_ids[:50]):
            potential_matches = [u for u in user_ids if u != user_id]
            matches = random.sample(
                potential_matches, min(limit_per_user, len(potential_matches))
            )

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] Seeding matches...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            for matched_user in matches:
                match_percentage = random.randint(60, 95)
                self.create_match_suggestion(
                    user_id, matched_user, match_percentage
                )

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] ✓ {self.stats['created']} created{Style.RESET_ALL}    ",
                end="",
                flush=True,
            )

            if self.stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ MATCHES SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}")
        print(f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}")
        print(f"  Failed:      {Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}")
        print(
            f"  Total:       {Fore.CYAN}{sum(self.stats.values()):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = MatchesSeeder(http)
        seeder.seed(limit_per_user=3)
