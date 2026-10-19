#!/usr/bin/env python3
"""Populate the personal Cloud DNS zone without changing registrar delegation."""
import argparse
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
PROJECT = 'exalted-justice-359714'
ACCOUNT = 'realuniquedivine@gmail.com'
ZONE = 'uniquedivine-com'

def cloud(*args):
    return subprocess.run(['gcloud', 'dns', 'record-sets', *args,
                           '--zone=' + ZONE, '--project=' + PROJECT,
                           '--account=' + ACCOUNT, '--quiet'],
                          check=True, capture_output=True, text=True).stdout

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verification-only', action='store_true', help='Keep existing website A/CNAME records while preparing certificates')
    args = parser.parse_args()
    state = json.loads(subprocess.run([
        sys.executable, str(ROOT / 'scripts/google-api.py'), 'GET',
        'firebasehosting.googleapis.com',
        '/v1beta1/projects/' + PROJECT + '/sites/uniquedivine-site/customDomains',
    ], check=True, capture_output=True, text=True).stdout)
    desired = {}
    evidence = []
    for domain in state.get('customDomains', []):
        groups = domain.get('requiredDnsUpdates', {}).get('desired', [])
        groups += domain.get('cert', {}).get('verification', {}).get('dns', {}).get('desired', [])
        for group in groups:
            for record in group.get('records', []):
                if record.get('requiredAction') == 'REMOVE':
                    continue
                name = record['domainName'].rstrip('.') + '.'
                kind = record['type']
                if name != 'uniquedivine.com.' and not name.endswith('.uniquedivine.com.'):
                    raise ValueError('Refusing record outside the personal domain')
                if kind not in {'TXT', 'A', 'AAAA', 'CNAME'}:
                    raise ValueError('Unexpected Firebase DNS record type')
                value = record['rdata']
                if kind == 'TXT':
                    value = json.dumps(value)
                elif kind == 'CNAME':
                    value = value.rstrip('.') + '.'
                evidence.append(record)
                if not args.verification_only or kind == 'TXT':
                    desired.setdefault((name, kind), set()).add(value)
    if not desired:
        raise ValueError('Firebase returned no desired DNS records')
    existing = {(r['name'], r['type']): r for r in json.loads(cloud('list', '--format=json'))}
    changes = []
    for (name, kind), values in sorted(desired.items()):
        current = existing.get((name, kind))
        if current:
            old = set(current['rrdatas'])
            if kind == 'TXT':
                values |= old
            elif old != values:
                raise ValueError(f'Refusing to replace conflicting existing {name} {kind}')
            if old == values:
                continue
        changes.append((name, kind, sorted(values), current))
    if changes:
        with tempfile.TemporaryDirectory(prefix='hosting-dns-') as directory:
            transaction = '--transaction-file=' + str(Path(directory) / 'transaction.yaml')
            cloud('transaction', 'start', transaction)
            for name, kind, values, current in changes:
                if current:
                    cloud('transaction', 'remove', *current['rrdatas'], '--name=' + name,
                          '--type=' + kind, '--ttl=' + str(current['ttl']), transaction)
                cloud('transaction', 'add', *values, '--name=' + name,
                      '--type=' + kind, '--ttl=300', transaction)
            cloud('transaction', 'execute', transaction)
    (ROOT / 'docs/domain-dns.json').write_text(json.dumps({'records': evidence}, indent=2) + '\n')
    print(f'Configured {len(changes)} record sets in {ZONE}. Registrar delegation was not changed.')

if __name__ == '__main__':
    main()
