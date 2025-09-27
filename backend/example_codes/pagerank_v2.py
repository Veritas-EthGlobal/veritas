def perform_one_transmission_cycle(contact_network: dict, current_infection_levels: dict) -> dict:
    num_individuals = len(contact_network)
    new_infection_levels = {person: 0.0 for person in contact_network}

    for person, contacts in contact_network.items():
        if len(contacts) > 0:
            infection_to_spread = current_infection_levels[person] / len(contacts)
            for contact in contacts:
                if contact in new_infection_levels:
                    new_infection_levels[contact] += infection_to_spread

    final_infection_levels_for_cycle = {}
    for person in contact_network:
        final_infection_levels_for_cycle[person] = new_infection_levels[person]
        
    return final_infection_levels_for_cycle

def disease_spread_simulation(contact_network: dict, transmission_cycles: int = 20) -> dict:
    num_individuals = len(contact_network)
    if num_individuals == 0:
        return {}
        
    initial_infection_probability = 1.0 / num_individuals
    infection_levels = {person: initial_infection_probability for person in contact_network}
    
    cycle = 0
    while cycle < transmission_cycles:
        old_infection_levels = infection_levels.copy()
        infection_levels = perform_one_transmission_cycle(contact_network, infection_levels)
        
        change_in_infection = sum(abs(infection_levels[person] - old_infection_levels[person]) for person in contact_network)
        if change_in_infection < 0.00001:
            break
        cycle+=1
        
    return infection_levels