import requests
from datetime import datetime, timedelta

def earth_state(date_str):
    """
    Get Earth's heliocentric state (position & velocity relative to Sun)
    
    date_str: e.g. "2025-10-04" or "2025-10-04 12:00"
    Returns: dict with position, velocity, subsolar lon/lat
    """
    url = "https://ssd.jpl.nasa.gov/api/horizons.api"
    
    # Extract date and calculate stop time
    date_only = date_str.split()[0] if ' ' in date_str else date_str
    date_obj = datetime.strptime(date_only, '%Y-%m-%d')
    stop_date = (date_obj + timedelta(days=1)).strftime('%Y-%m-%d')

    # Get heliocentric state vector
    params = {
        "format": "json",
        "COMMAND": "399",       # Earth
        "CENTER": "500@10",     # Sun
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "START_TIME": date_only,
        "STOP_TIME": stop_date,
        "STEP_SIZE": "1d"
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"API request failed: {response.status_code}")
    
    data = response.json()
    if 'error' in data:
        raise Exception(f"Horizons API error: {data['error']}")

    # Parse vector data
    result = data['result']
    if "$$SOE" not in result or "$$EOE" not in result:
        raise ValueError("No ephemeris data found")
    
    lines = result.split("$$SOE")[1].split("$$EOE")[0].strip().split('\n')
    
    # Find position and velocity lines
    position_line = velocity_line = None
    for line in lines:
        line = line.strip()
        if 'X' in line and 'Y' in line and 'Z' in line and 'VX' not in line:
            position_line = line
        elif 'VX' in line and 'VY' in line and 'VZ' in line:
            velocity_line = line
    
    if not position_line or not velocity_line:
        raise ValueError("Could not find position and velocity data")

    # Extract coordinates using regex
    import re
    
    def extract_value(pattern, line):
        match = re.search(pattern, line)
        return float(match.group(1)) if match else None
    
    x = extract_value(r'X\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', position_line)
    y = extract_value(r'Y\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', position_line)
    z = extract_value(r'Z\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', position_line)
    vx = extract_value(r'VX\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', velocity_line)
    vy = extract_value(r'VY\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', velocity_line)
    vz = extract_value(r'VZ\s*=\s*([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)', velocity_line)
    
    if None in [x, y, z, vx, vy, vz]:
        raise ValueError("Could not extract all vector components")

    return {
        "position_km": (x, y, z),
        "velocity_kms": (vx, vy, vz),
        "subsolar_lon_deg": 0.0,  # TODO: Implement sub-solar calculation
        "subsolar_lat_deg": 0.0
    }

# Example usage
if __name__ == "__main__":
    state = earth_state("2025-10-04 12:00")
    print("Earth position [km]:", state["position_km"])
    print("Earth velocity [km/s]:", state["velocity_kms"])
    print("Sub-solar point (lon, lat) [deg]:", state["subsolar_lon_deg"], state["subsolar_lat_deg"])