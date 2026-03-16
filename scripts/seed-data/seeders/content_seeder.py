"""
Content Seeder
Creates posts, comments, and reactions using Supabase REST API
"""

import random
import time
import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from data_generators.posts import generate_post, generate_comment, generate_reaction


class ContentSeeder:
    """Seeder for posts, comments, and reactions using REST API"""

    def __init__(self, http_client: httpx.Client):
        self.http = http_client
        self.created_post_ids = []
        self.created_comment_ids = []

    def create_post(self, author_id: str, post_data: Dict[str, Any]) -> str:
        """Create a single post via REST API"""
        try:
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

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/posts",
                json=post,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            result = response.json()

            if result and len(result) > 0:
                post_id = result[0]["id"]
                self.created_post_ids.append(post_id)
                return post_id

            return None

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create post: {e}{Style.RESET_ALL}")
            return None

    def create_comment(
        self, post_id: str, author_id: str, content: str, parent_id: str = None
    ) -> str:
        """Create a comment on a post via REST API"""
        try:
            comment = {
                "post_id": post_id,
                "author_id": author_id,
                "content": content,
                "parent_id": parent_id,
                "like_count": 0,
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/comments",
                json=comment,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            result = response.json()

            if result and len(result) > 0:
                comment_id = result[0]["id"]
                self.created_comment_ids.append(comment_id)

                # Update post comment count
                self._increment_count("posts", post_id, "comment_count")

                return comment_id

            return None

        except Exception as e:
            print(f"{Fore.RED}✗ Failed to create comment: {e}{Style.RESET_ALL}")
            return None

    def create_reaction(self, post_id: str, user_id: str, emoji: str = None) -> bool:
        """Create a reaction on a post via REST API"""
        try:
            if emoji is None:
                emoji = generate_reaction()

            reaction = {"post_id": post_id, "user_id": user_id, "emoji": emoji}

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/post_reactions",
                json=reaction,
                headers=config.API_HEADERS,
            )
            response.raise_for_status()

            # Update post reaction count
            self._increment_count("posts", post_id, "reaction_count")
            return True

        except httpx.HTTPStatusError as e:
            # Ignore duplicate reactions (unique constraint)
            if e.response.status_code == 409:
                return False
            raise
        except Exception as e:
            return False

    def _increment_count(self, table: str, record_id: str, field: str):
        """Increment a count field via REST API"""
        try:
            # Get current count
            get_response = self.http.get(
                f"{config.SUPABASE_REST_URL}/{table}?id=eq.{record_id}&select={field}",
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
            # Fallback: ignore errors for count updates
            pass

    def seed_posts(
        self,
        user_ids: List[str],
        count: int = None,
        comments_per_post: tuple = None,
        reactions_per_post: tuple = None,
    ) -> Dict[str, Any]:
        """Seed posts with comments and reactions"""

        if count is None:
            count = config.SEED_COUNT_POSTS

        if comments_per_post is None:
            comments_per_post = (3, 8)

        if reactions_per_post is None:
            reactions_per_post = (5, 15)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {count} POSTS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        stats = {"posts": 0, "comments": 0, "reactions": 0}

        for i in range(count):
            # Pick random author
            author_id = random.choice(user_ids)

            # Generate post
            post_data = generate_post()
            post_id = self.create_post(author_id, post_data)

            if post_id:
                stats["posts"] += 1

                # Add comments
                num_comments = random.randint(*comments_per_post)
                for _ in range(num_comments):
                    comment_author = random.choice(user_ids)
                    comment_content = generate_comment()
                    comment_id = self.create_comment(
                        post_id, comment_author, comment_content
                    )

                    if comment_id:
                        stats["comments"] += 1

                        # Some comments get replies
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
                num_reactions = random.randint(*reactions_per_post)
                reacting_users = random.sample(
                    user_ids, min(num_reactions, len(user_ids))
                )

                for reacting_user in reacting_users:
                    if self.create_reaction(post_id, reacting_user):
                        stats["reactions"] += 1

            # Progress
            if (i + 1) % 20 == 0:
                print(
                    f"{Fore.GREEN}✓ Created {i + 1}/{count} posts...{Style.RESET_ALL}"
                )

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Posts: {stats['posts']}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Comments: {stats['comments']}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ Reactions: {stats['reactions']}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return stats


if __name__ == "__main__":
    print("Content seeder module loaded successfully")
