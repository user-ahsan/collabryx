"""
Posts Seeder
Creates posts, comments, and reactions using Supabase REST API
Inherits from BaseSeeder for common utilities
"""

import random
import time
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder
from data_generators.posts import generate_post, generate_comment, generate_reaction


class PostsSeeder(BaseSeeder):
    """Seeder for posts, comments, and reactions"""

    def __init__(self, http_client):
        super().__init__(http_client)

    def create_post(self, author_id: str, post_data: Dict[str, Any]) -> Optional[str]:
        """Create a single post"""
        post = {
            "author_id": author_id,
            "content": post_data["content"],
            "post_type": post_data["post_type"],
            "intent": post_data.get("intent"),
            "link_url": post_data.get("link_url"),
            "is_pinned": False,
            "is_archived": False,
            "reaction_count": 0,
            "comment_count": 0,
            "share_count": 0,
        }

        return self.create_single("posts", post)

    def create_comment(
        self, post_id: str, author_id: str, content: str, parent_id: str = None
    ) -> Optional[str]:
        """Create a comment on a post"""
        comment = {
            "post_id": post_id,
            "author_id": author_id,
            "content": content,
            "parent_id": parent_id,
            "like_count": 0,
        }

        comment_id = self.create_single("comments", comment)

        if comment_id:
            # Increment post comment count
            self._increment_count("posts", post_id, "comment_count")

        return comment_id

    def create_reaction(self, post_id: str, user_id: str, emoji: str = None) -> bool:
        """Create a reaction on a post"""
        if emoji is None:
            emoji = generate_reaction()

        reaction = {"post_id": post_id, "user_id": user_id, "emoji": emoji}

        result = self.create_single("post_reactions", reaction)

        if result:
            self._increment_count("posts", post_id, "reaction_count")
            return True

        return False

    def _increment_count(self, table: str, record_id: str, field: str):
        """Increment a count field via REST API"""
        try:
            # Get current count
            get_response = self.http.get(
                f"{config.SUPABASE_REST_URL}/{table}?{field}=gt.-1&id=eq.{record_id}",
                headers=config.API_HEADERS,
            )
            get_response.raise_for_status()
            result = get_response.json()

            if result and len(result) > 0:
                current_count = result[0].get(field, 0)

                # Update with incremented count
                self.http.patch(
                    f"{config.SUPABASE_REST_URL}/{table}?id=eq.{record_id}",
                    json={field: current_count + 1},
                    headers=config.API_HEADERS,
                )
        except:
            pass  # Ignore errors for count updates

    def seed(self, limit: int = None) -> Dict[str, int]:
        """Seed posts with comments and reactions"""

        if limit is None:
            limit = int(config.LIMIT_POSTS) if config.LIMIT_POSTS != "-1" else 300

        comments_range = self.parse_limit_range(config.LIMIT_COMMENTS_PER_POST)
        reactions_range = self.parse_limit_range(config.LIMIT_REACTIONS_PER_POST)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {limit} POSTS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs for authors
        user_ids = self.fetch_user_ids()

        if not user_ids:
            print(f"{Fore.RED}✗ No users found. Seed profiles first.{Style.RESET_ALL}")
            return {"created": 0, "skipped": 0, "failed": 0}

        stats = {"created": 0, "comments": 0, "reactions": 0, "failed": 0}

        for i in range(limit):
            # Pick random author
            author_id = random.choice(user_ids)

            # Generate post
            post_data = generate_post()
            post_id = self.create_post(author_id, post_data)

            if post_id:
                stats["created"] += 1

                # Add comments
                num_comments = random.randint(*comments_range)
                for _ in range(num_comments):
                    comment_author = random.choice(user_ids)
                    comment_content = generate_comment()
                    comment_id = self.create_comment(
                        post_id, comment_author, comment_content
                    )

                    if comment_id:
                        stats["comments"] += 1

                        # Some comments get replies (30% chance)
                        if random.random() < 0.3:
                            reply_author = random.choice(
                                [u for u in user_ids if u != comment_author]
                            )
                            reply_content = generate_comment()
                            self.create_comment(
                                post_id,
                                reply_author,
                                reply_content,
                                parent_id=comment_id,
                            )
                            stats["comments"] += 1

                # Add reactions
                num_reactions = random.randint(*reactions_range)
                reacting_users = random.sample(
                    user_ids, min(num_reactions, len(user_ids))
                )

                for reacting_user in reacting_users:
                    if self.create_reaction(post_id, reacting_user):
                        stats["reactions"] += 1

            # Progress logging
            self.log_progress(i, limit, "Posts")

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(stats, "Posts")
        return stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = PostsSeeder(http)
        seeder.seed(limit=10)
