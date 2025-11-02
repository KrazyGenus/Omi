from models.a2a import (
    JSONRPCRequest,
    JSONRPCResponse,
    TaskResult,
    TaskStatus,
    Artifact,
    MessagePart,
    A2AMessage,
)
import json


class ParcelAgent:
    def print_payload(self, client_payload):
        for message in client_payload:
            for part in message.parts:
                print(part.text)


parcelAgent = ParcelAgent()
