import pandas as pd
import os
DATA_PATH_temp = os.path.join(os.path.dirname(__file__), 'assets', 'Dataset', 'combined_instant_temp.csv')
DATA_PATH_precip = os.path.join(os.path.dirname(__file__), 'assets', 'Dataset', 'combined_accum_temp.csv')

temp = pd.read_csv(DATA_PATH_temp, parse_dates=['valid_time'])
precip = pd.read_csv(DATA_PATH_precip, parse_dates=['valid_time'])
# Merge on timestamp + lat + lon
merged = temp.merge(
    precip[['valid_time','latitude','longitude','tp']], 
    on=['valid_time','latitude','longitude'],
    how='left'
)

# Convert tp to mm
merged['tp_mm'] = merged['tp'] * 1000.0

# Save
merged.to_csv("combined_final.csv", index=False)
print("Merged saved to combined_final.csv")
