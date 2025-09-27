import numpy as np
import math
from pagerank_v1_p2 import perform_one_iteration

def initialize_ranks(graph: dict) -> dict:
    num_nodes = len(graph)
    if num_nodes == 0:
        return {}
        
    initial_score = 1.0 / num_nodes
    ranks = {node: initial_score for node in graph}
    return ranks

def algorithm(graph: dict, iterations: int = 20) -> dict:
    ranks = initialize_ranks(graph)

    for i in range(iterations):
        ranks = perform_one_iteration(graph, ranks)
        
    return ranks

if __name__ == "__main__":
    example_graph = {
        'A': ['B', 'C'],
        'B': ['C'],
        'C': ['A'],
        'D': ['C'],
    }

    final_ranks = algorithm(example_graph, iterations=20)
    print("Final Rank scores after 20 iterations:")
    for node, score in final_ranks.items():
        print(f"Node {node}: {score:.4f}")