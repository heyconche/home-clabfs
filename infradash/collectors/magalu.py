import os, requests

MGC_API = 'https://api.magalu.cloud'


def _headers():
    return {
        'X-API-KEY': os.environ['MAGALU_API_KEY'],
        'Content-Type': 'application/json',
    }


def get_costs():
    if not os.environ.get('MAGALU_API_KEY'):
        raise ValueError('MAGALU_API_KEY not configured')

    h = _headers()

    # Try billing endpoint
    try:
        r = requests.get(f'{MGC_API}/billing/v1/costs', headers=h, timeout=10)
        if r.ok:
            data = r.json()
            services = [
                {'name': s.get('name', 'Unknown'), 'cost': float(s.get('cost', 0))}
                for s in data.get('services', [])
                if float(s.get('cost', 0)) > 0
            ]
            return {
                'total':    round(sum(s['cost'] for s in services), 4),
                'currency': 'BRL',
                'services': services,
            }
    except Exception:
        pass

    # Fallback: list running VMs to confirm connectivity
    try:
        r = requests.get(f'{MGC_API}/compute/v1/instances', headers=h, timeout=10)
        if r.ok:
            instances = r.json().get('results', r.json() if isinstance(r.json(), list) else [])
            running   = sum(1 for i in instances if str(i.get('status', '')).lower() in ('running', 'active'))
            return {
                'total':          None,
                'currency':       'BRL',
                'services':       [],
                'note':           f'{running} VM(s) ativa(s) · {len(instances)} total',
                'setup_required': True,
                'setup_msg':      'API conectada. Endpoint de billing em desenvolvimento para MagaluCloud.',
            }
    except Exception:
        pass

    # Could not connect
    raise ConnectionError('Não foi possível conectar à API da MagaluCloud. Verifique as credenciais.')
