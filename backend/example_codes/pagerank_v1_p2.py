def perform_one_iteration(graph: dict, current_ranks: dict) -> dict:
    num_nodes = len(graph)
    new_ranks = {node: 0.0 for node in graph}

    for node, outbound_links in graph.items():
        if len(outbound_links) > 0:
            rank_to_donate = current_ranks[node] / len(outbound_links)
            for link in outbound_links:
                if link in new_ranks:
                    new_ranks[link] += rank_to_donate

    final_ranks_for_iteration = {}
    for node in graph:
        final_ranks_for_iteration[node] = new_ranks[node]
        
    return final_ranks_for_iteration