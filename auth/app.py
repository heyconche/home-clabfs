import os
import json
import time
import urllib.parse
import jwt
import bcrypt
from flask import Flask, request, redirect, render_template, make_response, jsonify

app = Flask(__name__)

SECRET    = os.environ['AUTH_SECRET']
USERNAME  = os.environ.get('AUTH_USERNAME', 'admin')
PASS_HASH = os.environ.get('AUTH_PASSWORD_HASH', '').encode()
COOKIE    = 'clabfs_session'
DOMAIN    = '.conche.com.br'
TTL       = 86400 * 7   # 7 days
LOGIN_URL = 'https://conche.com.br/login'
HOME_URL  = 'https://conche.com.br'

SAFE_HOSTS = {
    'conche.com.br',
    'nfs.conche.com.br',
    'cofre.conche.com.br',
    'soul.conche.com.br',
    'fotos.conche.com.br',
    'cloud.conche.com.br',
    'food.conche.com.br',
    'lift.conche.com.br',
}


def make_token() -> str:
    return jwt.encode(
        {'sub': USERNAME, 'exp': int(time.time()) + TTL},
        SECRET, algorithm='HS256'
    )


def valid_token(token: str) -> bool:
    try:
        jwt.decode(token, SECRET, algorithms=['HS256'])
        return True
    except Exception:
        return False


def check_password(password: str) -> bool:
    if not PASS_HASH:
        return False
    return bcrypt.checkpw(password.encode(), PASS_HASH)


def safe_next(url: str) -> str:
    """Only redirect to known safe hosts to prevent open redirect."""
    try:
        p = urllib.parse.urlparse(url)
        if p.netloc in SAFE_HOSTS:
            return url
    except Exception:
        pass
    return HOME_URL


@app.route('/verify')
def verify():
    """Called by Caddy forward_auth for every protected request."""
    token = request.cookies.get(COOKIE)
    if token and valid_token(token):
        return '', 200

    # Not authenticated — redirect to login with original URL as next
    host  = request.headers.get('X-Forwarded-Host', 'conche.com.br')
    uri   = request.headers.get('X-Forwarded-Uri', '/')
    proto = request.headers.get('X-Forwarded-Proto', 'https')
    next_url = urllib.parse.quote(f'{proto}://{host}{uri}', safe='')

    resp = make_response('', 302)
    resp.headers['Location'] = f'{LOGIN_URL}?next={next_url}'
    return resp


@app.route('/login', methods=['GET', 'POST'])
def login():
    next_url = safe_next(request.args.get('next', HOME_URL))
    error = None

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        next_url = safe_next(request.form.get('next', HOME_URL))

        if username == USERNAME and check_password(password):
            resp = make_response(redirect(next_url))
            resp.set_cookie(
                COOKIE, make_token(),
                domain=DOMAIN,
                httponly=True,
                secure=True,
                samesite='Lax',
                max_age=TTL,
            )
            return resp

        error = 'Usuário ou senha incorretos.'

    return render_template('login.html', error=error, next=next_url)


@app.route('/logout')
def logout():
    resp = make_response(redirect(LOGIN_URL))
    resp.delete_cookie(COOKIE, domain=DOMAIN, path='/')
    return resp


FOOD_MARKET_FILE = '/data/food-market.json'
FOOD_STATE_FILE = '/data/food-state.json'
LIFT_STATE_FILE = '/data/lift-state.json'


def _auth_ok() -> bool:
    token = request.cookies.get(COOKIE)
    return bool(token and valid_token(token))


@app.route('/food/market', methods=['GET'])
def food_market_get():
    if not _auth_ok():
        return '', 401
    try:
        with open(FOOD_MARKET_FILE) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify([])


@app.route('/food/market', methods=['POST'])
def food_market_post():
    if not _auth_ok():
        return '', 401
    data = request.get_json(force=True)
    os.makedirs(os.path.dirname(FOOD_MARKET_FILE), exist_ok=True)
    with open(FOOD_MARKET_FILE, 'w') as f:
        json.dump(data, f)
    return '', 204


@app.route('/food/state', methods=['GET'])
def food_state_get():
    if not _auth_ok():
        return '', 401
    try:
        with open(FOOD_STATE_FILE) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({})


@app.route('/food/state', methods=['POST'])
def food_state_post():
    if not _auth_ok():
        return '', 401
    data = request.get_json(force=True)
    os.makedirs(os.path.dirname(FOOD_STATE_FILE), exist_ok=True)
    with open(FOOD_STATE_FILE, 'w') as f:
        json.dump(data, f)
    return '', 204


@app.route('/lift/state', methods=['GET'])
def lift_state_get():
    if not _auth_ok():
        return '', 401
    try:
        with open(LIFT_STATE_FILE) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({})


@app.route('/lift/state', methods=['POST'])
def lift_state_post():
    if not _auth_ok():
        return '', 401
    data = request.get_json(force=True)
    os.makedirs(os.path.dirname(LIFT_STATE_FILE), exist_ok=True)
    with open(LIFT_STATE_FILE, 'w') as f:
        json.dump(data, f)
    return '', 204


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)
