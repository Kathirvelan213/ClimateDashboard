import requests
import csv
import re

BASE_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"

BODIES = {
    "Mercury": "199",
    "Venus": "299",
    "Mars": "499",
    "Jupiter": "599",
    "Saturn": "699",
    "Uranus": "799",
    "Neptune": "899",
    "Earth_Moon": "301"   # Moon
}

START_TIME = "2020-01-01"
STOP_TIME = "2024-12-31"
STEP_SIZE = "'1 d'"
def fetch_ranges(body_id):
    """Fetch only range values for a body relative to Earth"""

    params = {
        "format": "text",
        "COMMAND": body_id,
        "MAKE_EPHEM": "YES",
        "EPHEM_TYPE": "VECTORS",
        "CENTER": "500@399",
        "START_TIME": START_TIME,
        "STOP_TIME": STOP_TIME,
        "STEP_SIZE": STEP_SIZE
    }

    response = requests.get(BASE_URL, params=params)

    if response.status_code != 200:
        print("HTTP ERROR:", response.status_code)
        print(response.text)
        return []

    text = response.text

    # Check if Horizons returned normal output
    if "$$SOE" not in text:
        print(f"\nHorizons error for body {body_id}")
        print("Full response:\n", text[:1000])
        return []

    match = re.search(r"\$\$SOE(.*?)\$\$EOE", text, re.DOTALL)

    if not match:
        print(f"\n⚠ Could not parse data block for body {body_id}")
        return []

    block = match.group(1)
    lines = block.strip().split("\n")

    ranges = []
    i = 0

    while i < len(lines) - 3:
        try:
            jd = lines[i].strip()
            extras = lines[i+3].strip().split()
            rg = float(extras[1])   # Range (km)
            ranges.append(rg)
            i += 4
        except:
            i += 1

    print(f"Body {body_id}: {len(ranges)} records")
    return ranges

def build_csv():
    print("Downloading planetary distances...")

    all_data = {}

    for name, body_id in BODIES.items():
        print(f"Fetching {name}...")
        all_data[name] = fetch_ranges(body_id)

    # Get number of rows from first body
    rows = len(next(iter(all_data.values())))

    filename = "planet_ranges.csv"

    with open(filename, "w", newline="") as file:
        writer = csv.writer(file)

        # Header
        header = list(BODIES.keys())
        writer.writerow(header)

        # Rows
        for i in range(rows):
            row = [all_data[body][i] for body in header]
            writer.writerow(row)

    print(f"\n✅ CSV SAVED: {filename}")
    print(f"✅ Rows: {rows}")
    print(f"✅ Columns: {len(BODIES)}")

if __name__ == "__main__":
    build_csv()
