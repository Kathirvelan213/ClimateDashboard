from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import os

APP = Flask(__name__)
CORS(APP)

DATA_PATH = os.path.join(os.path.dirname(__file__), 'assets', 'Dataset', 'combined_instant_temp.csv')


def load_and_prepare():
    # Read CSV with parse_dates for the valid_time column
    df = pd.read_csv(DATA_PATH, parse_dates=['valid_time'])
    # convert Kelvin to Celsius
    df['t2m_c'] = df['t2m'] - 273.15
    df['year'] = df['valid_time'].dt.year
    df['month'] = df['valid_time'].dt.month
    df['day'] = df['valid_time'].dt.day
    return df


DF = load_and_prepare()


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


if __name__ == '__main__':
    APP.run(host='0.0.0.0', port=5000, debug=True)
