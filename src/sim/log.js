import fs from 'fs';
let __path = "./log.csv";


export function log(asteroid){
    let pos = asteroid.getPosition().multiplyScalar(.01); // convert to meters
    let vel = asteroid.getVelocity().multiplyScalar(.01); // convert to meters
    let mass = asteroid.getMass();
    let acc = asteroid.getAcceleration().multiplyScalar(.01); // convert to meters
    let props = {x: pos.x, y: pos.y, z: pos.z, vx: vel.x, vy: vel.y, vz: vel.z, mass: mass, ax: acc.x, ay: acc.y, az: acc.z};
    return props;
}
