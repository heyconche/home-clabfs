import oci, os
from datetime import datetime, timezone


def get_costs():
    config = {
        'user':        os.environ['OCI_USER_OCID'],
        'fingerprint': os.environ['OCI_FINGERPRINT'],
        'tenancy':     os.environ['OCI_TENANCY_OCID'],
        'region':      os.environ['OCI_REGION'],
        'key_file':    os.getenv('OCI_KEY_FILE', '/app/credentials/oci.pem'),
    }
    oci.config.validate_config(config)

    client = oci.usage_api.UsageapiClient(config)

    now   = datetime.now(timezone.utc)
    start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    details = oci.usage_api.models.RequestSummarizedUsagesDetails(
        tenant_id=config['tenancy'],
        time_usage_started=start.isoformat(),
        time_usage_ended=now.isoformat(),
        granularity='MONTHLY',
        group_by=['service'],
    )

    response = client.request_summarized_usages(details)

    services = []
    total = 0.0
    for item in response.data.items:
        cost = float(item.computed_amount or 0)
        if cost > 0.001:
            services.append({'name': item.service or 'Other', 'cost': round(cost, 4)})
            total += cost

    services.sort(key=lambda x: x['cost'], reverse=True)

    return {
        'total':    round(total, 4),
        'currency': 'USD',
        'period':   f'{start.strftime("%Y-%m-%d")} → {now.strftime("%Y-%m-%d")}',
        'services': services[:8],
    }
