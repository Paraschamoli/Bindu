from bindu.penguin.bindufy import bindufy
from examples.agent_swarm.orchestrator import Orchestrator


orchestrator = Orchestrator()


def handler(messages: list[dict[str, str]]) -> str:
    """
    Main handler for the multi-agent swarm.
    Bindu passes a conversation message list.
    We extract the latest user query and run the swarm.
    """

    if not messages:
        return "No input received."

    try:
        user_input = messages[-1].get("content", "")

        if not user_input:
            return "Empty input provided."

        result = orchestrator.run(user_input)
        return result

    except Exception as e:
        return f"Swarm execution failed: {str(e)}"



if __name__ == "__main__":
    config = {
        "author": "nivasm2823@gmail.com",
        "name": "killer-agent-swarm",
        "description": "Multi-agent AI system for deep research, summarization and critical reasoning.",
        "capabilities": {"streaming": True},
        "deployment": {"url": "http://localhost:3780", "expose": True,
        "protocol_version": "1.0.0"},
        "storage": {"type": "memory"},
        "scheduler": {"type": "memory"}
    }

    bindufy(config=config, handler=handler)
