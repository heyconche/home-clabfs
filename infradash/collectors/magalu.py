import os, requests

ID_MAGALU  = 'https://id.magalu.com'
MGC_API    = 'https://api.magalu.cloud'


def _get_token():
    """Exchange API Key credentials for an OAuth Bearer token."""
    r = requests.post(
        f'{ID_MAGALU}/oauth/token',
        json={
            'grant_type':    'client_credentials',
            'client_id':     os.environ['MAGALU_API_KEY_ID'],
            'client_secret': os.environ['MAGALU_API_KEY_SECRET'],
        },
        timeout=10,
    )
    if r.ok:
        return r.json().get('access_token')

    # Fallback: try API Key directly as bearer
    return os.environ.get('MAGALU_API_KEY')


def _headers(token):
    return {
        'Authorization': f'Bearer {token}',
        'X-API-Key':     os.environ.get('MAGALU_API_KEY', ''),
        'Content-Type':  'application/json',
    }


def get_costs():
    if not os.environ.get('MAGALU_API_KEY_ID'):
        raise ValueError('MAGALU_API_KEY_ID not configured')

    token = _get_token()
    h = _headers(token)

    # Try compute instances to confirm connectivity
    endpoints = [
        f'{MGC_API}/compute/v1/instances',
        f'{MGC_API}/v1/vms',
        'https://virtual-machine.jaxyendy.com/v1/instances',
        'https://virtual-machine.br-ne1.jaxyendy.com/v1/instances',
    ]

    last_status = None
    for url in endpoints:
        try:
            r = requests.get(url, headers=h, timeout=10)
            last_status = r.status_code
            if r.ok:
                data      = r.json()
                instances = data if isinstance(data, list) else data.get('results', data.get('instances', []))
                running   = sum(1 for i in instances if str(i.get('status', '')).lower() in ('running', 'active', 'started'))
                return {
                    'total':          None,
                    'currency':       'BRL',
                    'services':       [],
                    'note':           f'{running} VM(s) ativa(s) · {len(instances)} total',
                    'setup_required': True,
                    'setup_msg':      'MagaluCloud conectada. Billing API ainda não disponível publicamente.',
                }
            elif r.status_code == 401:
                raise ConnectionError(f'Credenciais inválidas (401)')
        except ConnectionError:
            raise
        except Exception:
            continue

    return {
        'total':          None,
        'currency':       'BRL',
        'services':       [],
        'note':           f'Último HTTP status: {last_status}',
        'setup_required': True,
        'setup_msg':      'MagaluCloud Billing API ainda não disponível publicamente. Aguardando liberação oficial.',
    }
