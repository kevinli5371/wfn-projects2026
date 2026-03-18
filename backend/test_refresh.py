import requests
res = requests.post("http://0.0.0.0:8000/api/videos/refresh", json={"asset_ids": ["7468202517039533358"]})
print(res.status_code, res.text)
