from examples.agent_swarm.researcher_agent import build_research_agent
from examples.agent_swarm.summarizer_agent import build_summarizer_agent
from examples.agent_swarm.critic_agent import build_critic_agent
from examples.agent_swarm.planner_agent import build_planner_agent
from examples.agent_swarm.reflection_agent import build_reflection_agent

import json


class Orchestrator:
    def __init__(self):
        self.planner_agent = build_planner_agent()
        self.research_agent = build_research_agent()
        self.summarizer_agent = build_summarizer_agent()
        self.critic_agent = build_critic_agent()
        self.reflection_agent = build_reflection_agent()

    def run(self, query: str) -> str:
        MAX_RETRIES = 2

        for attempt in range(MAX_RETRIES + 1):

            print(f"\n🚀 Attempt {attempt+1}")

            plan_json = self.planner_agent.run(query).to_dict()["content"]
            plan = json.loads(plan_json)

            context = query

            for step in plan["steps"]:
                agent_name = step["agent"]

                print(f"\n⚡ {agent_name.upper()} executing")

                if agent_name == "researcher":
                    context = self.research_agent.run(context).to_dict()["content"]

                elif agent_name == "summarizer":
                    context = self.summarizer_agent.run(context).to_dict()["content"]

                elif agent_name == "critic":
                    context = self.critic_agent.run(context).to_dict()["content"]

            print("\n🧠 Reflection Phase")

            reflection = self.reflection_agent.run(context).to_dict()["content"]
            feedback = json.loads(reflection)

            if feedback["quality"] == "good":
                print("\n✅ Output validated")
                return context

            print("\n⚠️ Weak Output Detected")
            print("Fix Strategy:", feedback["fix_strategy"])

            query = f"""
Improve the following answer using this strategy:

{feedback["fix_strategy"]}

Answer:
{context}
"""

        return context