import { main_sim } from "../sim/main_sim.js";

// Simulation queue and status tracking
const simulationQueue = [];
const simulationStatus = new Map();
let currentSimulationId = null;
let isProcessing = false;
let nextId = 1;

// Simulation status constants
const STATUS = {
  QUEUED: 0,
  PROCESSING: 1,
  COMPLETED: 2,
  ERROR: 3,
};

/**
 * Process the next simulation in the queue
 */
async function processNextSimulation() {
  if (isProcessing || simulationQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const simulation = simulationQueue.shift();
  currentSimulationId = simulation.id;

}