from flask import Flask, jsonify
import threading, time, os
from dotenv import load_dotenv
from collectors import aws as aws_col
from collectors import gcp as gcp_col
from collectors import oci as oci_col
from collectors import magalu as magalu_col

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')

_cache = {}
_lock  = threading.Lock()

CLOUD_TTL = 3600  # 1 hour


def cached(key, ttl, fn):
    with _lock:
        e = _cache.get(key)
        if e and (time.time() - e['ts']) < ttl:
            return e['data']
    try:
        data = fn()
        data['ok'] = True
    except Exception as ex:
        data = {'ok': False, 'error': str(ex)}
    with _lock:
        _cache[key] = {'data': data, 'ts': time.time()}
    return data


@app.route('/')
def index():
    return app.send_static_file('index.html')


@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'ts': time.time()})


@app.route('/api/costs')
def costs():
    return jsonify({
        'aws':    cached('aws',    CLOUD_TTL, aws_col.get_costs),
        'gcp':    cached('gcp',    CLOUD_TTL, gcp_col.get_costs),
        'oci':    cached('oci',    CLOUD_TTL, oci_col.get_costs),
        'magalu': cached('magalu', CLOUD_TTL, magalu_col.get_costs),
        'cached_at': time.time(),
    })


@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    with _lock:
        _cache.clear()
    return jsonify({'ok': True})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
