#!/usr/bin/env node
import { spawn } from 'child_process';
import chokidar from 'chokidar';
import path from 'path';

const root = path.resolve(process.cwd());
const watchFiles = [
  path.join(root, 'UI-REFINEMENT-GUIDE.md'),
  path.join(root, 'README.md'),
  path.join(root, 'frontend', 'README.md'),
];

let timer = null;
const debounceMs = 1000;

function runIndexer() {
  console.log(new Date().toISOString(), 'Running doc indexer...');
  const p = spawn('node', ['./scripts/index-docs.mjs'], { stdio: 'inherit' });
  p.on('close', code => console.log('Indexer exited', code));
}

const watcher = chokidar.watch(watchFiles, { ignoreInitial: true });
watcher.on('all', (evt, p) => {
  console.log('File change detected:', evt, p);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { runIndexer(); timer = null; }, debounceMs);
});

console.log('Watching docs for changes to auto-reindex:', watchFiles);
// run once on start
runIndexer();
