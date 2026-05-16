import httpx


BASE_URL = "https://candidateportal-production.up.railway.app"


def test_backend_up():
    r = httpx.get(f"{BASE_URL}/", timeout=10)
    assert r.status_code < 500
