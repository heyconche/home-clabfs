import os, requests

MGC_API = 'https://api.magalu.cloud'


def _headers():
    return {
        'X-API-Key': os.environ['MAGALU_API_KEY'],
        'Content-Type': 'application/json',
    }


def _try_get(path):
    r = requests.get(f'{MGC_API}{path}', headers=_headers(), timeout=10)
    return r


def get_costs():
    if not os.environ.get('MAGALU_API_KEY'):
        raise ValueError('MAGALU_API_KEY not configured')

    # Try known MagaluCloud API paths
    paths_to_try = [
        '/compute/v1/instances',
        '/v1/compute/instances',
        '/v0/vms',
    ]

    for path in paths_to_try:
        try:
            r = _try_get(path)
            if r.ok:
                data = r.json()
                instances = data if isinstance(data, list) else data.get('results', data.get('instances', []))
                running   = sum(1 for i in instances if str(i.get('status', '')).lower() in ('running', 'active', 'started'))
                return {
                    'total':          None,
                    'currency':       'BRL',
                    'services':       [],
                    'note':           f'{running} VM(s) ativa(s) · {len(instances)} total',
                    'setup_required': True,
                    'setup_msg':      'API MagaluCloud conectada. Billing API em desenvolvimento.',
                }
            elif r.status_code == 401:
                raise ConnectionError(f'Credenciais inválidas (401): {r.text[:200]}')
        except ConnectionError:
            raise
        except Exception:
            continue

    raise ConnectionError('Não foi possível conectar à API da MagaluCloud. Endpoint não encontrado.')
