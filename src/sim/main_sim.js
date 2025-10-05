import * as THREE from 'three';
import { Asteroid } from './asteroid/asteroid.js';
import { log } from './log.js';
import { distance } from 'three/tsl';

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
    
    //velocity.multiplyScalar(.1); // convert to km/s
    position.multiplyScalar(.1); // convert to km

    const sim = new Simulation(velocity, position, mass); // Pass Vector3 objects to constructor
    let as = sim.createAsteroid(velocity, position, mass);
    let max_iter = 100000;
    let logData = [];
    let dt = 100
    while(max_iter > 0){
        if(as.heightAboveEarthSurface() > 10000){ 
            dt = 1;
        }else if(as.heightAboveEarthSurface() > 1000){ 
            dt = 0.25;
        } else if(as.heightAboveEarthSurface() > 100){
            dt = 0.0005;
        }


        logData.push(log(as));
        if (as.impacted()) {
            console.log("Asteroid has impacted the Earth.");
            converge = true;
            break;
        }
        if(as.applyMassLoss(dt)){
            console.log("Asteroid has burnt up in the atmosphere.");
            converge = true;
            break;
        }
        
        if(as.breakUpInAtmosphere()){
            console.log("Asteroid has exploded in the atmosphere.");
            converge = true;
            break;
        }
        const force = as.getGravitationalForce()// .add(as.atmosphericEntryForces());

        as.updateMovement(force, dt); // apply forces and time step 
        max_iter--; // decrement max_iter
    }
    //console.log(logData);
    if(!converge){
        console.log("Simulation did not converge within the maximum iterations.");
    }
    return {converge, logData};
}

// Only run main_sim when file is executed directly, not when imported
if (import.meta.url === `file://${process.argv[1]}`) {
    main_sim(1, 1000, 100); // Default parameters for testing
}