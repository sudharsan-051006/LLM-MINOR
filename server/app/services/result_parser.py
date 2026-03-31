import json

def parse_result(result: str):
    try:
        return json.loads(result)
    except:
        return {"total": 0, "details": [], "error": "Invalid JSON"}