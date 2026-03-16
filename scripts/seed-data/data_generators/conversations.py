"""
Conversation and Message Generator
Generates realistic chat conversations and messages
"""

import random
from typing import List, Dict, Any
from datetime import datetime, timedelta


# Message templates by context
MESSAGE_TEMPLATES = {
    "greeting": [
        "Hey! How's it going?",
        "Hi there! Great to connect with you.",
        "Hello! Thanks for connecting.",
        "Hey, nice to meet you here!",
        "Hi! I saw your profile and wanted to reach out.",
    ],
    "follow_up": [
        "How's your day going?",
        "What are you working on these days?",
        "How did that project turn out?",
        "Any updates on {topic}?",
        "Did you get a chance to try {thing}?",
    ],
    "professional": [
        "I'd love to learn more about your work at {company}.",
        "Your experience with {skill} is impressive!",
        "I noticed we both work in {industry}. Would love to exchange ideas.",
        "Are you open to discussing potential opportunities?",
        "Your profile caught my attention. Would you be open to a quick chat?",
    ],
    "collaboration": [
        "I'm working on something that might interest you.",
        "Would you be interested in collaborating on a project?",
        "I think our skills could complement each other.",
        "Have you thought about building {idea}?",
        "I'm looking for someone with your expertise.",
    ],
    "feedback": [
        "Would love your feedback on something I'm building.",
        "Can I get your thoughts on this?",
        "What do you think about {topic}?",
        "Have you tried {product/service}? Any thoughts?",
        "I'd value your opinion on this.",
    ],
    "meeting_request": [
        "Would you be open to a quick call sometime?",
        "Are you free for a virtual coffee chat?",
        "I'd love to pick your brain for 15 minutes.",
        "Do you have time for a quick intro call this week?",
        "Want to hop on a quick Zoom?",
    ],
    "casual": [
        "Haha, that's funny!",
        "Totally agree with you!",
        "That's interesting, never thought about it that way.",
        "Same here!",
        "Oh nice, that's cool!",
    ],
    "closing": [
        "Great chatting with you!",
        "Let's keep in touch!",
        "Talk to you soon!",
        "Thanks for the conversation!",
        "Looking forward to hearing from you!",
    ],
    "thanks": [
        "Thanks for the help!",
        "Really appreciate your time!",
        "Thank you so much for this!",
        "This is super helpful, thanks!",
        "Grateful for your insights!",
    ],
}

TOPICS = [
    "the startup scene",
    "machine learning",
    "product development",
    "career growth",
    "the industry",
    "recent tech news",
    "your company",
    "your projects",
    "the job market",
]

THINGS = [
    "that new framework",
    "the productivity app",
    "the online course",
    "the conference",
    "the book",
    "the tool",
]

COMPANIES = ["Google", "Meta", "a startup", "your company", "a tech company"]
SKILLS = ["Python", "React", "machine learning", "product design", "leadership"]
INDUSTRIES = ["fintech", "edtech", "healthtech", "AI/ML", "SaaS"]
IDEAS = [
    "a marketplace for freelancers",
    "an AI-powered tool",
    "a learning platform",
    "a productivity app",
    "a social network for professionals",
]


def generate_message(message_type: str = None, context: Dict = None) -> str:
    """Generate a single message"""

    if message_type is None:
        message_type = random.choice(list(MESSAGE_TEMPLATES.keys()))

    templates = MESSAGE_TEMPLATES.get(message_type, MESSAGE_TEMPLATES["casual"])
    message = random.choice(templates)

    # Replace placeholders
    replacements = {
        "{topic}": random.choice(TOPICS),
        "{thing}": random.choice(THINGS),
        "{company}": random.choice(COMPANIES),
        "{skill}": random.choice(SKILLS),
        "{industry}": random.choice(INDUSTRIES),
        "{idea}": random.choice(IDEAS),
        "{product/service}": random.choice(["Notion", "Figma", "Linear", "a new tool"]),
    }

    for key, value in replacements.items():
        message = message.replace(key, value)

    return message


def generate_conversation_messages(count: int = 10) -> List[Dict[str, Any]]:
    """Generate a sequence of messages for a conversation"""

    # Define conversation flow patterns
    flows = [
        [
            "greeting",
            "greeting",
            "professional",
            "follow_up",
            "collaboration",
            "meeting_request",
            "thanks",
            "closing",
        ],
        [
            "greeting",
            "greeting",
            "feedback",
            "professional",
            "follow_up",
            "casual",
            "thanks",
            "closing",
        ],
        [
            "greeting",
            "greeting",
            "casual",
            "professional",
            "collaboration",
            "follow_up",
            "meeting_request",
            "closing",
        ],
        [
            "greeting",
            "greeting",
            "professional",
            "casual",
            "feedback",
            "thanks",
            "closing",
        ],
        [
            "greeting",
            "greeting",
            "follow_up",
            "professional",
            "casual",
            "thanks",
            "closing",
        ],
    ]

    flow = random.choice(flows)

    # Extend or trim flow to match count
    while len(flow) < count:
        flow.insert(-1, random.choice(["casual", "follow_up", "professional"]))
    flow = flow[:count]

    messages = []
    for i, msg_type in enumerate(flow):
        messages.append(
            {
                "message_type": msg_type,
                "content": generate_message(msg_type),
                "sender_index": i % 2,  # Alternate between participants
            }
        )

    return messages


def generate_conversation(
    user1_id: str, user2_id: str, message_count: int = None
) -> Dict[str, Any]:
    """Generate a complete conversation between two users"""

    if message_count is None:
        message_count = random.randint(5, 20)

    messages = generate_conversation_messages(message_count)

    # Generate conversation metadata
    first_message_time = datetime.now() - timedelta(days=random.randint(1, 30))

    return {
        "participant_1": user1_id,
        "participant_2": user2_id,
        "messages": messages,
        "first_message_time": first_message_time,
        "last_message_text": messages[-1]["content"] if messages else None,
        "last_message_at": first_message_time + timedelta(minutes=message_count * 5),
        "unread_count_1": 0,
        "unread_count_2": 0,
        "is_archived": False,
    }


def generate_conversations(count: int, user_ids: List[str]) -> List[Dict[str, Any]]:
    """Generate multiple conversations"""

    conversations = []
    used_pairs = set()

    for _ in range(count):
        # Pick two different users
        user1, user2 = random.sample(user_ids, 2)
        pair_key = tuple(sorted([user1, user2]))

        # Avoid duplicate conversations
        if pair_key in used_pairs:
            continue

        used_pairs.add(pair_key)
        conversation = generate_conversation(user1, user2)
        conversations.append(conversation)

    return conversations


# For testing
if __name__ == "__main__":
    print("Generating sample conversation...")
    conv = generate_conversation("user-1", "user-2", message_count=8)

    print(f"\nConversation between User 1 and User 2:")
    print("-" * 50)
    for msg in conv["messages"]:
        sender = "User 1" if msg["sender_index"] == 0 else "User 2"
        print(f"{sender}: {msg['content']}")
