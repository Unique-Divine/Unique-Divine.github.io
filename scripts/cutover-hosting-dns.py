#!/usr/bin/env python3
"""Switch the personal site to Firebase only after ownership and HTTPS are ready."""
import json
from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent.parent
PROJECT = 'exalted-justice-359714'
ACCOUNT = 'realuniquedivine@gmail.com'
DOMAINS = {'uniquedivine.com', 'www.uniquedivine.com'}
TARGET = '199.36.158.100'
SCOPE = ['--zone=uniquedivine-com', '--project=' + PROJECT, '--account=' + ACCOUNT, '--quiet']

def cloud(*args):
    return subprocess.run(['gcloud', 'dns', 'record-sets', *args, *SCOPE],
                          check=True, capture_output=True, text=True).stdout

def main():
    state = json.loads(subprocess.run([
        sys.executable, str(ROOT / 'scripts/google-api.py'), 'GET',
        'firebasehosting.googleapis.com',
        '/v1beta1/projects/' + PROJECT + '/sites/uniquedivine-site/customDomains',
    ], check=True, capture_output=True, text=True).stdout)
    domains = {d['name'].rsplit('/', 1)[1]: d for d in state.get('customDomains', [])}
    pending = False
    for name in sorted(DOMAINS):
        domain = domains.get(name, {})
        ownership = domain.get('ownershipState', 'missing')
        cert = domain.get('cert', {}).get('state', 'missing')
        print(f'{name}: {ownership}, {cert}', flush=True)
        if ownership != 'OWNERSHIP_ACTIVE' or cert not in {'CERT_ACTIVE', 'CERT_EXPIRING_SOON'}:
            pending = True
    if pending:
        print('Website records retained until Firebase verification completes.', file=sys.stderr)
        return 3
    # Verify actual TLS serving before moving traffic, not just API status.
    for name in sorted(DOMAINS):
        subprocess.run(['curl', '--fail', '--silent', '--show-error', '--head',
                        '--max-time', '30', '--resolve', f'{name}:443:{TARGET}',
                        '--output', '/dev/null', 'https://' + name + '/'], check=True)
    existing = {(r['name'], r['type']): r for r in json.loads(cloud('list', '--format=json'))}
    desired = {
        ('uniquedivine.com.', 'A'): [TARGET],
        ('www.uniquedivine.com.', 'CNAME'): ['uniquedivine-site.web.app.'],
    }
    allowed = {
        ('uniquedivine.com.', 'A'): {'185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'},
        ('www.uniquedivine.com.', 'CNAME'): {'unique-divine.github.io.'},
    }
    changes = []
    for key, values in desired.items():
        current = existing.get(key)
        if current and set(current['rrdatas']) == set(values):
            continue
        removals = [current] if current else []
        if not current and key == ('www.uniquedivine.com.', 'CNAME'):
            address = existing.get(('www.uniquedivine.com.', 'A'))
            ownership = existing.get(('www.uniquedivine.com.', 'TXT'))
            if (not address or set(address['rrdatas']) != allowed[('uniquedivine.com.', 'A')]
                    or not ownership or set(ownership['rrdatas']) != {'"hosting-site=uniquedivine-site"'}):
                raise ValueError('Unexpected www ownership staging records')
            removals = [address, ownership]
        elif not current or set(current['rrdatas']) != allowed[key]:
            raise ValueError('Unexpected current website record: ' + repr(key))
        changes.append((key, values, removals))
    if changes:
        with tempfile.TemporaryDirectory(prefix='hosting-cutover-') as directory:
            transaction = '--transaction-file=' + str(Path(directory) / 'transaction.yaml')
            cloud('transaction', 'start', transaction)
            for (name, kind), values, removals in changes:
                for record in removals:
                    cloud('transaction', 'remove', *record['rrdatas'], '--name=' + record['name'],
                          '--type=' + record['type'], '--ttl=' + str(record['ttl']), transaction)
                cloud('transaction', 'add', *values, '--name=' + name,
                      '--type=' + kind, '--ttl=300', transaction)
            cloud('transaction', 'execute', transaction)
    print(f'Firebase website routing ready; {len(changes)} record sets changed.')
    return 0

if __name__ == '__main__':
    sys.exit(main())
