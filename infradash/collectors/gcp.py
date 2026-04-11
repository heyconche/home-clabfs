import os
from datetime import datetime
from google.oauth2 import service_account
from google.cloud import bigquery


def get_costs():
    creds_path = os.getenv('GCP_CREDENTIALS_PATH', '/app/credentials/gcp.json')
    project_id = os.getenv('GCP_PROJECT_ID', '')
    bq_table   = os.getenv('GCP_BIGQUERY_TABLE', '')  # e.g. project.dataset.gcp_billing_export_v1_*

    # Without BigQuery billing export, we cannot get cost data from GCP
    if not bq_table:
        return {
            'total':          None,
            'currency':       'USD',
            'services':       [],
            'setup_required': True,
            'setup_msg':      (
                'Enable BigQuery billing export: '
                'GCP Console → Billing → Billing export → BigQuery export. '
                'Then set GCP_BIGQUERY_TABLE=project.dataset.table in .env'
            ),
        }

    creds = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=['https://www.googleapis.com/auth/cloud-platform'],
    )
    bq_location = os.getenv('GCP_BIGQUERY_LOCATION', 'southamerica-east1')
    client = bigquery.Client(credentials=creds, project=project_id)

    start = datetime.now().strftime('%Y-%m-01')
    query = f"""
        SELECT
            service.description AS service,
            ROUND(SUM(cost), 4)  AS total
        FROM `{bq_table}`
        WHERE DATE(usage_start_time) >= '{start}'
          AND cost > 0
        GROUP BY service
        ORDER BY total DESC
        LIMIT 10
    """

    job_config = bigquery.QueryJobConfig()
    rows     = list(client.query(query, job_config=job_config, location=bq_location).result())
    services = [{'name': r['service'], 'cost': float(r['total'])} for r in rows]
    total    = sum(s['cost'] for s in services)

    return {
        'total':    round(total, 4),
        'currency': 'USD',
        'period':   f'{start} → hoje',
        'services': services,
    }
