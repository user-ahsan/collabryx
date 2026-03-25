"""
Pytest fixtures for embedding service tests
"""

import pytest
import asyncio
import logging
from typing import AsyncGenerator, Generator
from embedding_generator import EmbeddingGenerator, construct_semantic_text

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def embedding_generator() -> EmbeddingGenerator:
    """
    Provide a singleton embedding generator instance for tests.
    Synchronous fixture since EmbeddingGenerator.__init__() is synchronous.
    """
    logger.info("Initializing EmbeddingGenerator for tests...")
    generator = EmbeddingGenerator()
    logger.info("EmbeddingGenerator initialized successfully")
    yield generator


@pytest.fixture
def sample_profile() -> dict:
    """Sample user profile data for testing."""
    return {
        'role': 'Student',
        'headline': 'React Developer',
        'bio': 'Passionate about building web applications',
        'looking_for': ['cofounder', 'teammate'],
        'location': 'San Francisco'
    }


@pytest.fixture
def sample_skills() -> list:
    """Sample skills data for testing."""
    return [
        {'skill_name': 'React'},
        {'skill_name': 'TypeScript'},
        {'skill_name': 'Node.js'}
    ]


@pytest.fixture
def sample_interests() -> list:
    """Sample interests data for testing."""
    return [
        {'interest': 'Fintech'},
        {'interest': 'EdTech'}
    ]


@pytest.fixture
def valid_embedding_text() -> str:
    """Valid text for embedding generation."""
    return "Student React Developer passionate about Fintech and building web applications"


@pytest.fixture
def mock_supabase_response() -> dict:
    """Mock Supabase response for testing."""
    return {
        "data": [{"id": "test-user-id"}],
        "count": 1
    }
