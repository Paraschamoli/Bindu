from bindu.penguin.bindufy import bindufy
from examples.agent_swarm.orchestrator import Orchestrator


orchestrator = Orchestrator()


def handler(messages: str) -> str:
    """
    Main handler for the multi-agent swarm.
    """
    result = orchestrator.run(messages)
    return result


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
