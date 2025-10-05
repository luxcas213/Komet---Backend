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

  try {
    // Update status to processing
    simulationStatus.set(simulation.id, {
      ...simulation,
      status: STATUS.PROCESSING,
      startTime: new Date().toISOString(),
    });

    console.log(`Starting simulation ${simulation.id} with params:`, {
      velocity: simulation.velocity,
      position: simulation.position,
      mass: simulation.mass,
    });

    // Run the simulation (this is synchronous based on main_sim.js)
    const { converge, logData } = main_sim(
      simulation.velocity,
      simulation.position,
      simulation.mass
    );
    // Update status to completed
    simulationStatus.set(simulation.id, {
      ...simulation,
      status: STATUS.COMPLETED,
      converge: converge,
      logData: logData,
      completedTime: new Date().toISOString()
    });

    console.log(`Simulation ${simulation.id} completed`);
  } catch (error) {
    console.error(`Simulation ${simulation.id} failed:`, error);

    // Update status to error
    simulationStatus.set(simulation.id, {
      ...simulation,
      status: STATUS.ERROR,
      error: error.message,
      completedTime: new Date().toISOString(),
    });
  } finally {
    isProcessing = false;
    currentSimulationId = null;

    // Process next simulation in queue if any
    setTimeout(processNextSimulation, 100);
  }
}

/**
 * Run simulation endpoint
 * POST /api/runsimulation
 * body {
 *  vx, vy, vz, dx, dy, dz, mass
 * }
 */
export async function runSimulation(req, res) {
  try {
    const { vx, vy, vz, dx, dy, dz, mass } = req.body;
    // Validate required parameters
    if (vx == null || vy == null || vz == null || dx  == null || dy == null || dz == null || mass == null) {
      return res.status(400).json({
        error: "Missing required parameters: vx, vy, vz, dx, dy, dz, mass",
      });
    }

    // Parse and validate numeric values
    const velocityX = parseFloat(vx);
    const velocityY = parseFloat(vy);
    const velocityZ = parseFloat(vz);
    const positionX = parseFloat(dx);
    const positionY = parseFloat(dy);
    const positionZ = parseFloat(dz);
    const massValue = parseFloat(mass);

    if ([velocityX, velocityY, velocityZ, positionX, positionY, positionZ, massValue].some(isNaN)) {
      return res.status(400).json({
        error: "All parameters must be valid numbers",
      });
    }

    // Create simulation entry
    const simulationId = nextId++;
    const simulation = {
      id: simulationId,
      velocity: { x: velocityX, y: velocityY, z: velocityZ },
      position: { x: positionX, y: positionY, z: positionZ },
      mass: massValue,
      status: STATUS.QUEUED,
      queuedTime: new Date().toISOString(),
    };

    // Add to queue and status tracking
    simulationQueue.push(simulation);
    simulationStatus.set(simulationId, simulation);

    // Start processing if not already running
    processNextSimulation();
    res.json({
      id: simulationId,
      status: STATUS.QUEUED,
      message: "Simulation queued successfully",
      position: simulationQueue.length,
      parameters: {
        velocity: simulation.velocity,
        position: simulation.position,
        mass: massValue,
      },
    });
  } catch (error) {
    console.error("Error in runSimulation:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

/**
 * Get simulation results endpoint
 * GET /api/simulationresults?id=X
 */
export async function simulationResults(req, res) {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({
        error: "Missing required parameter: id",
      });
    }

    const simulationId = parseInt(id);
    if (isNaN(simulationId)) {
      return res.status(400).json({
        error: "ID must be a valid number",
      });
    }

    // Check if simulation exists
    const simulation = simulationStatus.get(simulationId);
    if (!simulation) {
      return res.status(404).json({
        error: "Simulation not found",
        id: simulationId,
      });
    }

    // Return status and details
    const response = simulation
    response.id = simulationId;

    // Add status-specific information
    switch (simulation.status) {
      case STATUS.QUEUED:
        response.message = "Simulation is queued";
        response.position =
          simulationQueue.findIndex((s) => s.id === simulationId) + 1;
        response.queuedTime = simulation.queuedTime;
        break;

      case STATUS.PROCESSING:
        response.message = "Simulation is currently processing";
        response.startTime = simulation.startTime;
        break;

      case STATUS.COMPLETED:
        response.message = "Simulation completed successfully";
        response.result = simulation.result;
        response.startTime = simulation.startTime;
        response.completedTime = simulation.completedTime;
        break;

      case STATUS.ERROR:
        response.message = "Simulation failed";
        response.error = simulation.error;
        response.completedTime = simulation.completedTime;
        break;
    }

    res.json(response);
  } catch (error) {
    console.error("Error in simulationResults:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}

/**
 * Get queue status endpoint (bonus - for debugging)
 * GET /api/simulationqueue
 */
export async function getSimulationQueue(req, res) {
  try {
    res.json({
      queue: simulationQueue.map((s) => ({
        id: s.id,
        status: s.status,
        queuedTime: s.queuedTime,
      })),
      currentProcessing: currentSimulationId,
      isProcessing: isProcessing,
      totalSimulations: simulationStatus.size,
    });
  } catch (error) {
    console.error("Error in getSimulationQueue:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
