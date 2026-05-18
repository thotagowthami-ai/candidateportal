import os

import pytest


@pytest.fixture(scope="session")
def api_base_url():
    # Default local API URL; override for deployed environment.
    return os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
