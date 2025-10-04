import * as THREE from 'three';

export class Asteroid {
    #velocity; #position; #mass; #acceleration;

    constructor(vel, pos, mass){
        this.#velocity = vel;
        this.#position = pos;
        this.#mass = mass;
        this.#acceleration = new THREE.Vector3(0, 0, 0);
    }
    updateMovement(F, delta){ // changes velocity and position
        // F = force vector
        // delta = time step
        const acc = F.clone().divideScalar(this.#mass); // a = F/m
        this.#velocity.add(acc.multiplyScalar(delta)); // v = v0 + at
        this.#position.add(this.#velocity.clone().multiplyScalar(delta)); // s = s0 + vt    
    }
    
    getPosition() {
        return this.#position.clone(); // returns the current position
    }

    getVelocity() {
        return this.#velocity.clone(); // returns the current velocity
    }

    getMass() {
        return this.#mass;
    }
    getAcceleration() {
        return this.#acceleration.clone();
    }
}