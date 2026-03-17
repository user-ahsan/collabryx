"""
Posts Seeder
Creates posts, comments, and reactions using Supabase REST API
Inherits from BaseSeeder for common utilities
"""

import random
import time
from typing import List, Dict, Any, Optional
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder
from data_generators.posts import generate_post, generate_comment, generate_reaction


class PostsSeeder(BaseSeeder):
    """Seeder for posts, comments, and reactions with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {
            "posts": 0,
            "comments": 0,
            "reactions": 0,
            "skipped_posts": 0,
            "skipped_comments": 0,
            "skipped_reactions": 0,
            "failed": 0,
        }
        self.existing_posts_cache: set = set()
        self.existing_comments_cache: dict = {}
        self.existing_reactions_cache: dict = {}

    def _load_existing_posts_cache(self):
        """Fetch existing posts for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/posts?select=id,author_id,content",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            posts = response.json() or []
            # Create hash of author_id + content for duplicate detection
            self.existing_posts_cache = {
                f"{p['author_id']}:{p['content'][:100]}" for p in posts
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_posts_cache)} existing posts{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch existing posts: {e}{Style.RESET_ALL}")

    def _load_existing_comments_cache(self, post_id: str):
        """Fetch existing comments for a post"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/comments?select=id,author_id,content&post_id=eq.{post_id}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            comments = response.json() or []
            self.existing_comments_cache[post_id] = {
                f"{c['author_id']}:{c['content'][:100]}" for c in comments
            }
        except Exception:
            self.existing_comments_cache[post_id] = set()

    def _load_existing_reactions_cache(self, post_id: str):
        """Fetch existing reactions for a post"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/post_reactions?select=id,user_id&post_id=eq.{post_id}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            reactions = response.json() or []
            self.existing_reactions_cache[post_id] = {r["user_id"] for r in reactions}
        except Exception:
            self.existing_reactions_cache[post_id] = set()

    def _post_exists(self, author_id: str, content: str) -> bool:
        """Check if post already exists"""
        post_hash = f"{author_id}:{content[:100]}"
        return post_hash in self.existing_posts_cache

    def _comment_exists(self, post_id: str, author_id: str, content: str) -> bool:
        """Check if comment already exists for post"""
        if post_id not in self.existing_comments_cache:
            self._load_existing_comments_cache(post_id)
        comment_hash = f"{author_id}:{content[:100]}"
        return comment_hash in self.existing_comments_cache.get(post_id, set())

    def _reaction_exists(self, post_id: str, user_id: str) -> bool:
        """Check if user already reacted to post (uses cache)"""
        if post_id not in self.existing_reactions_cache:
            self._load_existing_reactions_cache(post_id)
        return user_id in self.existing_reactions_cache.get(post_id, set())

    def create_post(self, author_id: str, post_data: Dict[str, Any]) -> Optional[str]:
        """Create a single post with duplicate checking"""
        try:
            # Check for duplicate
            if self._post_exists(author_id, post_data["content"]):
                print(f"{Fore.YELLOW}  ⚠️  Post exists, skipping{Style.RESET_ALL}")
                self.stats["skipped_posts"] += 1
                return None

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

            result = self.create_single("posts", post)

            if result:
                # Add to cache
                self.existing_posts_cache.add(
                    f"{author_id}:{post_data['content'][:100]}"
                )
                self.stats["posts"] += 1
                print(f"{Fore.GREEN}  ✓ Post created{Style.RESET_ALL}")
            else:
                print(
                    f"{Fore.RED}✗ Failed to create post (no ID returned){Style.RESET_ALL}"
                )
                self.stats["failed"] += 1

            return result

        except Exception as e:
            print(f"{Fore.RED}✗ Error creating post: {e}{Style.RESET_ALL}")
            self.stats["failed"] += 1
            return None

    def create_comment(
        self,
        post_id: str,
        author_id: str,
        content: str,
        parent_id: Optional[str] = None,
    ) -> Optional[str]:
        """Create a comment on a post"""
        try:
            comment = {
                "post_id": post_id,
                "author_id": author_id,
                "content": content,
                "parent_id": parent_id,
                "like_count": 0,
            }

            comment_id = self.create_single("comments", comment)

            # Don't increment count - let database triggers handle it
            # This avoids extra HTTP requests that can hang

            return comment_id

        except Exception as e:
            print(f"\n{Fore.RED}✗ Error creating comment: {e}{Style.RESET_ALL}")
            return None

    def create_reaction(
        self, post_id: str, user_id: str, emoji: Optional[str] = None
    ) -> bool:
        """Create a reaction on a post (with duplicate prevention)"""
        try:
            # Check if reaction already exists (incremental seeding)
            if self._reaction_exists(post_id, user_id):
                return False  # Already exists, skip

            if emoji is None:
                emoji = generate_reaction()

            reaction = {"post_id": post_id, "user_id": user_id, "emoji": emoji}

            result = self.create_single("post_reactions", reaction)

            # Don't increment count - let database triggers handle it
            # This avoids extra HTTP requests that can hang

            return result is not None

        except Exception as e:
            print(f"\n{Fore.RED}✗ Error creating reaction: {e}{Style.RESET_ALL}")
            return False

    def create_reactions_batch(self, reactions: List[Dict[str, Any]]) -> int:
        """Create multiple reactions in a single batch request

        Args:
            reactions: List of reaction dicts with post_id, user_id, emoji

        Returns:
            Number of reactions successfully created
        """
        if not reactions:
            return 0

        try:
            # Don't request return representation - just check status code
            # This is faster and avoids parsing large responses
            batch_headers = {
                **config.API_HEADERS,
                "Prefer": "resolution=merge-duplicates",
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/post_reactions",
                json=reactions,
                headers=batch_headers,
            )

            # Status 200, 201, 204, 409 all indicate success (created or already exists)
            if response.status_code in [200, 201, 204, 409]:
                return len(reactions)
            else:
                # If batch fails, fall back to creating individually
                print(
                    f"{Fore.YELLOW}  ⚠️  Batch failed, falling back to individual creation{Style.RESET_ALL}"
                )
                created = 0
                for reaction in reactions:
                    if self.create_single("post_reactions", reaction, track=True):
                        created += 1
                return created

        except Exception as e:
            print(
                f"{Fore.YELLOW}  ⚠️  Batch error, creating individually: {e}{Style.RESET_ALL}"
            )
            # Fall back to individual creation
            created = 0
            for reaction in reactions:
                if self.create_single("post_reactions", reaction, track=True):
                    created += 1
            return created

        try:
            # Use Prefer: resolution=merge-duplicates to handle conflicts
            batch_headers = {
                **config.API_HEADERS,
                "Prefer": "resolution=merge-duplicates",
            }

            response = self.http.post(
                f"{config.SUPABASE_REST_URL}/post_reactions",
                json=reactions,
                headers=batch_headers,
            )

            if response.status_code in [200, 201]:
                result = response.json()
                return len(result) if result else len(reactions)
            elif response.status_code == 409:
                # Some conflicts - count successful ones
                return len(reactions)
            else:
                response.raise_for_status()
                return 0

        except Exception as e:
            print(f"\n{Fore.RED}✗ Error creating reactions batch: {e}{Style.RESET_ALL}")
            return 0

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

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed posts with comments and reactions (incremental - skips existing)"""

        # Reset statistics
        self.stats = {
            "posts": 0,
            "comments": 0,
            "reactions": 0,
            "skipped_posts": 0,
            "skipped_comments": 0,
            "skipped_reactions": 0,
            "failed": 0,
        }

        if limit is None:
            limit = int(config.LIMIT_POSTS) if config.LIMIT_POSTS != "-1" else 300

        comments_range = self.parse_limit_range(config.LIMIT_COMMENTS_PER_POST)
        reactions_range = self.parse_limit_range(config.LIMIT_REACTIONS_PER_POST)

        # Fetch existing data for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing posts for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_existing_posts_cache()

        # Show current database status
        existing_posts = len(self.existing_posts_cache)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  📝 Existing Posts: {Fore.GREEN}{existing_posts:,}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {limit:,} new posts...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {limit} POSTS (Incremental Mode){Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs for authors
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if not user_ids:
            print(f"{Fore.RED}✗ No users found. Seed profiles first.{Style.RESET_ALL}")
            return self.stats

        # Clear caches for fresh data
        self.existing_comments_cache = {}
        self.existing_reactions_cache = {}

        for i in range(limit):
            # Pick random author
            author_id = random.choice(user_ids)

            # Generate post
            post_data = generate_post()

            print(
                f"\r{Fore.CYAN}[{i + 1}/{limit}] Creating post...{Style.RESET_ALL}",
                end="",
                flush=True,
            )
            post_id = self.create_post(author_id, post_data)

            if post_id:
                print(
                    f"\r{Fore.CYAN}[{i + 1}/{limit}] ✓ Post created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

                # Add comments
                num_comments = random.randint(*comments_range)
                for _ in range(num_comments):
                    comment_author = random.choice(user_ids)
                    comment_content = generate_comment()
                    comment_id = self.create_comment(
                        post_id, comment_author, comment_content
                    )

                    if comment_id:
                        self.stats["comments"] += 1

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
                            self.stats["comments"] += 1

                # Add reactions (batch optimized)
                num_reactions = random.randint(*reactions_range)
                reacting_users = random.sample(
                    user_ids, min(num_reactions, len(user_ids))
                )

                # Create reactions in batches of 10 for better performance
                batch = []
                for reacting_user in reacting_users:
                    # Skip if already reacted (incremental seeding)
                    if not self._reaction_exists(post_id, reacting_user):
                        emoji = generate_reaction()
                        batch.append(
                            {
                                "post_id": post_id,
                                "user_id": reacting_user,
                                "emoji": emoji,
                            }
                        )

                    # Process batch when it reaches 10 items
                    if len(batch) >= 10:
                        created = self.create_reactions_batch(batch)
                        self.stats["reactions"] += created
                        batch = []

                # Process remaining reactions
                if batch:
                    created = self.create_reactions_batch(batch)
                    self.stats["reactions"] += created

            # Progress logging
            self.log_progress(i, limit, "Posts")

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed summary
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ POSTS SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  Posts created:      {Fore.GREEN}{self.stats['posts']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Posts skipped:      {Fore.YELLOW}{self.stats['skipped_posts']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Comments created:   {Fore.GREEN}{self.stats['comments']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Comments skipped:   {Fore.YELLOW}{self.stats['skipped_comments']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Reactions created:  {Fore.GREEN}{self.stats['reactions']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Reactions skipped:  {Fore.YELLOW}{self.stats['skipped_reactions']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Failed:             {Fore.RED if self.stats['failed'] > 0 else Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}"
        )

        total_created = (
            self.stats["posts"] + self.stats["comments"] + self.stats["reactions"]
        )
        total_skipped = (
            self.stats["skipped_posts"]
            + self.stats["skipped_comments"]
            + self.stats["skipped_reactions"]
        )
        print(f"  Total created:      {Fore.CYAN}{total_created:,}{Style.RESET_ALL}")
        print(f"  Total skipped:      {Fore.CYAN}{total_skipped:,}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = PostsSeeder(http)
        seeder.seed(limit=10)
