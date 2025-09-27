function performOneTransmissionCycle(contactNetwork, currentInfectionLevels) {
    const newInfectionLevels = {};
    for (const person in contactNetwork) {
        newInfectionLevels[person] = 0.0;
    }

    for (const person in contactNetwork) {
        const contacts = contactNetwork[person];
        if (contacts.length > 0) {
            const infectionToSpread = currentInfectionLevels[person] / contacts.length;
            for (const contact of contacts) {
                if (contact in newInfectionLevels) {
                    newInfectionLevels[contact] += infectionToSpread;
                }
            }
        }
    }

    const finalInfectionLevelsForCycle = {};
    for (const person in contactNetwork) {
        finalInfectionLevelsForCycle[person] = newInfectionLevels[person];
    }
    
    return finalInfectionLevelsForCycle;
}

function diseaseSpreadSimulation(contactNetwork, transmissionCycles = 20) {
    const numIndividuals = Object.keys(contactNetwork).length;
    if (numIndividuals === 0) {
        return {};
    }
    
    const initialInfectionProbability = 1.0 / numIndividuals;
    let infectionLevels = {};
    for (const person in contactNetwork) {
        infectionLevels[person] = initialInfectionProbability;
    }

    let cycle = 0;
    while (cycle < transmissionCycles) {
        const oldInfectionLevels = { ...infectionLevels };

        infectionLevels = performOneTransmissionCycle(contactNetwork, infectionLevels);
        
        let changeInInfection = 0;
        for (const person in contactNetwork) {
            changeInInfection += Math.abs(infectionLevels[person] - oldInfectionLevels[person]);
        }
        
        if (changeInInfection < 0.00001) {
            break;
        }
        
        cycle++;
    }

    return infectionLevels;
}

if (require.main === module) {
    const exampleGraph = {
        'A': ['B', 'C'],
        'B': ['C'],
        'C': ['A'],
        'D': ['C'],
    };

    const finalRanks = diseaseSpreadSimulation(exampleGraph, 20);
    console.log("Final Rank scores after 20 iterations:");
    for (const [node, score] of Object.entries(finalRanks)) {
        console.log(`Node ${node}: ${score.toFixed(4)}`);
    }
}