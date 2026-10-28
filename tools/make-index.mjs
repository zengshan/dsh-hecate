/**
 * Regenerate market-index.json from this checkout.
 *
 * The market installs a Git entry by exact commit, so the index must be rebuilt
 * after every push: `node tools/make-index.mjs`. No child process is spawned —
 * the commit is read straight from .git, which keeps this runnable under a
 * sandbox that forbids piped stdio.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

function headCommit() {
  const head = readFileSync(join(root, '.git', 'HEAD'), 'utf8').trim()
  if (!head.startsWith('ref: ')) return head
  const ref = head.slice('ref: '.length).trim()
  try {
    return readFileSync(join(root, '.git', ...ref.split('/')), 'utf8').trim()
  } catch {
    // Packed refs after a gc.
    const packed = readFileSync(join(root, '.git', 'packed-refs'), 'utf8')
    for (const line of packed.split('\n')) {
      const [sha, name] = line.trim().split(' ')
      if (name === ref) return sha
    }
    throw new Error(`cannot resolve ${ref} from .git`)
  }
}

const commit = headCommit()
const repo = pkg.repository.url.replace(/^git\+/u, '').replace(/\.git$/u, '')
const raw = repo.replace('https://github.com/', 'https://raw.githubusercontent.com/') + '/main'

const index = {
  format: 1,
  title: { en: 'Hecate', zh: '赫卡忒' },
  description: {
    en: 'Session console for DSH: every workspace on one screen, ordered by who needs you.',
    zh: 'DSH 会话控制台：所有工作区的会话一屏看完，按“谁需要你”排序。',
  },
  metadata: {
    categories: { productivity: { title: { en: 'Productivity', zh: '效率' } } },
    labels: { ui: { title: { en: 'UI', zh: '界面' } } },
  },
  plugins: [
    {
      name: pkg.name,
      title: { en: 'Hecate — Session Console', zh: '赫卡忒 · 会话控制台' },
      description: {
        en: 'Every session across every workspace on one screen. Finished ones wait for your tick and turn red when overdue; hover to read the latest reply.',
        zh: '所有工作区的会话一张卡片网格；刚跑完的会一直等你，超时变红置顶，悬停即可预览最新回复。',
      },
      icon: raw + '/icon.svg',
      author: pkg.author,
      homepage: pkg.homepage,
      repository: { url: repo },
      metadata: {
        category: 'productivity',
        labels: ['ui'],
        keywords: ['session', 'switcher', 'console', 'hecate'],
      },
      versions: [
        {
          version: pkg.version,
          publishTimestamp: Math.floor(Date.now() / 1000),
          source: { type: 'git', url: repo, commit },
          engines: pkg.engines,
        },
      ],
    },
  ],
}

writeFileSync(join(root, 'market-index.json'), JSON.stringify(index, null, 2) + '\n')
console.log(`market-index.json written for ${pkg.name}@${pkg.version} at ${commit.slice(0, 7)}`)
