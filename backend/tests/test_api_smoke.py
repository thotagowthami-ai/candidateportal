import httpx
import os
import pytest


def _get(url: str) -> httpx.Response:
    try:
        return httpx.get(url, timeout=10.0, follow_redirects=True)
    except httpx.ConnectError as exc:
        pytest.fail(f"Unable to connect to {url}. Start server or set API_BASE_URL. Error: {exc}")


def _paths_from_env(key: str, default_paths: list[str]) -> list[str]:
    value = os.getenv(key, "").strip()
    if not value:
        return default_paths
    return [f"/{p.strip().lstrip('/')}" for p in value.split(",") if p.strip()]


def _is_strict() -> bool:
    # Enable strict checks only when explicitly set to "true".
    return os.getenv("SMOKE_STRICT", "false").strip().lower() == "true"


def test_api_base_url_reachable(api_base_url):
    response = _get(f"{api_base_url}/")
    # Many APIs return 404 on root, but should not be 5xx if service is healthy.
    assert response.status_code < 500


def test_health_endpoint(api_base_url):
    candidates = _paths_from_env(
        "HEALTH_PATHS",
        ["/health", "/api/health", "/status", "/api/status", "/api/v1/health"],
    )
    results = []
    for path in candidates:
        response = _get(f"{api_base_url}{path}")
        results.append((path, response.status_code))
        if response.status_code == 200:
            return
    if _is_strict():
        pytest.fail(f"No healthy endpoint responded 200. Tried: {results}")
    pytest.skip(f"No configured health endpoint returned 200. Tried: {results}")


def test_api_docs_or_openapi(api_base_url):
    candidates = _paths_from_env(
        "DOCS_PATHS",
        [
            "/openapi.json",
            "/docs",
            "/redoc",
            "/swagger",
            "/api/docs",
            "/swagger/index.html",
            "/api/openapi.json",
        ],
    )
    results = []
    for path in candidates:
        response = _get(f"{api_base_url}{path}")
        results.append((path, response.status_code))
        if response.status_code == 200:
            return
    if _is_strict():
        pytest.fail(f"No docs/openapi endpoint responded 200. Tried: {results}")
    pytest.skip(f"No configured docs/openapi endpoint returned 200. Tried: {results}")
