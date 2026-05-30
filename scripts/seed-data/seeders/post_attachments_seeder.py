"""
Post Attachments Seeder
Creates post_attachments for existing posts using Supabase REST API
Randomly assigns 0-3 attachments per post with realistic metadata
"""

import random
import time
from typing import Dict, Any, Optional, List, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder

# Realistic image dimensions by file type
IMAGE_DIMENSIONS = [
    (1920, 1080),  # Full HD
    (1280, 720),   # HD
    (800, 600),    # Standard
    (1200, 800),   # Blog
    (640, 480),    # Small
    (1600, 900),   # Widescreen
    (1080, 1080),  # Square
    (1080, 1920),  # Portrait / Story
]

VIDEO_DIMENSIONS = [
    (1920, 1080),  # Full HD
    (1280, 720),   # HD
    (3840, 2160),  # 4K
    (1080, 1920),  # Vertical
]

# File size ranges in bytes
IMAGE_SIZE_RANGE = (10_000, 500_000)       # 10KB – 500KB
VIDEO_SIZE_RANGE = (500_000, 50_000_000)   # 500KB – 50MB

FILE_TYPES = ["image", "video"]

MIME_MAP = {
    "image": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    "video": ["video/mp4", "video/webm", "video/quicktime"],
}


class PostAttachmentsSeeder(BaseSeeder):
    """Seeder for post_attachments with duplicate checking by post_id + order_index"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._existing_attachments_cache: Set[Tuple[str, int]] = set()

    def _load_cache(self):
        """Fetch existing post_attachments to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/post_attachments?select=post_id,order_index",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            attachments = response.json() or []
            self._existing_attachments_cache = {
                (a["post_id"], a["order_index"]) for a in attachments
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_attachments_cache)} existing post attachments{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing post attachments: {e}{Style.RESET_ALL}"
            )
            self._existing_attachments_cache = set()

    def _generate_attachment_data(
        self, order_index: int
    ) -> Dict[str, Any]:
        """Generate a single attachment dict with realistic metadata"""
        file_type = random.choice(FILE_TYPES)
        extension = "jpg" if file_type == "image" else "mp4"
        file_name = f"{'photo' if file_type == 'image' else 'video'}_{order_index + 1}.{extension}"

        if file_type == "image":
            width, height = random.choice(IMAGE_DIMENSIONS)
            file_size = random.randint(*IMAGE_SIZE_RANGE)
        else:
            width, height = random.choice(VIDEO_DIMENSIONS)
            file_size = random.randint(*VIDEO_SIZE_RANGE)

        mime_type = random.choice(MIME_MAP[file_type])

        return {
            "file_url": f"https://storage.example.com/uploads/{file_name}",
            "file_type": file_type,
            "file_name": file_name,
            "file_size": file_size,
            "mime_type": mime_type,
            "width": width,
            "height": height,
            "order_index": order_index,
        }

    def create_post_attachment(
        self, post_id: str, attachment_data: Dict[str, Any]
    ) -> Optional[str]:
        """Create a single post_attachment record"""
        try:
            record = {
                "post_id": post_id,
                "file_url": attachment_data["file_url"],
                "file_type": attachment_data["file_type"],
                "file_name": attachment_data["file_name"],
                "file_size": attachment_data["file_size"],
                "mime_type": attachment_data["mime_type"],
                "width": attachment_data["width"],
                "height": attachment_data["height"],
                "order_index": attachment_data["order_index"],
            }

            return self.create_single("post_attachments", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating post attachment: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed post_attachments for existing posts"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing post attachments for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_cache()

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING POST ATTACHMENTS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch existing posts
        print(f"{Fore.YELLOW}⏳ Fetching posts from database...{Style.RESET_ALL}")
        posts = self.fetch_existing_posts(limit=limit)
        print(f"{Fore.GREEN}✓ Found {len(posts)} posts{Style.RESET_ALL}\n")

        if not posts:
            print(f"{Fore.RED}✗ No posts found. Seed posts first.{Style.RESET_ALL}")
            return self.stats

        total_attempted = 0
        for i, post in enumerate(posts):
            post_id = post["id"]
            # Randomly assign 0-3 attachments per post (weighted: ~20% get 0)
            num_attachments = random.choices(
                [0, 1, 2, 3], weights=[20, 40, 30, 10]
            )[0]

            for order_index in range(num_attachments):
                # Check for duplicate by post_id + order_index
                key = (post_id, order_index)
                if key in self._existing_attachments_cache:
                    self.stats["skipped"] += 1
                    continue

                total_attempted += 1
                attachment_data = self._generate_attachment_data(order_index)

                print(
                    f"\r{Fore.CYAN}[{self.stats['created'] + 1}/{len(posts) * 3}] Creating attachment...{Style.RESET_ALL}",
                    end="",
                    flush=True,
                )

                result = self.create_post_attachment(post_id, attachment_data)

                if result:
                    self._existing_attachments_cache.add(key)
                    self.stats["created"] += 1
                    print(
                        f"\r{Fore.CYAN}[{self.stats['created']}/{len(posts) * 3}] ✓ Created{Style.RESET_ALL}    ",
                        end="",
                        flush=True,
                    )
                else:
                    self.stats["failed"] += 1

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        self.log_stats(self.stats, "Post Attachments")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = PostAttachmentsSeeder(http)
        seeder.seed(limit=20)
