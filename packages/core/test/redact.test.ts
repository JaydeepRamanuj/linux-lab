import { describe, expect, it } from 'vitest';
import { redact } from '../src/node';

describe('redact', () => {
  it.each([
    ['curl -H "Authorization: Bearer abcdef123456" x', 'bearer', 'abcdef123456'],
    ['curl -H "X-Api-Key: k_9f8e7d6c5b4a" x', 'api-key-header', 'k_9f8e7d6c5b4a'],
    ['export ANTHROPIC_API_KEY=sk-ant-api03-abcdefghij1234567890', 'anthropic-key', 'sk-ant-api03-abcdefghij1234567890'],
    ['OPENAI_KEY=sk-proj-abcdefghijklmnopqrstuvwx node app.js', 'openai-key', 'sk-proj-abcdefghijklmnopqrstuvwx'],
    ['git clone https://ghp_abcdefghijklmnopqrstuvwxyz0123456789@github.com/x/y', 'github-token', 'ghp_abcdefghijklmnopqrstuvwxyz0123456789'],
    ['gh auth login --with-token github_pat_11ABCDEFG0123456789abcdef', 'github-token', 'github_pat_11ABCDEFG0123456789abcdef'],
    ['SLACK=xoxb-1234567890-abcdefghij', 'slack-token', 'xoxb-1234567890-abcdefghij'],
    ['aws configure set aws_access_key_id AKIAIOSFODNN7EXAMPLE', 'aws-access-key', 'AKIAIOSFODNN7EXAMPLE'],
    ['DB_PASSWORD=hunter2 npm start', 'secret-variable', 'hunter2'],
    ['JWT_SECRET="my secret value" node x', 'secret-variable', '"my secret value"'],
    ['psql postgres://admin:s3cr3t@db.example.com/app', 'url-credentials', 's3cr3t'],
    ['mysql --password=hunter2 -u root', 'password-flag', 'hunter2'],
    ['curl -d "payload=Zx9Kq2Lm8Np4Rs6Tv1Wy3Ab5Cd7Ef0GhJ" x', 'high-entropy', 'Zx9Kq2Lm8Np4Rs6Tv1Wy3Ab5Cd7Ef0GhJ']
  ])('%s', (input, kind, secret) => {
    const r = redact(input);
    expect(r.text).not.toContain(secret);
    expect(r.masked.map((m) => m.kind)).toContain(kind);
    expect(r.text).toContain(`[REDACTED:${kind}]`);
  });

  it('counts several values and keeps the rest of the command', () => {
    const r = redact('API_TOKEN=abc123xyz curl -H "Authorization: Bearer t0k3n" https://u:p4ss@host/x');
    expect(r.masked).toHaveLength(3);
    expect(r.text).toBe('API_TOKEN=[REDACTED:secret-variable] curl -H "Authorization: Bearer [REDACTED:bearer]" https://u:[REDACTED:url-credentials]@host/x');
  });

  it.each([
    'git checkout a3f9c2e1b4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9',
    'sha256sum ubuntu-24.04.1-desktop-amd64.iso',
    'export TOKEN=$GITHUB_TOKEN',
    'ls /usr/lib/x86_64-linux-gnu/gstreamer-1.0',
    'npm install @tanstack/react-query-devtools-production',
    'rm -rf node_modules && npm install'
  ])('leaves %s alone', (input) => {
    expect(redact(input)).toEqual({ text: input, masked: [] });
  });
});
