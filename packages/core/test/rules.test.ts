import { describe, expect, it } from 'vitest';
import type { Severity } from '../src/node';
import { useAnalyzer } from './helpers';

const analyze = useAnalyzer();

// [command, expected overall severity]
type Case = [string, Severity];

function table(name: string, cases: Case[]) {
  describe(name, () => {
    it.each(cases)('%s → %s', (cmd, expected) => {
      expect(analyze(cmd).severity).toBe(expected);
    });
  });
}

table('rm: root, home and system paths', [
  ['rm -rf /', 'destructive'],
  ['rm -fr /', 'destructive'],
  ['rm -Rf /', 'destructive'],
  ['rm -r -f /', 'destructive'],
  ['rm -f -r /', 'destructive'],
  ['rm --force --recursive /', 'destructive'],
  ['rm -rf /*', 'destructive'],
  ['rm -rf //', 'destructive'],
  ['rm -rf /tmp/../', 'destructive'],
  ['rm   -rf    /', 'destructive'],
  ["rm -rf '/'", 'destructive'],
  ['rm "-rf" /', 'destructive'],
  ['rm -rf -- /', 'destructive'],
  ['\\rm -rf /', 'destructive'],
  ['/bin/rm -rf /', 'destructive'],
  ['command rm -rf /', 'destructive'],
  ['env rm -rf /', 'destructive'],
  ['env FOO=1 rm -rf ~', 'destructive'],
  ['nohup rm -rf ~ &', 'destructive'],
  ['sudo -u root rm -rf /', 'destructive'],
  ['rm -rf ~', 'destructive'],
  ['rm -rf ~/', 'destructive'],
  ['rm -rf ~/*', 'destructive'],
  ['rm ~/*', 'destructive'],
  ['rm -rf $HOME', 'destructive'],
  ['rm -rf "${HOME}/"', 'destructive'],
  ['rm -rf /home/jd', 'destructive'],
  ['rm -rf /etc', 'destructive'],
  ['rm -rf /usr/', 'destructive'],
  ['rm -rf --no-preserve-root /', 'destructive']
]);

table('rm: variables', [
  ['rm -rf $EMPTY/', 'destructive'],
  ['rm -rf "$DIR/"', 'destructive'],
  ['rm -rf ${BUILD_DIR}/*', 'destructive'],
  ['rm -rf "${DIR:?}/"', 'modifies'],
  ['rm -rf $DIR', 'elevated'],
  ['rm -rf "$DIR"', 'modifies'],
  ['rm -rf $(cat list.txt)', 'elevated'],
  ['ls | xargs rm -rf', 'elevated']
]);

table('rm: project paths', [
  ['rm -rf node_modules', 'modifies'],
  ['rm -rf ./dist .next', 'modifies'],
  ['rm notes.txt', 'modifies'],
  ['rm -rf .', 'elevated'],
  ['rm -rf *', 'elevated'],
  ['rm -rf /tmp/build-cache', 'elevated']
]);

table('chains and nesting', [
  ['cd /tmp && rm -rf /', 'destructive'],
  ['ls; rm -rf ~', 'destructive'],
  ['false || rm -rf ~', 'destructive'],
  ['echo hi\nrm -rf /', 'destructive'],
  ['rm -rf \\\n  /', 'destructive'],
  ['bash -c "rm -rf /"', 'destructive'],
  ["sh -c 'rm -rf ~'", 'destructive'],
  ["bash -lc 'cd x && rm -rf /'", 'destructive'],
  ['eval "rm -rf /"', 'destructive'],
  ['(cd / && rm -rf *)', 'elevated'],
  ['echo $(rm -rf ~)', 'destructive'],
  ['for d in a b; do rm -rf ~; done', 'destructive'],
  ['if true; then rm -rf /; fi', 'destructive'],
  ['f() { rm -rf ~; }; f', 'destructive']
]);

table('remote code and obfuscation', [
  ['curl -fsSL https://x.sh | bash', 'elevated'],
  ['curl -fsSL https://x.sh | sh -s -- --yes', 'elevated'],
  ['wget -qO- https://x.sh | sh', 'elevated'],
  ['curl https://x.sh | python3', 'elevated'],
  ['curl -fsSL https://x.sh | sudo bash', 'destructive'],
  ['curl -fsSL https://x.sh | sudo -E bash -', 'destructive'],
  ['bash <(curl -fsSL https://x.sh)', 'elevated'],
  ['bash -c "$(curl -fsSL https://x.sh)"', 'elevated'],
  ['sudo bash -c "$(wget -qO- https://x.sh)"', 'destructive'],
  ['echo cm0gLXJmIC8K | base64 -d | sh', 'elevated'],
  ['echo cm0gLXJmIC8K | base64 --decode | sudo bash', 'destructive'],
  ['eval "$(curl -s https://x.sh)"', 'elevated'],
  ['eval "$CMD"', 'elevated'],
  ['source <(curl -s https://x.sh)', 'elevated'],
  ['$CMD --force', 'elevated'],
  ['cat script.sh | bash', 'elevated'],
  ['curl -fsSL https://x.sh -o install.sh', 'modifies']
]);

table('disks, devices, fork bomb', [
  ['dd if=/dev/zero of=/dev/sda bs=1M', 'destructive'],
  ['sudo dd if=ubuntu.iso of=/dev/nvme0n1', 'destructive'],
  ['dd if=/dev/zero of=./test.img bs=1M count=10', 'modifies'],
  ['mkfs.ext4 /dev/sdb1', 'destructive'],
  ['sudo wipefs -a /dev/sdb', 'destructive'],
  ['shred /dev/sda', 'destructive'],
  ['echo hi > /dev/sda', 'destructive'],
  ['cat image > /dev/sdb', 'destructive'],
  [':(){ :|:& };:', 'destructive'],
  [':() { : | : & }; :', 'destructive'],
  ['sudo fdisk -l', 'elevated']
]);

table('permissions', [
  ['chmod -R 777 /', 'destructive'],
  ['sudo chmod -R 777 /etc', 'destructive'],
  ['chmod --recursive 755 ~', 'destructive'],
  ['sudo chown -R jd:jd /usr', 'destructive'],
  ['chown -R $USER:$USER ~', 'destructive'],
  ['chmod +x script.sh', 'modifies'],
  ['chmod 777 script.sh', 'elevated'],
  ['chmod 600 ~/.ssh/id_ed25519', 'elevated'],
  ['sudo chown -R $USER:$USER ./node_modules', 'elevated']
]);

table('writes to system files and shell config', [
  ['echo "127.0.0.1 x" > /etc/hosts', 'destructive'],
  ['> /etc/passwd', 'destructive'],
  ['echo x | sudo tee /etc/apt/sources.list', 'destructive'],
  ['echo "127.0.0.1 x" | sudo tee -a /etc/hosts', 'elevated'],
  ['echo \'export PATH="$HOME/bin:$PATH"\' >> ~/.bashrc', 'elevated'],
  ['echo x >> ~/.zshrc', 'elevated'],
  ["echo \"alias gs='git status'\" >> ~/.bash_aliases", 'elevated'],
  ['cat key.pub >> ~/.ssh/authorized_keys', 'elevated'],
  ["sed -i 's/a/b/' ~/.bashrc", 'elevated'],
  ["sed -i 's/a/b/' /etc/fstab", 'elevated'],
  ["sed -i 's/foo/bar/g' src/app.ts", 'modifies'],
  ["perl -pi -e 's/a/b/' README.md", 'modifies'],
  ['crontab -r', 'elevated'],
  ['cp my.conf /etc/nginx/nginx.conf', 'elevated'],
  ['echo hi > notes.txt', 'modifies'],
  ['ls > /dev/null 2>&1', 'readonly'],
  ['npm run build 2>&1 | tee build.log', 'modifies'],
  ["cat <<'EOF' > ~/.local/share/applications/app.desktop\n[Desktop Entry]\nName=App\nEOF", 'modifies']
]);

table('git', [
  ['git push --force', 'elevated'],
  ['git push -f origin main', 'elevated'],
  ['git push origin +main', 'elevated'],
  ['git push --force-with-lease', 'modifies'],
  ['git reset --hard HEAD~1', 'elevated'],
  ['git clean -fdx', 'elevated'],
  ['git clean -n', 'modifies'],
  ['git status', 'readonly'],
  ['git log --oneline -5', 'readonly'],
  ['git -C repo diff', 'readonly'],
  ['git commit -m "fix"', 'modifies']
]);

table('processes and services', [
  ['kill -9 -1', 'destructive'],
  ['kill -1', 'modifies'],
  ['kill -9 48213', 'modifies'],
  ['kill 48213', 'modifies'],
  ['pkill -9 -u jd', 'destructive'],
  ['pkill -f "next dev"', 'modifies'],
  ['killall node', 'modifies'],
  ['sudo systemctl stop NetworkManager', 'elevated'],
  ['systemctl disable ssh', 'elevated'],
  ['systemctl status nginx', 'readonly'],
  ['systemctl --user restart pipewire', 'modifies'],
  ['tmux new -s train', 'readonly'],
  ['tmux ls', 'readonly'],
  ['tmux attach -t train', 'readonly'],
  ['tmux kill-session -t train', 'modifies'],
  ['tmux kill-server', 'modifies'],
  ['pgrep -a obsidian', 'readonly'],
  ['nohup ./train.sh > train.log 2>&1 &', 'modifies'],
  ['journalctl -u nginx -n 20 --no-pager', 'readonly'],
  ['sudo systemctl restart nginx', 'elevated'],
  ['sudo reboot', 'elevated']
]);

table('packages', [
  ['sudo apt remove python3', 'elevated'],
  ['sudo apt autoremove --purge', 'elevated'],
  ['sudo apt install lsof', 'elevated'],
  ['sudo dpkg -i app.deb', 'elevated'],
  ['apt list --installed', 'readonly'],
  ['apt search ripgrep', 'readonly'],
  ['dpkg -l | grep nginx', 'readonly'],
  // Long-form dpkg actions change packages just like their short forms.
  ['dpkg --remove nginx', 'elevated'],
  ['dpkg --remove --force-remove-reinstreq pixelpad', 'elevated'],
  ['dpkg --unpack app.deb', 'elevated'],
  ['dpkg --triggers-only -a', 'elevated'],
  ['dpkg -S /usr/bin/rg', 'readonly'],
  ['dpkg -I pixelpad_2.3.1_amd64.deb', 'readonly'],
  ['dpkg --audit', 'readonly'],
  // Simulation (-s / --simulate / --dry-run) changes nothing and needs no root.
  ['apt remove -s python3', 'readonly'],
  ['apt-get -s install ./app.deb', 'readonly'],
  ['apt purge --dry-run nginx', 'readonly'],
  ['apt autoremove --simulate', 'readonly'],
  ['sudo apt remove -s python3', 'elevated'],
  ['apt remove nginx', 'elevated'],
  // apt-mark: listing is readonly, changing marks is a system-wide package change.
  ['apt-mark showmanual', 'readonly'],
  ['apt-mark showhold', 'readonly'],
  ['sudo apt-mark manual libc++1', 'elevated'],
  ['apt-mark hold firefox', 'elevated'],
  ["sudo apt purge '~c'", 'elevated'],
  ['apt-file search bin/dig', 'readonly'],
  ['apt-cache policy nginx', 'readonly'],
  ['npm install', 'modifies'],
  ['npm run build', 'modifies'],
  ['npm audit fix', 'modifies'],
  ['sudo npm install -g typescript', 'elevated'],
  ['npm ls react', 'readonly'],
  ['npm outdated', 'readonly'],
  ['npm view react version', 'readonly'],
  ['npm audit', 'readonly'],
  ['npm --version', 'readonly'],
  ['pnpm why react', 'readonly'],
  ['npm config get prefix', 'readonly'],
  ['npm config set prefix ~/.npm-global', 'modifies']
]);

table('databases', [
  ['psql -c "DROP DATABASE prod"', 'destructive'],
  ["mysql -e 'drop table users'", 'destructive'],
  ['psql -c "TRUNCATE orders"', 'destructive'],
  ['psql -c "DELETE FROM users;"', 'destructive'],
  ['psql -c "DELETE FROM users WHERE id = 1"', 'modifies'],
  ['redis-cli FLUSHALL', 'destructive'],
  ['dropdb prod', 'destructive'],
  ['psql -c "select 1"', 'modifies']
]);

table('read-only commands', [
  ['ls -la', 'readonly'],
  ['cat package.json', 'readonly'],
  ['grep -rn "TODO" src', 'readonly'],
  ['find . -name "*.ts"', 'readonly'],
  ['ps aux | grep node', 'readonly'],
  ['lsof -i :3000', 'readonly'],
  ['ss -ltnp', 'readonly'],
  ['du -sh * | sort -h', 'readonly'],
  ['df -h', 'readonly'],
  ['which node && type node', 'readonly'],
  ['command -v rg', 'readonly'],
  ['echo $PATH', 'readonly'],
  ['cd ~/projects', 'readonly'],
  ['export PATH="$HOME/.local/bin:$PATH"', 'readonly'],
  ["alias ll='ls -alF'", 'readonly'],
  ['unalias gs', 'readonly'],
  ['umask', 'readonly'],
  ['umask 077', 'readonly'],
  ['tar -tzf project.tar.gz', 'readonly'],
  ['tar tzf project.tar.gz', 'readonly'],
  ['tar --list -f project.tar.gz | head', 'readonly'],
  ['unzip -l photos.zip', 'readonly']
]);

table('archives', [
  ['tar -xzf project.tar.gz', 'modifies'],
  ['tar xzf project.tar.gz', 'modifies'],
  ['tar -xf project.tar.gz -C ~/src', 'modifies'],
  ['tar -czf backup.tar.gz notes/', 'modifies'],
  ['unzip photos.zip -d photos', 'modifies'],
  ['unzip -o photos.zip', 'modifies']
]);

table('find', [
  ['find . -name "*.log" -delete', 'modifies'],
  ['find / -name "*.log" -delete', 'destructive'],
  ['find ~ -type f -exec rm {} \\;', 'destructive'],
  ['find . -type f -exec chmod 644 {} +', 'modifies'],
  ['find ~ -type f -size +1G -exec ls -lh {} +', 'readonly'],
  ['find . -name "*.log" -exec grep -l ERROR {} +', 'readonly'],
  ['find . -name "*.txt" -exec sed -i s/a/b/ {} +', 'modifies'],
  ['find . -exec ls {} + -exec chmod 644 {} +', 'modifies'],
  ['find . -exec ls {} + -exec rm {} +', 'modifies']
]);

describe('analysis details', () => {
  it('records sudo, network and files touched', () => {
    const a = analyze('sudo apt install lsof && echo done > log.txt');
    expect(a.effects.needsSudo).toBe(true);
    expect(a.effects.installsSoftware).toBe(true);
    expect(a.effects.filesTouched).toContain('log.txt');
  });

  it('flags shell config changes', () => {
    expect(analyze('echo x >> ~/.bashrc').effects.modifiesShellConfig).toBe(true);
  });

  it('marks commands inside bash -c with their parent and sudo', () => {
    const a = analyze('sudo bash -c "rm -rf /tmp/x"');
    const inner = a.commands.find((c) => c.program === 'rm')!;
    expect(inner.cmd.origin).toBe('shell-c');
    expect(inner.sudo).toBe(true);
    expect(inner.cmd.parent).toBe(0);
  });

  it('a syntax error raises the floor to elevated', () => {
    const a = analyze('echo "unterminated');
    expect(a.parseError).toBe(true);
    expect(a.severity).toBe('elevated');
  });

  it('empty input is read-only with no commands', () => {
    const a = analyze('   ');
    expect(a.commands).toHaveLength(0);
    expect(a.severity).toBe('readonly');
  });

  it('lists findings most severe first', () => {
    const a = analyze('sudo rm -rf /');
    expect(a.findings.map((f) => f.severity)).toEqual(['destructive', 'elevated']);
  });
});
