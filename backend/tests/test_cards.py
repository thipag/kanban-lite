from fastapi.testclient import TestClient


def test_create_card_without_title(client: TestClient) -> None:
    response = client.post("/cards", json={"description": "Write docs", "status": "todo"})
    assert response.status_code == 201
    body = response.json()
    assert body["title"] is None
    assert body["description"] == "Write docs"
    assert body["status"] == "todo"


def test_create_card_with_title(client: TestClient) -> None:
    response = client.post(
        "/cards",
        json={"title": "Design", "description": "Create mockups", "status": "doing"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Design"
    assert body["status"] == "doing"


def test_update_card_description_and_status(client: TestClient) -> None:
    created = client.post("/cards", json={"description": "Adjust tests"}).json()
    response = client.put(
        f"/cards/{created['id']}",
        json={"description": "Adjust unit tests", "status": "done"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["description"] == "Adjust unit tests"
    assert body["status"] == "done"


def test_list_cards_with_filter_and_pagination(client: TestClient) -> None:
    for idx in range(3):
        client.post("/cards", json={"description": f"Todo {idx}", "status": "todo"})
    client.post("/cards", json={"description": "Doing task", "status": "doing"})
    page_one = client.get("/cards", params={"status": "todo", "size": 2, "page": 1})
    assert page_one.status_code == 200
    body_one = page_one.json()
    assert body_one["total"] == 3
    assert len(body_one["items"]) == 2
    page_two = client.get("/cards", params={"status": "todo", "size": 2, "page": 2})
    assert page_two.status_code == 200
    body_two = page_two.json()
    assert len(body_two["items"]) == 1


def test_delete_card_and_read_after(client: TestClient) -> None:
    created = client.post("/cards", json={"description": "Archive"}).json()
    response = client.delete(f"/cards/{created['id']}")
    assert response.status_code == 204
    detail = client.get(f"/cards/{created['id']}")
    assert detail.status_code == 404


def test_validation_errors(client: TestClient) -> None:
    missing_description = client.post("/cards", json={"title": "Invalid"})
    assert missing_description.status_code == 422
    invalid_status = client.post(
        "/cards",
        json={"description": "Invalid status", "status": "backlog"},
    )
    assert invalid_status.status_code == 422
