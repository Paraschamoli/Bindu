from examples.agent_swarm.researcher_agent import build_research_agent
from examples.agent_swarm.summarizer_agent import build_summarizer_agent
from examples.agent_swarm.critic_agent import build_critic_agent
from examples.agent_swarm.planner_agent import build_planner_agent
from examples.agent_swarm.reflection_agent import build_reflection_agent

import json
import re
from typing import Any, Dict, Optional


class Orchestrator:
    def __init__(self):
        self.planner_agent = build_planner_agent()
        self.research_agent = build_research_agent()
        self.summarizer_agent = build_summarizer_agent()
        self.critic_agent = build_critic_agent()
        self.reflection_agent = build_reflection_agent()

    @staticmethod
    def safe_json_loads(raw: str, fallback: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Safely parse JSON from LLM outputs.

        Handles:
        - Markdown fenced blocks
        - Extra text before/after JSON
        - Malformed JSON

        Returns fallback if parsing fails.
        """
        try:
            raw = raw.strip()

            # Remove markdown fencing if present
            if raw.startswith("```"):
                raw = re.sub(r"```(?:json)?", "", raw).strip()
                raw = raw.replace("```", "").strip()

            # Extract JSON substring if mixed text exists
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                raw = match.group()

            return json.loads(raw)

        except Exception as e:
            print("⚠️ JSON parse failed:", e)
            print("Raw output:", raw)
            return fallback or {}

    def run(self, query: str) -> str:
        MAX_RETRIES = 2

        for attempt in range(MAX_RETRIES + 1):
            print(f"\n🚀 Attempt {attempt + 1}")

            # ---------------- Planner Phase ----------------
            try:
                plan_output = self.planner_agent.run(query).to_dict().get("content", "")
                plan = self.safe_json_loads(plan_output, fallback={"steps": []})
            except Exception as e:
                print("❌ Planner failed:", e)
                return "Planner agent crashed. Please retry."

            steps = plan.get("steps", [])
            if not isinstance(steps, list) or not steps:
                print("⚠️ Invalid or empty execution plan.")
                return "Planner failed to generate a valid execution plan."

            context = query

            # ---------------- Execution Phase ----------------
            for idx, step in enumerate(steps, start=1):
                agent_name = step.get("agent")
                task = step.get("task", context)

                if not agent_name:
                    print(f"⚠️ Skipping malformed step: {step}")
                    continue

                print(f"\n⚡ Step {idx}: {agent_name.upper()} executing")

                try:
                    if agent_name == "researcher":
                        context = self.research_agent.run(task).to_dict()["content"]

                    elif agent_name == "summarizer":
                        context = self.summarizer_agent.run(task).to_dict()["content"]

                    elif agent_name == "critic":
                        context = self.critic_agent.run(task).to_dict()["content"]

                    else:
                        print(f"⚠️ Unknown agent type: {agent_name}")

                except Exception as e:
                    print(f"❌ Agent '{agent_name}' failed:", e)
                    continue

            # ---------------- Reflection Phase ----------------
            print("\n🧠 Reflection Phase")

            try:
                reflection_output = self.reflection_agent.run(context).to_dict().get("content", "")
                feedback = self.safe_json_loads(
                    reflection_output,
                    fallback={"quality": "unknown", "fix_strategy": "Improve clarity and depth."}
                )
            except Exception as e:
                print("❌ Reflection agent failed:", e)
                return context

            quality = feedback.get("quality", "unknown")
            fix_strategy = feedback.get("fix_strategy", "")

            if quality == "good":
                print("\n✅ Output validated by reflection agent")
                return context

            print("\n⚠️ Weak Output Detected")
            print("Fix Strategy:", fix_strategy)

            query = f"""
Improve the following answer using this strategy:

{fix_strategy}

Answer:
{context}
"""

        return context
