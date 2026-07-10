"""
SmartSeat AI — Pure In-Memory Database Mock
Mimics the MongoDB Motor async API so no service code needs to change.
"""
import copy
from typing import Any, Dict, List, Optional


class InMemoryCursor:
    """Mimics motor's AsyncIOMotorCursor with skip/limit support."""

    def __init__(self, data: List[dict]):
        self._data = data
        self._skip_n = 0
        self._limit_n = 0

    def skip(self, n: int) -> "InMemoryCursor":
        self._skip_n = n
        return self

    def limit(self, n: int) -> "InMemoryCursor":
        self._limit_n = n
        return self

    def __aiter__(self):
        data = self._data[self._skip_n:]
        if self._limit_n > 0:
            data = data[: self._limit_n]
        return _AsyncIterator(data)


class _AsyncIterator:
    def __init__(self, data):
        self._data = iter(data)

    def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return copy.deepcopy(next(self._data))
        except StopIteration:
            raise StopAsyncIteration


class InMemoryCollection:
    """Mimics a MongoDB collection with an in-memory list."""

    def __init__(self, data: List[dict]):
        self._data = data  # shared reference to the global store list

    def _match(self, doc: dict, query: dict) -> bool:
        for k, v in query.items():
            if isinstance(v, dict):
                # Handle operators like $exists, $ne
                doc_val = doc.get(k)
                if "$exists" in v:
                    if v["$exists"] and doc_val is None:
                        return False
                    if not v["$exists"] and doc_val is not None:
                        return False
                if "$ne" in v and doc_val == v["$ne"]:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def find(self, query: Optional[dict] = None) -> InMemoryCursor:
        query = query or {}
        results = [copy.deepcopy(d) for d in self._data if self._match(d, query)]
        return InMemoryCursor(results)

    async def find_one(self, query: Optional[dict] = None) -> Optional[dict]:
        query = query or {}
        for doc in self._data:
            if self._match(doc, query):
                return copy.deepcopy(doc)
        return None

    async def insert_one(self, doc: dict) -> None:
        self._data.append(copy.deepcopy(doc))

    async def insert_many(self, docs: List[dict]) -> None:
        for doc in docs:
            self._data.append(copy.deepcopy(doc))

    async def update_one(self, query: dict, update: dict) -> None:
        set_data = update.get("$set", {})
        for doc in self._data:
            if self._match(doc, query):
                doc.update(set_data)
                return

    async def delete_many(self, query: dict) -> None:
        to_remove = [d for d in self._data if self._match(d, query)]
        for d in to_remove:
            self._data.remove(d)

    async def count_documents(self, query: Optional[dict] = None) -> int:
        query = query or {}
        return sum(1 for d in self._data if self._match(d, query))

    def aggregate(self, pipeline: List[dict]) -> InMemoryCursor:
        """Supports basic $match and $group with $sum."""
        data = list(self._data)

        for stage in pipeline:
            if "$match" in stage:
                data = [d for d in data if self._match(d, stage["$match"])]
            elif "$group" in stage:
                group_spec = stage["$group"]
                group_key_field = group_spec.get("_id", "")
                # e.g. "$department_id"
                if isinstance(group_key_field, str) and group_key_field.startswith("$"):
                    field_name = group_key_field[1:]
                else:
                    field_name = None

                groups: Dict[Any, dict] = {}
                for doc in data:
                    gk = doc.get(field_name) if field_name else None
                    if gk not in groups:
                        groups[gk] = {"_id": gk}
                        for out_field, agg in group_spec.items():
                            if out_field == "_id":
                                continue
                            if isinstance(agg, dict) and "$sum" in agg:
                                groups[gk][out_field] = 0
                    for out_field, agg in group_spec.items():
                        if out_field == "_id":
                            continue
                        if isinstance(agg, dict) and "$sum" in agg:
                            val = agg["$sum"]
                            if val == 1:
                                groups[gk][out_field] += 1
                            elif isinstance(val, str) and val.startswith("$"):
                                groups[gk][out_field] += doc.get(val[1:], 0)
                data = list(groups.values())

        return InMemoryCursor(data)


class InMemoryDB:
    """Mimics a MongoDB database — collections accessed via subscript."""

    def __init__(self, store: dict):
        self._store = store  # {"users": [...], "seats": [...], ...}
        self._collections: Dict[str, InMemoryCollection] = {}

    def __getitem__(self, name: str) -> InMemoryCollection:
        if name not in self._collections:
            if name not in self._store:
                self._store[name] = []
            self._collections[name] = InMemoryCollection(self._store[name])
        return self._collections[name]
