import * as THREE from 'three';
import { Asteroid } from './asteroid/asteroid.js';
import { log, startLog } from './log.js';

export class Simulation {
    #vel_init; #pos_init; #mass;
    constructor(v, p, m){
        this.#vel_init = v;
        this.#pos_init = p;
        this.#mass = m;
    }

    // createAsteroidId(id){
    //     const data = getData(id);
    //     console.log(data);
    // }

    createAsteroid(v, p, m){
        return new Asteroid(v, p, m);
    }

}

export function main_sim(velocityObj, positionObj, mass){
    let converge = false;
    
    // Convert velocity and position objects to THREE.Vector3
    const velocity = new THREE.Vector3(velocityObj.x, velocityObj.y, velocityObj.z);
    const position = new THREE.Vector3(positionObj.x, positionObj.y, positionObj.z);
    
    const sim = new Simulation(velocity, position, mass); // Pass Vector3 objects to constructor
    let as = sim.createAsteroid(velocity, position, mass);
    let time = 500;
    startLog();
    while(time > 0){
        log(as);
        as.updateMovement(new THREE.Vector3(0, 0, 0), 1); // no forces, 1 second timestep    
        time--; // decrement time
    }

    return converge;
}

// Only run main_sim when file is executed directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
    main_sim(1, 1000, 100); // Default parameters for testing
}