import * as THREE from 'three';

export class Asteroid {
    #velocity; #position; #mass; #acceleration; #density;

    constructor(vel, pos, mass, density){
        this.#velocity = vel;
        this.#position = pos;
        this.#mass = mass;
        this.#density = 3000;
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
    getDistanceFromEarth() {
        return this.#position.distanceTo(new THREE.Vector3(0, 0, 0)); // 
    }

    getGravitationalForce() {
        const G = 6.67430e-11;
        const earthMass = 5.972e24;
        const distance = this.getDistanceFromEarth() * 1000; // convert km to m
        const forceMagnitude = (G * this.#mass * earthMass) / (distance * distance); // in kiloNewtons
        const forceDirection = this.#position.clone().negate().normalize(); // towards Earth's center
        return forceDirection.multiplyScalar(forceMagnitude); // in kiloNewtons
    }

    impacted() {
        return this.getDistanceFromEarth() <= 6371; // Earth's radius in km
    }

    inEarthAtmosphere() {
        return this.getDistanceFromEarth() <= 6481;
    }

    heightAboveEarthSurface() {
        return this.getDistanceFromEarth() - 6371; // Height above Earth's surface in km
    }

    airDensityAtAltitudeKm(altKm) {
        const rho0 = 1.225; // sea-level density (kg/m^3)
        const H = 8.5;      // scale height (km)
        const h = Math.max(0, altKm); // clamp below sea level
        return rho0 * Math.exp(-h / H);
    }

    atmosphericEntryForces() {
        if (this.inEarthAtmosphere()) {
            const dragCoefficient = 1.5; // Approximate for a sphere
            const airDensity = this.airDensityAtAltitudeKm(this.heightAboveEarthSurface());
            const crossSectionalArea = Math.PI * Math.pow((this.#mass / this.#density), 2/3); 

            const dragForce =  this.#velocity.clone().multiplyScalar(0.5 * dragCoefficient * airDensity * crossSectionalArea * this.#velocity.length());
            // dragForce.negate(); // Drag force opposes motion
            const terminalVelocity = Math.sqrt((2 * this.#mass * 9.81) / (dragCoefficient * airDensity * crossSectionalArea));
            if (this.#velocity.length() > terminalVelocity) {
                this.#velocity.setLength(terminalVelocity);
            }
            return dragForce;
        }
        return new THREE.Vector3(0, 0, 0);
    }

    breakUpInAtmosphere() {
        if (this.inEarthAtmosphere() && this.#mass > 0) {
            const breakUpThreshold = 1000; // Arbitrary threshold for breakup
            const airDensity = this.airDensityAtAltitudeKm(this.heightAboveEarthSurface());
            if (airDensity * this.#velocity.length() > breakUpThreshold) {
                return true;
            }
        }
        return false;
    }

    applyMassLoss(dt) {
        // dt = time step in seconds
        // return true if mass is zero after loss(burnt up)
        if (this.inEarthAtmosphere() && this.#mass > 0) {
            const massLossRate = this.#density * 0.001; // Arbitrary mass loss rate
            const airDensity = this.airDensityAtAltitudeKm(this.heightAboveEarthSurface());
            const loss = airDensity * this.#velocity.length() * massLossRate * this.#mass/this.#density ; // mass loss proportional to air density, velocity, and current mass
            this.#mass -= loss * dt; // mass loss over the time step 
            if (this.#mass <= 50) {
                this.#mass = 0;
                this.#velocity.set(0, 0, 0); // Stop movement if mass is zero
                return true;
            }
            return false;
        }
        
    }
}
