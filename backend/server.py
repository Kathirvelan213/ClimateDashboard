from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os
import io
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

APP = Flask(__name__)
CORS(APP)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'assets', 'Dataset', 'combined_instant_temp.csv')

def load_and_prepare():
    df = pd.read_csv(DATA_PATH, parse_dates=['valid_time'])

    # Temperature
    df['t2m_c'] = df['t2m'] - 273.15
    df['d2m_c'] = df['d2m'] - 273.15 if 'd2m' in df.columns else pd.NA
    df['sp_hpa'] = df['sp'] / 100.0 if 'sp' in df.columns else pd.NA

    # Wind direction (meteorological)
    if 'u10' in df.columns and 'v10' in df.columns:
        df['wind_dir'] = (270 - np.degrees(np.arctan2(df['v10'], df['u10']))) % 360
    else:
        df['wind_dir'] = pd.NA

    df['year'] = df['valid_time'].dt.year
    df['month'] = df['valid_time'].dt.month
    df['day'] = df['valid_time'].dt.day

    df['wind_speed'] = np.sqrt(df['u10']**2 + df['v10']**2)


    return df


DF = load_and_prepare()

DF_P = pd.read_csv(os.path.join(os.path.dirname(__file__), 'assets', 'Dataset', 'combined_instant_temp.csv'), parse_dates=["valid_time"])
DF_P["tp_mm"] = DF_P["tp"] * 1000  # ERA5 tp is meters → convert to mm
DF_P["year"] = DF_P["valid_time"].dt.year
DF_P["month"] = DF_P["valid_time"].dt.month
DF_P["day"] = DF_P["valid_time"].dt.day

@APP.route('/api/temperature/years')
def available_years():
    years = sorted(DF['year'].unique().tolist())
    return jsonify(years)


@APP.route('/api/temperature/yearly')
def yearly():
    # average t2m per year across all locations and times
    s = DF.groupby('year')['t2m_c'].mean().reset_index()
    result = [{'year': int(r['year']), 'temp_c': float(r['t2m_c'])} for _, r in s.iterrows()]
    return jsonify(result)


@APP.route('/api/temperature/monthly')
def monthly():
    # requires ?year=YYYY
    year = request.args.get('year', type=int)
    if year is None:
        return jsonify({'error': 'missing year parameter'}), 400
    sub = DF[DF['year'] == year]
    if sub.empty:
        return jsonify([])
    s = sub.groupby('month')['t2m_c'].mean().reset_index()
    # ensure months 1..12 present
    month_map = {int(r['month']): float(r['t2m_c']) for _, r in s.iterrows()}
    result = []
    for m in range(1, 13):
        result.append({'month': m, 'temp_c': month_map.get(m, None)})
    return jsonify(result)


@APP.route('/api/temperature/daily')
def daily():
    # requires ?year=YYYY&month=MM
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    if year is None or month is None:
        return jsonify({'error': 'missing year or month parameter'}), 400
    sub = DF[(DF['year'] == year) & (DF['month'] == month)]
    if sub.empty:
        return jsonify([])
    s = sub.groupby('day')['t2m_c'].mean().reset_index()
    # determine days in month from data
    days = sorted(s['day'].unique().tolist())
    result = [{'day': int(r['day']), 'temp_c': float(r['t2m_c'])} for _, r in s.iterrows()]
    return jsonify(result)


@APP.route('/api/temperature/histogram')
def histogram():
    # optional filters: year, month; optional limit
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    limit = request.args.get('limit', default=5000, type=int)
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify([])
    # sample to limit to avoid very large payloads
    if limit and len(sub) > limit:
        sample = sub.sample(n=limit, random_state=1)
    else:
        sample = sub
    temps = sample['t2m_c'].tolist()
    return jsonify(temps)


@APP.route('/api/temperature/scatter')
def scatter():
    # returns sampled points with latitude and temperature (t2m_c)
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    limit = request.args.get('limit', default=2000, type=int)
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify([])
    if limit and len(sub) > limit:
        sample = sub.sample(n=limit, random_state=2)
    else:
        sample = sub
    # return lat, lon, temp
    points = []
    for _, r in sample.iterrows():
        points.append({
            'latitude': float(r['latitude']),
            'longitude': float(r['longitude']),
            'temp_c': float(r['t2m_c']),
        })
    return jsonify(points)


@APP.route('/api/temperature/heatmap')
def heatmap():
    # returns sampled points with lat, lon, temp and timestamp for map heat overlays
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    limit = request.args.get('limit', default=5000, type=int)
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify([])
    if limit and len(sub) > limit:
        sample = sub.sample(n=limit, random_state=3)
    else:
        sample = sub
    points = []
    for _, r in sample.iterrows():
        points.append({
            'latitude': float(r['latitude']),
            'longitude': float(r['longitude']),
            'temp_c': float(r['t2m_c']),
            'valid_time': r['valid_time'].isoformat()
        })
    return jsonify(points)



@APP.route('/api/temperature/heat_raster')
def heat_raster():
    """Return a PNG raster image (continuous heat) for the averaged temperatures over unique stations.
    Optional query params:
      year, month - to filter data
      width, height - image size in pixels (defaults 600x400)
      power - IDW power (default 2)
      padding - fraction to pad bbox (default 0.02)
    """
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    width = request.args.get('width', default=600, type=int)
    height = request.args.get('height', default=400, type=int)
    power = request.args.get('power', default=2.0, type=float)
    padding = request.args.get('padding', default=0.02, type=float)

    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify({'error': 'no data for selection'}), 400

    # average temps per unique lat/lon
    pts = sub.groupby(['latitude', 'longitude'])['t2m_c'].mean().reset_index()
    lats = pts['latitude'].values
    lons = pts['longitude'].values
    vals = pts['t2m_c'].values

    # bounding box with small padding
    min_lat, max_lat = lats.min(), lats.max()
    min_lon, max_lon = lons.min(), lons.max()
    lat_pad = (max_lat - min_lat) * padding if (max_lat - min_lat) != 0 else 0.01
    lon_pad = (max_lon - min_lon) * padding if (max_lon - min_lon) != 0 else 0.01
    min_lat -= lat_pad
    max_lat += lat_pad
    min_lon -= lon_pad
    max_lon += lon_pad


    # support aggregating to a coarse grid (grid_cols x grid_rows), then upsample for smooth display
    grid_cols = request.args.get('grid_cols', type=int)
    grid_rows = request.args.get('grid_rows', type=int)
    if grid_cols and grid_rows:
        # create bins
        lat_bins = np.linspace(min_lat, max_lat, grid_rows + 1)
        lon_bins = np.linspace(min_lon, max_lon, grid_cols + 1)
        grid_small = np.full((grid_rows, grid_cols), np.nan)
        counts = np.zeros((grid_rows, grid_cols), dtype=int)
        # assign each station to a bin
        for lat, lon, val in zip(lats, lons, vals):
            r = np.searchsorted(lat_bins, lat, side='right') - 1
            c = np.searchsorted(lon_bins, lon, side='right') - 1
            if r < 0 or r >= grid_rows or c < 0 or c >= grid_cols:
                continue
            if np.isnan(grid_small[r, c]):
                grid_small[r, c] = val
            else:
                grid_small[r, c] += val
            counts[r, c] += 1
        # average
        mask = counts > 0
        grid_small[mask] = grid_small[mask] / counts[mask]
        # replace empty cells by nearest neighbor filling
        # simple nearest fill: for each nan cell, find nearest non-nan
        if np.any(np.isnan(grid_small)):
            import math
            coords = [(i, j) for i in range(grid_rows) for j in range(grid_cols) if not math.isnan(grid_small[i, j])]
            for i in range(grid_rows):
                for j in range(grid_cols):
                    if math.isnan(grid_small[i, j]):
                        # find nearest
                        best = None
                        bestd = None
                        for ii, jj in coords:
                            d = (ii - i) ** 2 + (jj - j) ** 2
                            if best is None or d < bestd:
                                best = (ii, jj)
                                bestd = d
                        if best is not None:
                            grid_small[i, j] = grid_small[best]
        # upsample grid_small to image size using simple repeat (kron) then let imshow interpolate
        repeat_y = max(1, height // grid_rows)
        repeat_x = max(1, width // grid_cols)
        GRID = np.kron(grid_small, np.ones((repeat_y, repeat_x)))
        # if shape mismatch, resize by slicing or padding
        GRID = GRID[:height, :width]
        # determine final vmin/vmax
        vmin = float(np.nanmin(GRID))
        vmax = float(np.nanmax(GRID))
    else:
        # grid
        xi = np.linspace(min_lat, max_lat, height)
        yi = np.linspace(min_lon, max_lon, width)
        XI, YI = np.meshgrid(yi, xi)  # note: meshgrid uses (x=lon,y=lat)

        # inverse distance weighting
        # flatten grid
        grid_shape = XI.shape
        grid_x = XI.ravel()
        grid_y = YI.ravel()
        # compute distances to all stations
        stations = np.vstack([lats, lons]).T
        # for each grid point compute weighted average
        grid_vals = np.zeros(grid_x.shape)
        for i, (gx, gy) in enumerate(zip(grid_y, grid_x)):
            # distance in degrees (approx) between grid point (lat,gx?) careful with order: gx is lon, gy is lat
            d = np.sqrt((stations[:,0] - gy) ** 2 + (stations[:,1] - gx) ** 2)
            # handle zero distances
            if np.any(d == 0):
                grid_vals[i] = vals[d == 0][0]
                continue
            w = 1.0 / (d ** power)
            grid_vals[i] = np.sum(w * vals) / np.sum(w)

        GRID = grid_vals.reshape(grid_shape)

    # create image with matplotlib
    fig = plt.figure(figsize=(width/100, height/100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()
    # choose colormap (red hot) and interpolate
    cmap = plt.get_cmap('RdYlBu_r')
    vmin = float(np.nanmin(GRID))
    vmax = float(np.nanmax(GRID))
    im = ax.imshow(GRID, cmap=cmap, origin='lower', vmin=vmin, vmax=vmax, extent=(min_lon, max_lon, min_lat, max_lat), interpolation='bilinear')
    # make background transparent where no data? we have full grid from IDW so keep as is with alpha
    # add no axes, save as PNG
    buf = io.BytesIO()
    plt.savefig(buf, format='png', transparent=True)
    plt.close(fig)
    buf.seek(0)
    return APP.response_class(buf.getvalue(), mimetype='image/png')


@APP.route('/api/temperature/timeseries')
def timeseries():
    """Return aggregated time series for selected variables.
    Query params:
      freq: 'D' (daily), 'M' (monthly), 'Y' (yearly). Default 'D'.
      start, end: ISO dates to filter (optional)
      vars: comma-separated variables from t2m_c,d2m_c,sp_hpa,tcc (default all)
    """
    freq = request.args.get('freq', default='D')
    start = request.args.get('start')
    end = request.args.get('end')
    vars_q = request.args.get('vars')
    allowed = ['t2m_c', 'd2m_c', 'sp_hpa', 'tcc']
    vars_list = allowed if not vars_q else [v for v in vars_q.split(',') if v in allowed]

    sub = DF.copy()
    if start:
        sub = sub[sub['valid_time'] >= pd.to_datetime(start)]
    if end:
        sub = sub[sub['valid_time'] <= pd.to_datetime(end)]
    if sub.empty:
        return jsonify([])

    # resample across all locations by taking mean at each time bucket
    s = sub.set_index('valid_time')
    # convert freq to pandas rule
    rule = {'D': 'D', 'M': 'M', 'Y': 'Y'}.get(freq.upper(), 'D')
    agg = s[vars_list].resample(rule).mean().reset_index()
    # build response
    out = []
    for _, r in agg.iterrows():
        entry = {'timestamp': r['valid_time'].isoformat()}
        for v in vars_list:
            val = r.get(v)
            entry[v] = None if pd.isna(val) else float(val)
        out.append(entry)
    return jsonify(out)


@APP.route('/api/temperature/diurnal')
def diurnal():
    """Return average values by hour-of-day for provided filters.
    Query params: year, month (optional), hours=comma list (optional)
    """
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    hours_q = request.args.get('hours')
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify([])
    sub = sub.copy()
    sub['hour'] = sub['valid_time'].dt.hour
    group = sub.groupby('hour').agg({'t2m_c': 'mean', 'd2m_c': 'mean', 'sp_hpa': 'mean', 'tcc': 'mean'}).reset_index()
    if hours_q:
        hours = [int(h) for h in hours_q.split(',')]
        group = group[group['hour'].isin(hours)]
    result = []
    for _, r in group.iterrows():
        result.append({
            'hour': int(r['hour']),
            't2m_c': None if pd.isna(r['t2m_c']) else float(r['t2m_c']),
            'd2m_c': None if pd.isna(r['d2m_c']) else float(r['d2m_c']),
            'sp_hpa': None if pd.isna(r['sp_hpa']) else float(r['sp_hpa']),
            'tcc': None if pd.isna(r['tcc']) else float(r['tcc']),
        })
    return jsonify(result)


@APP.route('/api/temperature/cloud_scatter')
def cloud_scatter():
    """Return sampled pairs of (tcc, t2m_c) for scatter plotting."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    limit = request.args.get('limit', default=2000, type=int)
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify([])
    if limit and len(sub) > limit:
        sample = sub.sample(n=limit, random_state=5)
    else:
        sample = sub
    out = []
    for _, r in sample.iterrows():
        out.append({'tcc': None if pd.isna(r.get('tcc')) else float(r['tcc']), 't2m_c': float(r['t2m_c'])})
    return jsonify(out)


@APP.route('/api/temperature/boxplot')
def boxplot():
    # returns quartiles, whiskers and explicit outliers for the selected filter
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    # optional limit on number of outliers returned
    outlier_limit = request.args.get('limit', default=1000, type=int)
    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    if sub.empty:
        return jsonify({'count': 0, 'q1': None, 'q2': None, 'q3': None, 'iqr': None, 'lower_whisker': None, 'upper_whisker': None, 'outliers': []})
    temps = sub['t2m_c']
    q1 = float(temps.quantile(0.25))
    q2 = float(temps.quantile(0.5))
    q3 = float(temps.quantile(0.75))
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    # whiskers as min/max within bounds
    non_out = temps[(temps >= lower_bound) & (temps <= upper_bound)]
    if not non_out.empty:
        lower_whisker = float(non_out.min())
        upper_whisker = float(non_out.max())
    else:
        lower_whisker = float(temps.min())
        upper_whisker = float(temps.max())
    # find outliers
    out_rows = sub[(sub['t2m_c'] < lower_bound) | (sub['t2m_c'] > upper_bound)]
    outliers = []
    if not out_rows.empty:
        # limit the number of outliers returned to avoid huge payloads
        if outlier_limit and len(out_rows) > outlier_limit:
            out_sample = out_rows.sample(n=outlier_limit, random_state=4)
        else:
            out_sample = out_rows
        for _, r in out_sample.iterrows():
            outliers.append({
                'valid_time': r['valid_time'].isoformat(),
                'latitude': float(r['latitude']),
                'longitude': float(r['longitude']),
                'temp_c': float(r['t2m_c'])
            })

    result = {
        'count': int(len(temps)),
        'q1': q1,
        'q2': q2,
        'q3': q3,
        'iqr': iqr,
        'lower_whisker': lower_whisker,
        'upper_whisker': upper_whisker,
        'lower_bound': lower_bound,
        'upper_bound': upper_bound,
        'outliers': outliers
    }
    return jsonify(result)

# ---------------------------
#   PRECIPITATION ENDPOINTS
# ---------------------------

@APP.route('/api/precip/years')
def precip_years():
    years = sorted(DF['year'].unique().tolist())
    return jsonify(years)


@APP.route('/api/precip/yearly')
def precip_yearly():
    s = DF.groupby('year')['tp_mm'].mean().reset_index()
    result = [{'year': int(r['year']), 'tp_mm': float(r['tp_mm'])} for _, r in s.iterrows()]
    return jsonify(result)


@APP.route('/api/precip/monthly')
def precip_monthly():
    year = request.args.get('year', type=int)
    if year is None:
        return jsonify({'error': 'missing year'}), 400
    sub = DF[DF['year'] == year]
    s = sub.groupby('month')['tp_mm'].mean().reset_index()
    month_map = {int(r['month']): float(r['tp_mm']) for _, r in s.iterrows()}
    return [{'month': m, 'tp_mm': month_map.get(m, None)} for m in range(1, 13)]


@APP.route('/api/precip/daily')
def precip_daily():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    sub = DF[(DF['year'] == year) & (DF['month'] == month)]
    s = sub.groupby('day')['tp_mm'].mean().reset_index()
    return [{'day': int(r['day']), 'tp_mm': float(r['tp_mm'])} for _, r in s.iterrows()]


@APP.route('/api/precip/histogram')
def precip_histogram():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    sub = DF.copy()
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]
    temps = sub['tp_mm'].tolist()
    return jsonify(temps)

@APP.route('/api/precip/timeseries')
def precip_timeseries():
    """
    Return aggregated precipitation time series.
    Query params:
      freq: 'D', 'M', 'Y'
      start, end: ISO dates
      vars: comma-separated variables (only tp_mm used)
    """
    freq = request.args.get('freq', default='D')
    start = request.args.get('start')
    end = request.args.get('end')
    vars_q = request.args.get('vars')

    # Precip only uses tp_mm but keep interface consistent
    allowed = ['tp_mm']
    vars_list = allowed if not vars_q else [v for v in vars_q.split(',') if v in allowed]

    sub = DF_P.copy()

    if start:
        sub = sub[sub['valid_time'] >= pd.to_datetime(start)]
    if end:
        sub = sub[sub['valid_time'] <= pd.to_datetime(end)]
    if sub.empty:
        return jsonify([])

    s = sub.set_index('valid_time')

    rule = {'D': 'D', 'M': 'M', 'Y': 'Y'}.get(freq.upper(), 'D')
    agg = s[vars_list].resample(rule).sum().reset_index()

    out = []
    for _, r in agg.iterrows():
        entry = {'timestamp': r['valid_time'].isoformat()}
        for v in vars_list:
            val = r.get(v)
            entry[v] = None if pd.isna(val) else float(val)
        out.append(entry)

    return jsonify(out)

@APP.route('/api/precip/scatter')
def precip_scatter():
    """Return sampled pairs for scatter plotting."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    limit = request.args.get('limit', default=2000, type=int)

    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]

    if sub.empty:
        return jsonify([])

    # SAMPLE to avoid massive payloads (just like temperature)
    if limit and len(sub) > limit:
        sample = sub.sample(n=limit, random_state=7)
    else:
        sample = sub

    points = []
    for _, r in sample.iterrows():
        points.append({
            'latitude': float(r['latitude']),
            'longitude': float(r['longitude']),
            'tp_mm': None if pd.isna(r.get('tp_mm')) else float(r['tp_mm']),
            'tcc': None if pd.isna(r.get('tcc')) else float(r['tcc'])
        })

    return jsonify(points)

@APP.route('/api/precip/diurnal')
def precip_diurnal():
    """Return average precipitation values by hour-of-day for provided filters."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    hours_q = request.args.get('hours')

    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]

    if sub.empty:
        return jsonify([])

    sub = sub.copy()
    sub['hour'] = sub['valid_time'].dt.hour

    group = sub.groupby('hour').agg({'tp_mm': 'mean'}).reset_index()

    if hours_q:
        hours = [int(h) for h in hours_q.split(',')]
        group = group[group['hour'].isin(hours)]

    result = []
    for _, r in group.iterrows():
        result.append({
            'hour': int(r['hour']),
            'tp_mm': None if pd.isna(r['tp_mm']) else float(r['tp_mm']),
        })

    return jsonify(result)

@APP.route('/api/precip/histogram_daily')
def precip_histogram_daily():
    """Return histogram values for DAILY total precipitation."""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]

    if sub.empty:
        return jsonify([])

    # convert tp_mm to daily totals
    daily = sub.groupby(['year', 'month', 'day'])['tp_mm'].sum().reset_index()

    vals = daily['tp_mm'].tolist()
    return jsonify(vals)


@APP.route('/api/precip/boxplot')
def precip_boxplot():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    sub = DF.copy()
    if year is not None: sub = sub[sub['year'] == year]
    if month is not None: sub = sub[sub['month'] == month]
    vals = sub['tp_mm']
    q1 = float(vals.quantile(0.25))
    q2 = float(vals.quantile(0.5))
    q3 = float(vals.quantile(0.75))
    iqr = q3 - q1
    lb = q1 - 1.5 * iqr
    ub = q3 + 1.5 * iqr

    non_out = vals[(vals >= lb) & (vals <= ub)]
    lw = float(non_out.min()) if not non_out.empty else float(vals.min())
    uw = float(non_out.max()) if not non_out.empty else float(vals.max())

    outliers = []
    out_rows = sub[(vals < lb) | (vals > ub)]
    for _, r in out_rows.iterrows():
        outliers.append({
            'valid_time': r['valid_time'].isoformat(),
            'latitude': float(r['latitude']),
            'longitude': float(r['longitude']),
            'tp_mm': float(r['tp_mm'])
        })

    return jsonify({
        'count': len(vals),
        'q1': q1, 'q2': q2, 'q3': q3,
        'iqr': iqr,
        'lower_whisker': lw,
        'upper_whisker': uw,
        'lower_bound': lb,
        'upper_bound': ub,
        'outliers': outliers
    })
from flask_cors import cross_origin

@APP.route('/api/precip/heat_raster')
@cross_origin()
def precip_heat_raster():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    width = request.args.get('width', default=600, type=int)
    height = request.args.get('height', default=400, type=int)
    power = request.args.get('power', default=2.0, type=float)
    padding = request.args.get('padding', default=0.02, type=float)

    sub = DF_P
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]

    if sub.empty:
        return jsonify({'error': 'no precip data'}), 400

    # average precipitation per unique location
    pts = sub.groupby(['latitude', 'longitude'])['tp_mm'].mean().reset_index()
    lats = pts['latitude'].values
    lons = pts['longitude'].values
    vals = pts['tp_mm'].values

    # bbox
    min_lat, max_lat = lats.min(), lats.max()
    min_lon, max_lon = lons.min(), lons.max()
    lat_pad = (max_lat - min_lat) * padding or 0.01
    lon_pad = (max_lon - min_lon) * padding or 0.01
    min_lat -= lat_pad
    max_lat += lat_pad
    min_lon -= lon_pad
    max_lon += lon_pad

    # -------------------------------
    # SAME COARSE GRID AS TEMPERATURE
    # -------------------------------
    grid_cols = request.args.get('grid_cols', type=int)
    grid_rows = request.args.get('grid_rows', type=int)

    if grid_cols and grid_rows:
        lat_bins = np.linspace(min_lat, max_lat, grid_rows + 1)
        lon_bins = np.linspace(min_lon, max_lon, grid_cols + 1)
        grid_small = np.full((grid_rows, grid_cols), np.nan)
        counts = np.zeros((grid_rows, grid_cols), dtype=int)

        for lat, lon, val in zip(lats, lons, vals):
            r = np.searchsorted(lat_bins, lat, side='right') - 1
            c = np.searchsorted(lon_bins, lon, side='right') - 1
            if 0 <= r < grid_rows and 0 <= c < grid_cols:
                if np.isnan(grid_small[r, c]):
                    grid_small[r, c] = val
                else:
                    grid_small[r, c] += val
                counts[r, c] += 1

        mask = counts > 0
        grid_small[mask] = grid_small[mask] / counts[mask]

        # fill empty cells nearest-neighbour
        if np.any(np.isnan(grid_small)):
            coords = [(i, j) for i in range(grid_rows) for j in range(grid_cols)
                      if not np.isnan(grid_small[i, j])]
            for i in range(grid_rows):
                for j in range(grid_cols):
                    if np.isnan(grid_small[i, j]):
                        best = None
                        bestd = None
                        for ii, jj in coords:
                            d = (ii - i) ** 2 + (jj - j) ** 2
                            if best is None or d < bestd:
                                best = (ii, jj)
                                bestd = d
                        grid_small[i, j] = grid_small[best]

        repeat_y = max(1, height // grid_rows)
        repeat_x = max(1, width // grid_cols)
        GRID = np.kron(grid_small, np.ones((repeat_y, repeat_x)))
        GRID = GRID[:height, :width]

    else:
        # fallback IDW
        xi = np.linspace(min_lat, max_lat, height)
        yi = np.linspace(min_lon, max_lon, width)
        XI, YI = np.meshgrid(yi, xi)
        stations = np.vstack([lats, lons]).T
        grid_vals = np.zeros(XI.size)

        for i, (gx, gy) in enumerate(zip(YI.ravel(), XI.ravel())):
            d = np.sqrt((stations[:, 0] - gy)**2 + (stations[:, 1] - gx)**2)
            if np.any(d == 0):
                grid_vals[i] = vals[d == 0][0]
            else:
                w = 1.0 / (d ** power)
                grid_vals[i] = np.sum(vals * w) / np.sum(w)

        GRID = grid_vals.reshape(XI.shape)

    # render PNG
    fig = plt.figure(figsize=(width/100, height/100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_axis_off()

    cmap = plt.get_cmap('YlGnBu')
    ax.imshow(GRID, cmap=cmap, origin='lower',
              extent=(min_lon, max_lon, min_lat, max_lat))

    buf = io.BytesIO()
    plt.savefig(buf, format="png", transparent=True)
    plt.close(fig)
    buf.seek(0)

    return APP.response_class(buf.getvalue(), mimetype="image/png")

@APP.route("/api/temperature/correlation")
def correlation():
    # Variables to keep:
    cols = [
        "u10", "v10",
        "d2m", "t2m",
        "sp_hpa", "tcc",
        "slt",
        "tp"   # keep tp, remove tp_mm
    ]

    # filter to ONLY available columns
    available = [c for c in cols if c in DF.columns]

    sub = DF[available].dropna()

    # drop constant columns (zero variance)
    sub = sub.loc[:, sub.std() != 0]

    # compute correlation
    corr = sub.corr()

    # replace NaNs with 0
    corr = corr.fillna(0)

    return jsonify({
        "variables": corr.columns.tolist(),
        "matrix": corr.values.tolist()
    })

@APP.route('/api/temperature/wind_direction')
def wind_direction():
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)

    sub = DF
    if year is not None:
        sub = sub[sub['year'] == year]
    if month is not None:
        sub = sub[sub['month'] == month]

    if sub.empty:
        return jsonify([])

    # Return timestamp + wind_dir
    out = []
    for _, r in sub.iterrows():
        out.append({
            'timestamp': r['valid_time'].isoformat(),
            'wind_dir': float(r['wind_dir']),
            'u10': float(r['u10']),
            'v10': float(r['v10'])
        })

    return jsonify(out)


if __name__ == '__main__':
    APP.run(host='0.0.0.0', port=5000, debug=True)
