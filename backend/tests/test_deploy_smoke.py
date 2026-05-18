import httpx
import os
import pytest


BASE_URL = os.environ.get("API_BASE_URL") or os.environ.get("BASE_URL")


def test_backend_up():
    if not BASE_URL:
        pytest.skip("API_BASE_URL or BASE_URL environment variable is not set for deploy smoke test")
    r = httpx.get(f"{BASE_URL}/", timeout=10)
    assert r.status_code < 500
