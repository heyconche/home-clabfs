import boto3, os
from datetime import datetime


def get_costs():
    client = boto3.client(
        'ce',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
    )

    start = datetime.now().strftime('%Y-%m-01')
    end   = datetime.now().strftime('%Y-%m-%d')

    # Avoid same start/end (first day of month)
    if start == end:
        return {'total': 0.0, 'currency': 'USD', 'period': start, 'services': []}

    r = client.get_cost_and_usage(
        TimePeriod={'Start': start, 'End': end},
        Granularity='MONTHLY',
        Metrics=['BlendedCost'],
        GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}],
    )

    services = []
    total = 0.0
    for g in r['ResultsByTime'][0]['Groups']:
        val = float(g['Metrics']['BlendedCost']['Amount'])
        if val > 0.001:
            services.append({'name': g['Keys'][0], 'cost': round(val, 4)})
            total += val

    services.sort(key=lambda x: x['cost'], reverse=True)

    return {
        'total':    round(total, 4),
        'currency': 'USD',
        'period':   f'{start} → {end}',
        'services': services[:8],
    }
