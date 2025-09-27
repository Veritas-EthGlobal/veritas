import numpy as np

def initialize_scores(graph: dict) -> tuple[dict, dict]:
    num_nodes = len(graph)
    if num_nodes == 0:
        return {}, {}
        
    initial_score = 1.0 / num_nodes
    authorities = {node: initial_score for node in graph}
    ranks = {node: initial_score for node in graph}
    return authorities, ranks

def perform_one_iteration(graph: dict, current_authorities: dict) -> tuple[dict, dict]:
    new_authorities = {node: 0.0 for node in graph}
    new_ranks = {node: 0.0 for node in graph}

    for node in graph:
        for source_node, outbound_links in graph.items():
            if node in outbound_links:
                new_ranks[node] += current_authorities[source_node]

    for node, outbound_links in graph.items():
        for link in outbound_links:
            if link in new_authorities:
                new_authorities[node] += new_ranks[link]

    sum_auth = sum(new_ranks.values())
    sum_authorities = sum(new_authorities.values())
    
    final_ranks = {node: score / sum_auth if sum_auth > 0 else 0 for node, score in new_ranks.items()}
    final_authorities = {node: score / sum_authorities if sum_authorities > 0 else 0 for node, score in new_authorities.items()}
        
    return final_authorities, final_ranks

def algorithm(graph: dict, iterations: int = 20) -> tuple[dict, dict]:
    authorities, ranks = initialize_scores(graph)

    for i in range(iterations):
        authorities, ranks = perform_one_iteration(graph, authorities, ranks)
        
    return authorities, ranks

if __name__ == "__main__":
    example_graph = {
        'A': ['B', 'C'],
        'B': ['C'],
        'C': ['A'],
        'D': ['C'],
    }

    final_authorities, final_ranks = algorithm(example_graph, iterations=20)

    print("\nFinal Rank scores after 20 iterations:")
    for node, score in final_ranks.items():
        print(f"Node {node}: {score:.4f}")
