import pandas as pd
import datetime

# ---------- Load weather data ----------
print("Loading weather dataset...")
weather = pd.read_csv("backend/assets/Dataset/combined_instant_temp.csv")

# Parse datetime
weather["valid_time"] = pd.to_datetime(weather["valid_time"])

# Create day column
weather["day"] = weather["valid_time"].dt.date

# ---------- Aggregate daily ----------
print("Aggregating weather data...")

daily_weather = weather.groupby("day").agg(
    avg_temp=("t2m", "mean"),
    total_precip=("tp", "sum")
).reset_index()

# ---------- Load planetary distances ----------
print("Loading planetary distances...")
planets = pd.read_csv("planet_ranges.csv")

# ✅ Assign correct date range for your Horizons data
date_range = pd.date_range(
    start="2020-01-01",   
    end="2024-12-31",    
    freq="D"
)

planets["day"] = date_range.date

# ---------- Merge datasets ----------
print("Merging weather + planetary data...")

final = pd.merge(
    planets,
    daily_weather,
    on="day",
    how="inner"   # ensures only matching days appear
)

# ---------- Save final dataset ----------
final.to_csv("backend/assets/Dataset/weather_planets.csv", index=False)

print("\n✅ DONE: weather_planets.csv created")
print("✅ Rows:", len(final))
