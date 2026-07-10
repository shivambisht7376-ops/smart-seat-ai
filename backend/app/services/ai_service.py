"""
SmartSeat AI — AI Service (Firestore)
"""
from google.cloud.firestore import AsyncClient
from app.config import settings


class AIService:
    def __init__(self, db: AsyncClient):
        self.db = db

    async def _count(self, collection: str, **filters) -> int:
        try:
            query = self.db.collection(collection)
            for k, v in filters.items():
                query = query.where(k, "==", v)
            agg = await query.count().get()
            return agg[0][0].value
        except Exception:
            count = 0
            query2 = self.db.collection(collection)
            for k, v in filters.items():
                query2 = query2.where(k, "==", v)
            async for _ in query2.stream():
                count += 1
            return count

    async def answer(self, question: str, user_id: str) -> dict:
        q = question.lower()
        total_emp    = await self._count("employees")
        active_emp   = await self._count("employees", status="active")
        total_seats  = await self._count("seats")
        occupied     = await self._count("seats", status="occupied")
        available    = total_seats - occupied
        utilization  = round((occupied / total_seats * 100) if total_seats else 0, 1)
        total_proj   = await self._count("projects")
        active_allocs = await self._count("allocations", status="active")

        if any(w in q for w in ["utilization", "occupancy", "occupied"]):
            answer = (f"Current seat utilization is {utilization}%. {occupied} of "
                      f"{total_seats} seats are occupied, with {available} available.")
        elif any(w in q for w in ["employee", "headcount", "staff", "people"]):
            answer = f"There are {total_emp} total employees, with {active_emp} currently active."
        elif any(w in q for w in ["seat", "available", "free"]):
            answer = f"There are {available} available seats of {total_seats} total. Utilization: {utilization}%."
        elif any(w in q for w in ["project", "projects"]):
            answer = f"There are {total_proj} projects tracked in the system."
        elif any(w in q for w in ["allocation", "allocated", "assigned"]):
            answer = f"There are {active_allocs} active seat allocations."
        else:
            if settings.OPENAI_API_KEY:
                try:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
                    ctx = (f"SmartSeat data: {total_emp} employees ({active_emp} active), "
                           f"{total_seats} seats ({occupied} occupied, {utilization}% utilization), "
                           f"{total_proj} projects, {active_allocs} active allocations.")
                    resp = await client.chat.completions.create(
                        model=settings.OPENAI_MODEL,
                        messages=[{"role": "system", "content": f"You are SmartSeat AI. Context: {ctx}"},
                                  {"role": "user", "content": question}],
                        max_tokens=500,
                    )
                    answer = resp.choices[0].message.content
                except Exception:
                    answer = (f"I have data on {total_emp} employees, {total_seats} seats "
                              f"({utilization}% utilized). How can I help?")
            else:
                answer = (f"Based on Firestore data: {total_emp} employees, "
                          f"{total_seats} seats ({utilization}% utilized, {available} free), "
                          f"{total_proj} projects. Ask me about utilization, employees, seats or projects!")

        return {"question": question, "answer": answer, "data_source": "Firebase Firestore"}
