import fs from 'fs';
let __path = "./log.csv";

export function log(asteroid){
    let pos = asteroid.getPosition();
    let vel = asteroid.getVelocity();
    let mass = asteroid.getMass();
    let acc = asteroid.getAcceleration();
    let props = [pos.x, pos.y, pos.z, vel.x, vel.y, vel.z, mass, acc.x, acc.y, acc.z];
    let logStr = props.join(",") + "\n";
    fs.appendFile(__path, logStr, function (err) {
        if (err) throw err;
    });
}

export function startLog(){
    fs.unlink(__path, function (err) {
        if (err && err.code != 'ENOENT') throw err;
    });
}
