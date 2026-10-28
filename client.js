window.__ModuleLoader__.load({
  id: 'dsh-hecate',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'session-hub'
    const PANEL_ID = 'session-hub'
    const MAX_ROWS = 300
    // No machine path is baked in: the console workspace is recognised by the
    // host-configured path (never shipped), its default title, or the default
    // `~/.dsh-hub` directory name.
    const HUB_PATH = ''
    const HUB_TITLE = '控制台'
    const SKIN_KEY = 'dsh-hecate:skin'
    const FONT_KEY = 'dsh-hecate:font'
    const FINISHED_KEY = 'dsh-hecate:finished'
    const FONT_DEFAULT = 15
    const FONT_MIN = 12
    const FONT_MAX = 22
    const URGENT_MS = 5 * 60 * 1000
    const TICK_MS = 30000
    const NO_STATUS = new Map()

    /* ------------------------------------------------------------------ *
     * 1. 字典                                                             *
     * ------------------------------------------------------------------ */

    const zh = {
      panel: '控制台',
      title: '控制台',
      summary: '{total} 个会话 · {running} 个在跑 · {waiting} 个等你',
      'range.running': '进行中',
      'range.all': '全部',
      'range.label': '切换范围',
      'window.hour': '1小时',
      'window.day': '今天',
      'window.week': '本周',
      'window.label.hour': '最近 1 小时',
      'window.label.day': '今天（自然日，过 12 点算新的一天）',
      'window.label.week': '本周（自然周，周一零点起）',
      'font.smaller': '缩小字号',
      'font.larger': '放大字号',
      empty: '还没有会话',
      'empty.running': '当前没有进行中的会话',
      'empty.hour': '最近 1 小时没有活动过的会话',
      'empty.day': '今天还没有活动过的会话',
      'empty.week': '本周还没有活动过的会话',
      'empty.toDay': '看今天',
      'empty.toWeek': '看本周',
      'row.blank': '新会话',
      'state.running': '运行中',
      'state.approval': '等你审批',
      'state.question': '等你回答',
      'state.plan': '计划待确认',
      'state.done': '刚跑完',
      'state.idle': '空闲',
      'group.hub': '控制台',
      'group.overdue': '超时未处理',
      'group.needs': '需要你看',
      'group.running': '进行中',
      'group.today': '今天',
      'group.earlier': '更早',
      'group.ungrouped': '未归类',
      'ack.label': '标记已处理',
      'action.rename': '重命名',
      'action.archive': '归档',
      'rename.hint': '回车保存 · Esc 取消',
      'create.label': '新建会话',
      'create.title': '在哪个工作区新建',
      'create.hub': '控制台',
      'preview.you': '你',
      'preview.agent': '它',
      'preview.loading': '读取中…',
      'preview.empty': '没有可预览的内容',
      'preview.error': '预览读取失败',
      'preview.network': '请求没有发出去',
      'preview.cold': '会话未激活，点卡片查看',
      'preview.detail': '（{n} 条记录，最后 {type}）',
      'preview.foot': '只读预览 · 点卡片才进入会话',
      hint: '点一张卡片进入该会话；这里只做切换，不读取上下文',
      more: '还有 {n} 个会话未显示',
      'time.justNow': '刚刚',
      'time.minutes': '{n} 分钟前',
      'time.hours': '{n} 小时前',
      'time.days': '{n} 天前',
      'time.unhandledMinutes': '已 {n} 分钟未处理',
      'time.unhandledHours': '已 {n} 小时未处理',
      'time.unhandledDays': '已 {n} 天未处理',
    }

    const en = {
      panel: 'Console',
      title: 'Console',
      summary: '{total} sessions · {running} running · {waiting} need you',
      'range.running': 'Active',
      'range.all': 'All',
      'range.label': 'Change range',
      'window.hour': '1h',
      'window.day': 'Today',
      'window.week': 'Week',
      'window.label.hour': 'Last hour',
      'window.label.day': 'Today (calendar day, resets at midnight)',
      'window.label.week': 'This week (calendar week, from Monday)',
      'font.smaller': 'Smaller text',
      'font.larger': 'Larger text',
      empty: 'No sessions yet',
      'empty.running': 'Nothing is in flight right now',
      'empty.hour': 'Nothing active in the last hour',
      'empty.day': 'Nothing active today yet',
      'empty.week': 'Nothing active this week yet',
      'empty.toDay': 'Today',
      'empty.toWeek': 'This week',
      'row.blank': 'New session',
      'state.running': 'Running',
      'state.approval': 'Waiting for approval',
      'state.question': 'Waiting for an answer',
      'state.plan': 'Plan needs review',
      'state.done': 'Just finished',
      'state.idle': 'Idle',
      'group.hub': 'Console',
      'group.overdue': 'Overdue',
      'group.needs': 'Needs you',
      'group.running': 'Running',
      'group.today': 'Today',
      'group.earlier': 'Earlier',
      'group.ungrouped': 'Ungrouped',
      'ack.label': 'Mark as handled',
      'action.rename': 'Rename',
      'action.archive': 'Archive',
      'rename.hint': 'Enter to save · Esc to cancel',
      'create.label': 'New session',
      'create.title': 'Create in workspace',
      'create.hub': 'Console',
      'preview.you': 'You',
      'preview.agent': 'Agent',
      'preview.loading': 'Loading…',
      'preview.empty': 'Nothing to preview',
      'preview.error': 'Could not read the preview',
      'preview.network': 'request did not leave the page',
      'preview.cold': 'Session is dormant — open it to read',
      'preview.detail': '({n} records, last {type})',
      'preview.foot': 'Read-only preview · click the card to open',
      hint: 'Click a card to open that session. A switcher only: no context is read.',
      more: '{n} more sessions not shown',
      'time.justNow': 'just now',
      'time.minutes': '{n} min ago',
      'time.hours': '{n} h ago',
      'time.days': '{n} d ago',
      'time.unhandledMinutes': '{n} min unhandled',
      'time.unhandledHours': '{n} h unhandled',
      'time.unhandledDays': '{n} d unhandled',
    }

    /* ------------------------------------------------------------------ *
     * 2. 皮肤层                                                           *
     *                                                                     *
     * 皮肤只提供 CSS 变量；结构由视图层决定，两者互不认识。                 *
     * 换肤 = 新增一个 SKINS 条目（必要时用 view 整体覆写），不改数据层。     *
     * ------------------------------------------------------------------ */

    const SKINS = {
      night: {
        id: 'night',
        vars: {
          '--sh-bg': '#08090B',
          '--sh-surface': '#0E1013',
          '--sh-surface-hover': '#14171C',
          '--sh-line': '#1B1E24',
          '--sh-line-strong': '#2C313A',
          '--sh-text': '#ECEDEF',
          '--sh-text-dim': '#9BA1AC',
          '--sh-text-faint': '#6E747E',
          '--sh-idle': '#3A3D45',
          '--sh-running': '#2EE6A8',
          '--sh-approval': '#FFB224',
          '--sh-question': '#FF7AC8',
          '--sh-plan': '#A78BFA',
          '--sh-done': '#8AB4F8',
          '--sh-urgent': '#FF5C5C',
        },
      },
      host: {
        id: 'host',
        vars: {
          '--sh-bg': 'var(--dsw-alias-bg-base)',
          '--sh-surface': 'var(--dsw-alias-bg-layer-1)',
          '--sh-surface-hover': 'var(--dsw-alias-bg-layer-2)',
          '--sh-line': 'var(--dsw-alias-border-l1)',
          '--sh-line-strong': 'var(--dsw-alias-border-l2)',
          '--sh-text': 'var(--dsw-alias-label-primary)',
          '--sh-text-dim': 'var(--dsw-alias-label-secondary)',
          '--sh-text-faint': 'var(--dsw-alias-label-secondary)',
          '--sh-idle': 'var(--dsw-alias-state-idle-primary)',
          '--sh-running': 'var(--dsw-alias-brand-primary)',
          '--sh-approval': 'var(--dsw-alias-state-warn-primary)',
          '--sh-question': 'var(--dsw-alias-state-warn-primary)',
          '--sh-plan': 'var(--dsw-alias-state-warn-primary)',
          '--sh-done': 'var(--dsw-alias-state-success-primary)',
          '--sh-urgent': 'var(--dsw-alias-state-error-primary)',
        },
      },
    }

    const DEFAULT_SKIN = 'night'

    // Every text size derives from --sh-fs, so one knob scales the whole panel.
    const BASE_CSS = [
      '.sh-root{height:100%;box-sizing:border-box;overflow:auto;padding:26px 30px 46px;background:var(--sh-bg);color:var(--sh-text);font-size:var(--sh-fs);line-height:1.5}',
      '.sh-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
      '.sh-title{font-size:calc(var(--sh-fs) * 1.5);font-weight:600;letter-spacing:.01em}',
      '.sh-sum{font-size:calc(var(--sh-fs) * 0.86);color:var(--sh-text-dim)}',
      '.sh-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.sh-seg{display:inline-flex;align-items:center;gap:2px;padding:2px;border:1px solid var(--sh-line);border-radius:999px;transition:opacity .12s ease}',
      '.sh-seg[data-dim="true"]{opacity:.45}',
      '.sh-seg[data-dim="true"]:hover{opacity:.8}',
      '.sh-segbtn{display:inline-flex;align-items:baseline;gap:5px;font:inherit;font-size:calc(var(--sh-fs) * 0.86);font-weight:500;padding:3px 11px;border:0;border-radius:999px;background:transparent;color:var(--sh-text-faint);cursor:pointer;white-space:nowrap;-webkit-appearance:none}',
      '.sh-segbtn:hover{color:var(--sh-text)}',
      '.sh-segbtn:disabled{opacity:.3;cursor:default}',
      '.sh-segbtn:disabled:hover{color:var(--sh-text-faint)}',
      '.sh-segbtn[data-active="true"]{background:var(--sh-surface-hover);color:var(--sh-text)}',
      '.sh-segbtn[data-active="true"][data-range="running"]{color:var(--sh-running)}',
      '.sh-segnum{font-size:calc(var(--sh-fs) * 0.74);font-variant-numeric:tabular-nums;opacity:.65}',
      '.sh-font .sh-segbtn{padding:3px 9px;font-weight:600}',
      '.sh-group{margin-top:24px}',
      '.sh-grouphead{display:flex;align-items:center;gap:8px;padding:0 2px 10px;min-width:0}',
      '.sh-star{color:var(--sh-running);font-size:calc(var(--sh-fs) * 0.8);flex:none}',
      '.sh-gtitle{font-size:calc(var(--sh-fs) * 0.88);font-weight:600;letter-spacing:.02em;flex:none}',
      '.sh-gcount{margin-left:auto;flex:none;font-size:calc(var(--sh-fs) * 0.76);color:var(--sh-text-dim);border:1px solid var(--sh-line);border-radius:999px;padding:1px 9px}',
      '.sh-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(286px,1fr));gap:11px}',
      '.sh-card{position:relative;display:flex;flex-direction:column;gap:13px;min-width:0;box-sizing:border-box;padding:14px 15px 13px 17px;text-align:left;border:1px solid var(--sh-line);border-radius:10px;background:var(--sh-surface);color:inherit;font:inherit;cursor:pointer;-webkit-appearance:none;transition:border-color .12s ease,background .12s ease,transform .12s ease}',
      '.sh-card:hover{border-color:var(--sh-line-strong);background:var(--sh-surface-hover)}',
      '.sh-card:active{transform:translateY(1px)}',
      '.sh-card:focus-visible{outline:2px solid var(--sh-running);outline-offset:2px}',
      '.sh-card[data-blank="true"]{border-style:dashed;background:transparent}',
      '.sh-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:10px 0 0 10px;background:var(--sh-idle)}',
      '.sh-card[data-state="running"]::before{background:var(--sh-running)}',
      '.sh-card[data-state="approval"]::before{background:var(--sh-approval)}',
      '.sh-card[data-state="question"]::before{background:var(--sh-question)}',
      '.sh-card[data-state="plan-review"]::before{background:var(--sh-plan)}',
      '.sh-card[data-state="done"]::before{background:var(--sh-done)}',
      '.sh-cardhead{display:flex;align-items:flex-start;gap:9px;min-width:0}',
      '.sh-dot{width:8px;height:8px;margin-top:.45em;border-radius:50%;flex:none;background:var(--sh-idle)}',
      '.sh-dot[data-state="running"]{background:var(--sh-running);box-shadow:0 0 8px color-mix(in srgb, var(--sh-running) 70%, transparent)}',
      '.sh-dot[data-state="approval"]{background:var(--sh-approval)}',
      '.sh-dot[data-state="question"]{background:var(--sh-question)}',
      '.sh-dot[data-state="plan-review"]{background:var(--sh-plan)}',
      '.sh-dot[data-state="done"]{background:var(--sh-done)}',
      '.sh-name{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:var(--sh-fs);font-weight:500;line-height:1.45;word-break:break-word}',
      '.sh-cardfoot{display:flex;align-items:center;gap:6px;min-width:0}',
      '.sh-state{font-size:calc(var(--sh-fs) * 0.8);color:var(--sh-text-dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:none}',
      '.sh-state[data-state="running"]{color:var(--sh-running)}',
      '.sh-state[data-state="approval"]{color:var(--sh-approval)}',
      '.sh-state[data-state="question"]{color:var(--sh-question)}',
      '.sh-state[data-state="plan-review"]{color:var(--sh-plan)}',
      '.sh-state[data-state="done"]{color:var(--sh-done)}',
      '.sh-sep{font-size:calc(var(--sh-fs) * 0.8);color:var(--sh-text-faint);opacity:.55;flex:none}',
      '.sh-ws{font-size:calc(var(--sh-fs) * 0.8);color:var(--sh-text-faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
      '.sh-time{margin-left:auto;flex:none;font-size:calc(var(--sh-fs) * 0.8);color:var(--sh-text-faint)}',
      '.sh-empty{margin-top:40px;display:flex;align-items:center;gap:12px;font-size:calc(var(--sh-fs) * 0.88);color:var(--sh-text-dim)}',
      '.sh-link{font:inherit;font-size:calc(var(--sh-fs) * 0.88);color:var(--sh-running);background:transparent;border:0;padding:0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
      '.sh-more{margin-top:16px;font-size:calc(var(--sh-fs) * 0.78);color:var(--sh-text-faint)}',
      '.sh-hint{margin-top:28px;font-size:calc(var(--sh-fs) * 0.78);color:var(--sh-text-faint)}',
      // Hover preview: frosted glass, state-tinted accent, read-only.
      '@keyframes sh-pop{from{opacity:0;transform:translateY(6px) scale(.98)}to{opacity:1;transform:none}}',
      '.sh-preview{--sh-accent:var(--sh-idle);position:fixed;z-index:2147483000;width:400px;max-height:380px;overflow:hidden;box-sizing:border-box;padding:14px 16px 12px;border:1px solid color-mix(in srgb,var(--sh-text) 13%,transparent);border-radius:14px;background:var(--sh-bg);background:color-mix(in srgb,var(--sh-bg) 72%,transparent);-webkit-backdrop-filter:blur(24px) saturate(170%);backdrop-filter:blur(24px) saturate(170%);box-shadow:0 24px 64px rgba(0,0,0,.55),0 0 0 1px color-mix(in srgb,var(--sh-accent) 18%,transparent),0 0 34px -6px color-mix(in srgb,var(--sh-accent) 30%,transparent),inset 0 1px 0 color-mix(in srgb,#fff 7%,transparent);pointer-events:none;color:var(--sh-text);animation:sh-pop .17s cubic-bezier(.2,.85,.3,1)}',
      '.sh-preview[data-state="running"]{--sh-accent:var(--sh-running)}',
      '.sh-preview[data-state="approval"]{--sh-accent:var(--sh-approval)}',
      '.sh-preview[data-state="question"]{--sh-accent:var(--sh-question)}',
      '.sh-preview[data-state="plan-review"]{--sh-accent:var(--sh-plan)}',
      '.sh-preview[data-state="done"]{--sh-accent:var(--sh-done)}',
      '.sh-preview-head{display:flex;align-items:center;gap:8px;margin-bottom:11px;min-width:0}',
      '.sh-preview-dot{width:7px;height:7px;flex:none;border-radius:50%;background:var(--sh-accent);box-shadow:0 0 10px color-mix(in srgb,var(--sh-accent) 75%,transparent)}',
      '.sh-preview-title{font-size:calc(var(--sh-fs) * 0.94);font-weight:600;letter-spacing:.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-preview-ws{flex:none;margin-left:auto;font-size:calc(var(--sh-fs) * 0.72);color:var(--sh-text-faint);border:1px solid color-mix(in srgb,var(--sh-text) 10%,transparent);border-radius:999px;padding:1px 8px}',
      '.sh-preview-body{display:flex;flex-direction:column;gap:8px}',
      '.sh-quote{border-left:2px solid color-mix(in srgb,var(--sh-accent) 55%,transparent);padding-left:11px}',
      '.sh-md{font-size:calc(var(--sh-fs) * 0.82);line-height:1.6;color:color-mix(in srgb,var(--sh-text) 88%,transparent);max-height:252px;overflow:hidden}',
      '.sh-md p{margin:0 0 8px}',
      '.sh-md>*:last-child{margin-bottom:0}',
      '.sh-md strong{font-weight:650;color:var(--sh-text)}',
      '.sh-md em{font-style:italic;color:var(--sh-text)}',
      '.sh-md code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.92em;padding:1px 4px;border-radius:4px;background:color-mix(in srgb,var(--sh-text) 11%,transparent)}',
      '.sh-md pre{margin:0 0 8px;padding:8px 10px;border-radius:8px;background:color-mix(in srgb,var(--sh-text) 8%,transparent);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.88em;line-height:1.45;white-space:pre-wrap;word-break:break-word}',
      '.sh-md-h{margin:2px 0 6px;font-weight:650;color:var(--sh-text)}',
      '.sh-md-li{position:relative;padding-left:14px;margin:0 0 4px}',
      '.sh-md-li::before{content:"·";position:absolute;left:3px;color:var(--sh-accent)}',
      '.sh-md-li-num{padding-left:22px}',
      '.sh-md-li-num::before{content:none}',
      '.sh-md-num{position:absolute;left:2px;color:var(--sh-text-faint)}',
      '.sh-md-q{margin:0 0 6px;padding-left:9px;border-left:2px solid color-mix(in srgb,var(--sh-accent) 45%,transparent);color:var(--sh-text-dim)}',
      '.sh-md-link{color:var(--sh-done);text-decoration:underline;text-underline-offset:2px}',
      '.sh-md-table{margin:0 0 8px;border:1px solid color-mix(in srgb,var(--sh-text) 10%,transparent);border-radius:8px;overflow:hidden}',
      '.sh-md-tr{display:flex;align-items:stretch;border-top:1px solid color-mix(in srgb,var(--sh-text) 8%,transparent)}',
      '.sh-md-tr:first-child{border-top:0}',
      '.sh-md-th{background:color-mix(in srgb,var(--sh-text) 7%,transparent)}',
      '.sh-md-td{flex:1 1 0;min-width:0;padding:4px 7px;font-size:.94em;line-height:1.45;word-break:break-word}',
      '.sh-md-th .sh-md-td{font-weight:650;color:var(--sh-text)}',
      '.sh-md-more{justify-content:center;color:var(--sh-text-faint);font-size:.9em;padding:2px}',
      '.sh-preview-empty{font-size:calc(var(--sh-fs) * 0.82);color:var(--sh-text-faint)}',
      '.sh-preview-detail{margin-left:6px;opacity:.75}',
      '.sh-preview-foot{margin-top:12px;padding-top:9px;border-top:1px solid color-mix(in srgb,var(--sh-text) 8%,transparent);font-size:calc(var(--sh-fs) * 0.72);color:var(--sh-text-faint)}',
      '.sh-cardacts{position:absolute;top:8px;right:34px;display:flex;gap:3px;opacity:0;pointer-events:none;transition:opacity .12s ease}',
      '.sh-cardwrap:hover .sh-cardacts,.sh-cardwrap:focus-within .sh-cardacts{opacity:1;pointer-events:auto}',
      '.sh-actbtn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:1px solid var(--sh-line-strong);border-radius:6px;background:var(--sh-surface);color:var(--sh-text-faint);cursor:pointer;-webkit-appearance:none;transition:color .12s ease,border-color .12s ease}',
      '.sh-actbtn:hover{color:var(--sh-text);border-color:var(--sh-text-faint)}',
      '.sh-actbtn:focus-visible{outline:2px solid var(--sh-running);outline-offset:2px}',
      '.sh-actglyph{font-size:12px;line-height:1}',
      '.sh-card[data-urgent="true"] ~ .sh-cardacts .sh-actbtn{border-color:color-mix(in srgb,var(--sh-urgent) 45%,var(--sh-line))}',
      '.sh-rename{width:100%;min-width:0;box-sizing:border-box;font:inherit;font-size:var(--sh-fs);font-weight:500;color:var(--sh-text);background:color-mix(in srgb,var(--sh-text) 8%,transparent);border:1px solid var(--sh-running);border-radius:6px;padding:2px 7px;outline:none}',
      '.sh-newbtn{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:1px solid var(--sh-line);border-radius:999px;background:transparent;color:var(--sh-text-dim);font-size:15px;line-height:1;cursor:pointer;-webkit-appearance:none;transition:color .12s ease,border-color .12s ease}',
      '.sh-newbtn:hover{color:var(--sh-running);border-color:var(--sh-running)}',
      '.sh-backdrop{position:fixed;inset:0;z-index:2147482000}',
      '.sh-menu{position:fixed;z-index:2147482500;display:flex;flex-direction:column;gap:2px;width:260px;max-height:320px;overflow:auto;box-sizing:border-box;padding:8px;border:1px solid var(--sh-line-strong);border-radius:12px;background:var(--sh-bg);background:color-mix(in srgb,var(--sh-bg) 88%,transparent);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);box-shadow:0 20px 50px rgba(0,0,0,.5)}',
      '.sh-menu-title{padding:4px 8px 6px;font-size:calc(var(--sh-fs) * 0.76);color:var(--sh-text-faint)}',
      '.sh-menu-item{display:flex;align-items:center;gap:7px;width:100%;padding:6px 8px;border:0;border-radius:7px;background:transparent;color:var(--sh-text);font:inherit;font-size:calc(var(--sh-fs) * 0.86);text-align:left;cursor:pointer;-webkit-appearance:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.sh-menu-item:hover{background:color-mix(in srgb,var(--sh-text) 9%,transparent)}',
      '.sh-menu-star{color:var(--sh-running);flex:none}',
      // Overdue completion: the one state the panel insists you look at.
      '.sh-card[data-urgent="true"]{border-color:color-mix(in srgb, var(--sh-urgent) 55%, var(--sh-line))}',
      '.sh-card[data-urgent="true"]:hover{border-color:var(--sh-urgent)}',
      '.sh-card[data-urgent="true"]::before{background:var(--sh-urgent)}',
      '.sh-card[data-urgent="true"] .sh-dot{background:var(--sh-urgent);box-shadow:0 0 8px color-mix(in srgb, var(--sh-urgent) 70%, transparent)}',
      '.sh-card[data-urgent="true"] .sh-state{color:var(--sh-urgent)}',
      '.sh-card[data-urgent="true"] .sh-time{color:var(--sh-urgent)}',
      // Card + tick: the tick is a sibling so no button nests inside a button.
      '.sh-cardwrap{position:relative;display:flex;min-width:0}',
      '.sh-cardwrap .sh-card{flex:1;padding-right:42px}',
      '.sh-ack{position:absolute;top:10px;right:10px;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border:1px solid var(--sh-line-strong);border-radius:6px;background:var(--sh-surface);color:var(--sh-text-faint);cursor:pointer;-webkit-appearance:none;transition:color .12s ease,border-color .12s ease,background .12s ease}',
      '.sh-ack:hover{color:var(--sh-running);border-color:var(--sh-running)}',
      '.sh-ack:focus-visible{outline:2px solid var(--sh-running);outline-offset:2px}',
      '.sh-card[data-urgent="true"] ~ .sh-ack{color:var(--sh-urgent);border-color:color-mix(in srgb, var(--sh-urgent) 55%, var(--sh-line))}',
      '.sh-card[data-urgent="true"] ~ .sh-ack:hover{border-color:var(--sh-urgent)}',
      // Overdue band: the section header turns red with the cards.
      '.sh-alert-dot{width:7px;height:7px;border-radius:50%;flex:none;background:var(--sh-urgent);box-shadow:0 0 8px var(--sh-urgent)}',
      '.sh-group[data-alert="true"] .sh-gtitle{color:var(--sh-urgent)}',
      '.sh-group[data-alert="true"] .sh-gcount{color:var(--sh-urgent);border-color:color-mix(in srgb, var(--sh-urgent) 45%, var(--sh-line))}',
    ].join('')

    function readStored(key, fallback) {
      try {
        const stored = window.localStorage.getItem(key)
        if (stored !== null) return stored
      } catch {
        // Storage may be unavailable; fall back to the default.
      }
      return fallback
    }

    function resolveSkin() {
      const stored = readStored(SKIN_KEY, DEFAULT_SKIN)
      return SKINS[stored] !== undefined ? SKINS[stored] : SKINS[DEFAULT_SKIN]
    }

    function resolveFont() {
      const parsed = Number.parseInt(readStored(FONT_KEY, String(FONT_DEFAULT)), 10)
      if (!Number.isFinite(parsed)) return FONT_DEFAULT
      return Math.min(FONT_MAX, Math.max(FONT_MIN, parsed))
    }

    function storeFont(size) {
      try {
        window.localStorage.setItem(FONT_KEY, String(size))
      } catch {
        // A read-only storage keeps the in-memory size for this session only.
      }
    }

    /* ------------------------------------------------------------------ *
     * 3. 数据层（与皮肤无关）                                              *
     * ------------------------------------------------------------------ */

    // Finished work outranks running work: a running session is already being
    // handled, a finished one is waiting for a human. Waiting-for-you blocks the
    // agent entirely, so it stays first.
    const RANK = { approval: 0, question: 0, 'plan-review': 0, done: 1, running: 2, idle: 3 }
    const PENDING = new Set(['approval', 'question', 'plan-review'])
    const IN_FLIGHT = new Set(['approval', 'question', 'plan-review', 'running'])
    const WINDOWS = ['hour', 'day', 'week']

    const STATE_LABEL = {
      approval: 'state.approval',
      question: 'state.question',
      'plan-review': 'state.plan',
      running: 'state.running',
      done: 'state.done',
      idle: 'state.idle',
    }

    // The Session summary carries no finish time (its activity time only moves on
    // user messages), so the panel owns the running → idle edge itself. This is
    // also why the state is NOT derived from `completionUnread`: a Session you
    // were watching when it finished never gets that flag, which is exactly the
    // case this panel must still report as 刚跑完.
    //
    // There is no expiry: a finished Session stays in 需要你看 until you tick it
    // off, because a result you intend to come back to must not quietly age out.
    const finishedAt = new Map()
    const wasRunning = new Map()
    const BOOTSTRAP_MS = 5 * 60 * 1000
    const STALE_MS = 6 * 60 * 60 * 1000

    function loadFinished() {
      try {
        const raw = window.localStorage.getItem(FINISHED_KEY)
        if (raw === null) return
        const parsed = JSON.parse(raw)
        if (parsed === null || typeof parsed !== 'object') return
        for (const [id, at] of Object.entries(parsed)) {
          if (typeof at === 'number' && Number.isFinite(at)) finishedAt.set(id, at)
        }
      } catch {
        // A corrupt entry is dropped rather than blocking the panel.
      }
    }

    function saveFinished() {
      try {
        window.localStorage.setItem(FINISHED_KEY, JSON.stringify(Object.fromEntries(finishedAt)))
      } catch {
        // Read-only storage keeps the marks for this page session only.
      }
    }

    loadFinished()

    const normalize = (path) => (typeof path === 'string' ? path.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() : '')

    const basename = (path) => {
      if (typeof path !== 'string' || path === '') return ''
      const parts = path.replace(/[\\/]+$/, '').split(/[\\/]+/)
      return parts.length === 0 ? path : parts[parts.length - 1] || path
    }

    const isBlank = (row) => row.blank === true
    const isSubagent = (row) => row.origin === 'subagent' || row.parentSessionId !== undefined

    function isRunningNow(row, statuses) {
      const status = statuses !== undefined && typeof statuses.get === 'function' ? statuses.get(row.id) : undefined
      const running = status !== undefined && status.running !== undefined ? status.running : row.running
      return running === true
    }

    function stateOf(row, statuses, finished) {
      const status = statuses !== undefined && typeof statuses.get === 'function' ? statuses.get(row.id) : undefined
      const pending = status !== undefined && status.pendingInteraction !== undefined ? status.pendingInteraction : undefined
      if (pending !== undefined) {
        if (pending.kind === 'approval' || pending.kind === 'question' || pending.kind === 'plan-review') return pending.kind
      }
      if (isRunningNow(row, statuses)) return 'running'
      if (finished !== undefined && finished.has(row.id)) return 'done'
      return 'idle'
    }

    function startOfToday() {
      const now = new Date()
      now.setHours(0, 0, 0, 0)
      return now.getTime()
    }

    /** Monday 00:00 in the browser's zone. */
    function startOfWeek() {
      const now = new Date()
      const offset = (now.getDay() + 6) % 7
      now.setDate(now.getDate() - offset)
      now.setHours(0, 0, 0, 0)
      return now.getTime()
    }

    function windowStart(window) {
      if (window === 'hour') return Date.now() - 60 * 60 * 1000
      if (window === 'day') return startOfToday()
      return startOfWeek()
    }

    /** Collect every visible Session once, tagged with its Workspace label. */
    function collectRows(list, workspaceState, statuses, t, hubPath, finished) {
      const byId = list !== undefined && list.byId !== undefined ? list.byId : {}
      const ids = list !== undefined && Array.isArray(list.ids) ? list.ids : []
      const items = workspaceState !== undefined && Array.isArray(workspaceState.items) ? workspaceState.items : []
      const archived = new Set(workspaceState !== undefined && Array.isArray(workspaceState.archivedSessionIds) ? workspaceState.archivedSessionIds : [])
      const pinned = new Set(workspaceState !== undefined && Array.isArray(workspaceState.pinnedSessionIds) ? workspaceState.pinnedSessionIds : [])
      const wanted = normalize(hubPath)
      const entries = []
      const accounted = new Set()

      for (const workspace of items) {
        // Configured path first, then the default title, then the default
        // directory name — so a bundle installed elsewhere still marks it.
        const path = normalize(workspace.path)
        const isHub = (wanted !== '' && path === wanted) || workspace.title === HUB_TITLE || path.endsWith('/.dsh-hub')
        const label = workspace.title || basename(workspace.path) || t('group.ungrouped')
        for (const id of Array.isArray(workspace.sessionIds) ? workspace.sessionIds : []) {
          const row = byId[id]
          if (row === undefined) continue
          accounted.add(id)
          if (archived.has(id) || isSubagent(row)) continue
          entries.push({ row, state: stateOf(row, statuses, finished), ws: label, hub: isHub })
        }
      }

      for (const id of ids) {
        const row = byId[id]
        if (row === undefined || accounted.has(id) || archived.has(id) || isSubagent(row) || isBlank(row)) continue
        entries.push({ row, state: stateOf(row, statuses, finished), ws: t('group.ungrouped'), hub: false })
      }

      return { entries, pinned }
    }

    function sortEntries(entries, pinned, overdue) {
      return [...entries].sort((a, b) => {
        const pinA = pinned.has(a.row.id) ? 0 : 1
        const pinB = pinned.has(b.row.id) ? 0 : 1
        if (pinA !== pinB) return pinA - pinB
        const rankA = RANK[a.state]
        const rankB = RANK[b.state]
        if (rankA !== rankB) return rankA - rankB
        if (overdue !== undefined) {
          const lateA = overdue(a.row.id) ? 0 : 1
          const lateB = overdue(b.row.id) ? 0 : 1
          if (lateA !== lateB) return lateA - lateB
        }
        // Freshly created Sessions carry no content yet; they belong at the end
        // of their section until they have something to say.
        const blankA = isBlank(a.row) ? 1 : 0
        const blankB = isBlank(b.row) ? 1 : 0
        if (blankA !== blankB) return blankA - blankB
        return (b.row.updatedAt || 0) - (a.row.updatedAt || 0)
      })
    }

    /**
     * Build the sections one range + window shows.
     *
     * The ladder is fixed: needs-you (blocking or finished) → running → today's
     * idle → older idle. In-flight sessions ignore the window so a long task can
     * never fall out of view.
     */
    function buildSections(entries, pinned, mode, window, t, limit, overdue, finished) {
      const dayStart = startOfToday()
      const from = windowStart(window)
      const inFlight = (entry) => IN_FLIGHT.has(entry.state)
      // An un-ticked finish stays in view whatever the window is: the whole point
      // is that it waits for you, not for the clock.
      const inScope = (entry) => (entry.row.updatedAt || 0) >= from || inFlight(entry) || finished.has(entry.row.id)
      const isToday = (entry) => (entry.row.updatedAt || 0) >= dayStart
      const needs = (entry) => entry.state === 'done' || PENDING.has(entry.state)

      const scoped = mode === 'running' ? entries.filter(inFlight) : entries.filter(inScope)
      const isLate = (entry) => entry.state === 'done' && overdue !== undefined && overdue(entry.row.id)
      // Overdue finishes leave their own section and head the page: a result you
      // promised yourself to look at is the loudest thing the panel can say.
      const late = scoped.filter(isLate)
      const hub = scoped.filter((entry) => entry.hub && !isLate(entry))
      const rest = scoped.filter((entry) => !entry.hub && !isLate(entry))

      const counts = {
        running: entries.filter(inFlight).length,
        all: entries.filter(inScope).length,
      }

      const sections = []
      const put = (key, label, hubSection, list, late2, alert) => {
        if (list.length === 0) return
        sections.push({ key, label, hub: hubSection, alert: alert === true, cards: sortEntries(list, pinned, late2).slice(0, limit) })
      }

      if (mode === 'running') {
        put('hub', t('group.hub'), true, hub)
        put('running', null, false, rest)
        return { sections, counts }
      }

      put('overdue', t('group.overdue'), false, late, overdue, true)
      put('hub', t('group.hub'), true, hub, overdue)
      put('needs', t('group.needs'), false, rest.filter(needs), overdue)
      put('running', t('group.running'), false, rest.filter((entry) => entry.state === 'running'))
      put('today', t('group.today'), false, rest.filter((entry) => entry.state === 'idle' && isToday(entry)))
      put('earlier', t('group.earlier'), false, rest.filter((entry) => entry.state === 'idle' && !isToday(entry)))
      return { sections, counts }
    }

    function relTime(time, t) {
      if (typeof time !== 'number' || !Number.isFinite(time)) return ''
      const delta = Date.now() - time
      if (delta < 60000) return t('time.justNow')
      const minutes = Math.floor(delta / 60000)
      if (minutes < 60) return t('time.minutes', { n: String(minutes) })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return t('time.hours', { n: String(hours) })
      return t('time.days', { n: String(Math.floor(hours / 24)) })
    }

    /** Overdue wording: the point is that it is still waiting, not when it ran. */
    function unhandledTime(time, t) {
      const delta = Math.max(0, Date.now() - time)
      const minutes = Math.floor(delta / 60000)
      if (minutes < 60) return t('time.unhandledMinutes', { n: String(minutes) })
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return t('time.unhandledHours', { n: String(hours) })
      return t('time.unhandledDays', { n: String(Math.floor(hours / 24)) })
    }

    /**
     * The grid reorders whenever a Session changes state. If a card moves out
     * from under the pointer between press and release, the browser may deliver
     * the click to whichever card slid into that slot — which would open the
     * wrong Session. Remember what was pressed and only honour the same card.
     */
    let pressedId = null

    function useStore(source) {
      const subscribe = React.useCallback(
        (notify) => (typeof source.subscribe === 'function' ? source.subscribe(() => notify()) : () => {}),
        [source],
      )
      const read = React.useCallback(() => source.getSnapshot(), [source])
      return React.useSyncExternalStore(subscribe, read, read)
    }

    const useNoStatus = (select) => select(NO_STATUS)

    /* ------------------------------------------------------------------ *
     * 4. 视图层（皮肤可用 view 整体替换）                                  *
     * ------------------------------------------------------------------ */

    /**
     * Render the switcher from a prepared model. No store access, no filtering
     * and no formatting happen here, so a replacement skin receives exactly the
     * same model and never touches the data layer.
     */
    function SessionHubView(model) {
      const {
        t, skin, totals, sections, hidden, mode, window, fontSize, setMode, setWindow, setFontSize, counts,
        openSession, acknowledge, preview, hoverCard, trackPointer, hidePreview,
        startRename, changeRename, cancelRename, commitRename, archiveSession,
        menu, openCreateMenu, closeCreateMenu, createIn, hubWorkspaceId, workspaceItems,
      } = model

      const card = (item) =>
        h(
          'div',
          {
            className: 'sh-cardwrap',
            key: item.id,
            onPointerEnter: (event) => {
              trackPointer(event)
              if (!item.editing) hoverCard(item)
            },
            onPointerMove: trackPointer,
            onPointerLeave: hidePreview,
          },
          item.editing
            ? h(
                'div',
                { className: 'sh-card', 'data-state': item.state, 'data-blank': item.blank ? 'true' : 'false' },
                h(
                  'span',
                  { className: 'sh-cardhead' },
                  h('span', { className: 'sh-dot', 'data-state': item.state }),
                  h('input', {
                    className: 'sh-rename',
                    value: item.editingValue,
                    autoFocus: true,
                    spellCheck: false,
                    onChange: (event) => changeRename(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitRename()
                      } else if (event.key === 'Escape') {
                        event.preventDefault()
                        cancelRename()
                      }
                    },
                    onBlur: commitRename,
                  }),
                ),
                h(
                  'span',
                  { className: 'sh-cardfoot' },
                  h('span', { className: 'sh-state', 'data-state': item.state }, t('rename.hint')),
                ),
              )
            : h(
                'button',
                {
                  type: 'button',
                  className: 'sh-card',
                  'data-state': item.state,
                  'data-urgent': item.urgent ? 'true' : 'false',
                  'data-blank': item.blank ? 'true' : 'false',
                  onPointerDown: () => {
                    pressedId = item.id
                  },
                  onClick: () => {
                    const same = pressedId === item.id
                    pressedId = null
                    if (same) openSession(item.id)
                  },
                  title: item.cwd || item.name,
                },
                h(
                  'span',
                  { className: 'sh-cardhead' },
                  h('span', { className: 'sh-dot', 'data-state': item.state }),
                  h('span', { className: 'sh-name' }, item.name),
                ),
                h(
                  'span',
                  { className: 'sh-cardfoot' },
                  h('span', { className: 'sh-state', 'data-state': item.state }, item.stateLabel),
                  item.ws ? h('span', { className: 'sh-sep' }, '·') : null,
                  item.ws ? h('span', { className: 'sh-ws' }, item.ws) : null,
                  h('span', { className: 'sh-time' }, item.time),
                ),
              ),
          item.editing
            ? null
            : h(
                'span',
                { className: 'sh-cardacts' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'sh-actbtn',
                    title: t('action.rename'),
                    'aria-label': t('action.rename'),
                    onClick: (event) => {
                      event.stopPropagation()
                      startRename(item.id, item.name)
                    },
                  },
                  h('span', { className: 'sh-actglyph' }, '✎'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'sh-actbtn',
                    title: t('action.archive'),
                    'aria-label': t('action.archive'),
                    onClick: (event) => {
                      event.stopPropagation()
                      archiveSession(item.id)
                    },
                  },
                  h('span', { className: 'sh-actglyph' }, '⤓'),
                ),
              ),
          item.editing || !item.canAcknowledge
            ? null
            : h(
                'button',
                {
                  type: 'button',
                  className: 'sh-ack',
                  title: t('ack.label'),
                  'aria-label': t('ack.label'),
                  onClick: (event) => {
                    event.stopPropagation()
                    acknowledge(item.id)
                  },
                },
                h(
                  'svg',
                  { width: 12, height: 12, viewBox: '0 0 12 12', fill: 'none', 'aria-hidden': true },
                  h('path', {
                    d: 'M2.2 6.3 4.6 8.7 9.8 3.5',
                    stroke: 'currentColor',
                    strokeWidth: 1.5,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                  }),
                ),
              ),
        )

      const nextWindow = window === 'hour' ? 'day' : 'week'

      return h(
        'div',
        { className: 'sh-root', 'data-skin': skin.id, style: { ...skin.vars, '--sh-fs': fontSize + 'px' } },
        h('style', null, BASE_CSS),
        h(
          'div',
          { className: 'sh-head' },
          h('span', { className: 'sh-title' }, t('title')),
          h(
            'span',
            { className: 'sh-sum' },
            t('summary', {
              total: String(totals.total),
              running: String(totals.running),
              waiting: String(totals.waiting),
            }),
          ),
          h(
            'span',
            { className: 'sh-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'sh-newbtn',
                title: t('create.label'),
                'aria-label': t('create.label'),
                onClick: openCreateMenu,
              },
              '＋',
            ),
            h(
              'span',
              { className: 'sh-seg', role: 'group', 'aria-label': t('range.label') },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-segbtn',
                  'data-range': 'running',
                  'data-active': mode === 'running' ? 'true' : 'false',
                  'aria-pressed': mode === 'running' ? 'true' : 'false',
                  onClick: () => setMode('running'),
                },
                t('range.running'),
                h('span', { className: 'sh-segnum' }, String(counts.running)),
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-segbtn',
                  'data-range': 'all',
                  'data-active': mode === 'all' ? 'true' : 'false',
                  'aria-pressed': mode === 'all' ? 'true' : 'false',
                  onClick: () => setMode('all'),
                },
                t('range.all'),
                h('span', { className: 'sh-segnum' }, String(counts.all)),
              ),
            ),
            h(
              'span',
              {
                className: 'sh-seg',
                'data-dim': mode === 'running' ? 'true' : 'false',
                role: 'group',
                'aria-label': t('window.label.day'),
              },
              WINDOWS.map((id) =>
                h(
                  'button',
                  {
                    key: id,
                    type: 'button',
                    className: 'sh-segbtn',
                    'data-window': id,
                    'data-active': window === id ? 'true' : 'false',
                    'aria-pressed': window === id ? 'true' : 'false',
                    title: t('window.label.' + id),
                    onClick: () => {
                      setWindow(id)
                      setMode('all')
                    },
                  },
                  t('window.' + id),
                ),
              ),
            ),
            h(
              'span',
              { className: 'sh-seg sh-font', role: 'group', 'aria-label': t('font.larger') },
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-segbtn',
                  disabled: fontSize <= FONT_MIN,
                  title: t('font.smaller'),
                  'aria-label': t('font.smaller'),
                  onClick: () => setFontSize(fontSize - 1),
                },
                'A−',
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'sh-segbtn',
                  disabled: fontSize >= FONT_MAX,
                  title: t('font.larger'),
                  'aria-label': t('font.larger'),
                  onClick: () => setFontSize(fontSize + 1),
                },
                'A+',
              ),
            ),
          ),
        ),
        sections.length === 0
          ? h(
              'div',
              { className: 'sh-empty' },
              h('span', null, t(mode === 'running' ? 'empty.running' : 'empty.' + window)),
              mode === 'running'
                ? h(
                    'button',
                    { type: 'button', className: 'sh-link', onClick: () => setMode('all') },
                    t('empty.toDay'),
                  )
                : window === 'week'
                  ? null
                  : h(
                      'button',
                      {
                        type: 'button',
                        className: 'sh-link',
                        onClick: () => {
                          setWindow(nextWindow)
                          setMode('all')
                        },
                      },
                      t(nextWindow === 'day' ? 'empty.toDay' : 'empty.toWeek'),
                    ),
            )
          : sections.map((section) =>
              h(
                'section',
                { className: 'sh-group', key: section.key, 'data-alert': section.alert ? 'true' : 'false' },
                section.label === null
                  ? null
                  : h(
                      'div',
                      { className: 'sh-grouphead' },
                      section.hub ? h('span', { className: 'sh-star' }, '◈') : null,
                      section.alert ? h('span', { className: 'sh-alert-dot' }) : null,
                      h('span', { className: 'sh-gtitle' }, section.label),
                      h('span', { className: 'sh-gcount' }, String(section.cards.length)),
                    ),
                h('div', { className: 'sh-grid' }, section.cards.map(card)),
              ),
            ),
        hidden > 0 ? h('div', { className: 'sh-more' }, t('more', { n: String(hidden) })) : null,
        h('div', { className: 'sh-hint' }, t('hint')),
        preview === null
          ? null
          : h(
              'div',
              {
                className: 'sh-preview',
                'data-state': preview.state,
                style: { left: preview.left, top: preview.top },
              },
              h(
                'div',
                { className: 'sh-preview-head' },
                h('span', { className: 'sh-preview-dot' }),
                h('span', { className: 'sh-preview-title' }, preview.name),
                preview.ws ? h('span', { className: 'sh-preview-ws' }, preview.ws) : null,
              ),
              h(
                'div',
                { className: 'sh-preview-body' },
                preview.result === null
                  ? h('div', { className: 'sh-preview-empty' }, t('preview.loading'))
                  : preview.result.kind === 'error'
                    ? h(
                        'div',
                        { className: 'sh-preview-empty' },
                        t('preview.error'),
                        preview.result.status === 0 || preview.result.status === undefined
                          ? null
                          : h(
                              'span',
                              { className: 'sh-preview-detail' },
                              preview.result.status === -1 ? t('preview.network') : 'HTTP ' + String(preview.result.status),
                            ),
                      )
                    : preview.result.kind === 'cold'
                      ? h('div', { className: 'sh-preview-empty' }, t('preview.cold'))
                      : preview.result.kind === 'empty'
                        ? h(
                            'div',
                            { className: 'sh-preview-empty' },
                            t('preview.empty'),
                            h(
                              'span',
                              { className: 'sh-preview-detail' },
                              t('preview.detail', {
                                n: String(preview.result.count),
                                type: preview.result.lastType === '' ? '—' : preview.result.lastType,
                              }),
                            ),
                          )
                        : h('div', { className: 'sh-md' }, renderMarkdown(preview.result.lines.map((line) => line.text).join('\n'))),
              ),
              h('div', { className: 'sh-preview-foot' }, t('preview.foot')),
            ),
        menu === null
          ? null
          : h(
              React.Fragment,
              null,
              h('div', { className: 'sh-backdrop', onClick: closeCreateMenu }),
              h(
                'div',
                { className: 'sh-menu', style: { left: menu.x, top: menu.y } },
                h('div', { className: 'sh-menu-title' }, t('create.title')),
                hubWorkspaceId === ''
                  ? null
                  : h(
                      'button',
                      { type: 'button', className: 'sh-menu-item', onClick: () => createIn(hubWorkspaceId) },
                      h('span', { className: 'sh-menu-star' }, '◈'),
                      t('create.hub'),
                    ),
                workspaceItems.map((workspace) =>
                  h(
                    'button',
                    {
                      key: workspace.workspaceId,
                      type: 'button',
                      className: 'sh-menu-item',
                      title: workspace.path,
                      onClick: () => createIn(workspace.workspaceId),
                    },
                    workspace.title || workspace.path,
                  ),
                ),
              ),
            ),
      )
    }

    /* ------------------------------------------------------------------ *
     * 5. 组装（数据 → 模型 → 视图）                                        *
     * ------------------------------------------------------------------ */

    function SessionHubPage(props) {
      const list = useStore(props.sessionsSource)
      const workspaceState = useStore(props.workspacesSource)
      const useSessionStatus = props.useSessionStatus || useNoStatus
      const statuses = useSessionStatus((value) => value)
      const t = props.t
      const [mode, setMode] = React.useState('all')
      const [window, setWindow] = React.useState('day')
      const [fontSize, setFontSizeState] = React.useState(props.fontSize)
      const [, setTick] = React.useState(0)
      const [completionVersion, setCompletionVersion] = React.useState(0)
      const [preview, setPreview] = React.useState(null)
      const [editing, setEditing] = React.useState(null)
      const [menu, setMenu] = React.useState(null)
      const previewTimer = React.useRef(0)
      const previewToken = React.useRef(0)
      const pointer = React.useRef({ x: 0, y: 0 })

      const setFontSize = React.useCallback((next) => {
        const clamped = Math.min(FONT_MAX, Math.max(FONT_MIN, next))
        setFontSizeState(clamped)
        storeFont(clamped)
      }, [])

      // Relative times, the 5-minute overdue mark and the done → idle expiry must
      // advance while the panel sits untouched; one tick re-renders everything.
      React.useEffect(() => {
        const timer = setInterval(() => setTick((value) => value + 1), TICK_MS)
        return () => clearInterval(timer)
      }, [])

      const collected = React.useMemo(
        () => collectRows(list, workspaceState, statuses, t, props.hubPath, finishedAt),
        [list, workspaceState, statuses, t, props.hubPath, completionVersion],
      )

      // Own the running → idle edge. A Session you were watching when it finished
      // never gets `completionUnread`, so that flag cannot drive 刚跑完.
      React.useEffect(() => {
        const now = Date.now()
        let changed = false
        const seen = new Set()
        for (const entry of collected.entries) {
          const id = entry.row.id
          seen.add(id)
          // Waiting for you is a pause inside the same turn, not a finish: keep
          // the edge "running" so the 刚跑完 mark still lands when it really ends.
          const running = entry.state === 'running' || PENDING.has(entry.state) || isRunningNow(entry.row, statuses)
          const previous = wasRunning.get(id)
          if (running) {
            if (finishedAt.delete(id)) changed = true
          } else if (previous === true && now - (entry.row.updatedAt || 0) <= STALE_MS) {
            finishedAt.set(id, now)
            changed = true
          } else if (previous === undefined && !finishedAt.has(id)) {
            // First sight after a reload: only very recent idle Sessions count as
            // just-finished, and their clock starts now (the real finish time is
            // not available anywhere on the client).
            const touched = entry.row.updatedAt || 0
            if (now - touched <= BOOTSTRAP_MS) {
              finishedAt.set(id, now)
              changed = true
            }
          }
          wasRunning.set(id, running)
        }
        for (const id of wasRunning.keys()) if (!seen.has(id)) wasRunning.delete(id)
        // Marks for Sessions the catalog no longer carries (deleted, archived)
        // are dropped; an un-ticked finish otherwise has no expiry at all.
        for (const id of finishedAt.keys()) {
          if (!seen.has(id)) {
            finishedAt.delete(id)
            changed = true
          }
        }
        if (changed) {
          saveFinished()
          setCompletionVersion((value) => value + 1)
        }
      }, [collected, statuses])

      const totals = React.useMemo(() => {
        let running = 0
        let waiting = 0
        for (const entry of collected.entries) {
          if (entry.state === 'running') running += 1
          if (PENDING.has(entry.state)) waiting += 1
        }
        return { total: collected.entries.length, running, waiting }
      }, [collected])

      const now = Date.now()
      const overdue = React.useCallback(
        (sessionId) => {
          const at = finishedAt.get(sessionId)
          return at !== undefined && now - at > URGENT_MS
        },
        [now],
      )

      const built = React.useMemo(
        () => buildSections(collected.entries, collected.pinned, mode, window, t, MAX_ROWS, overdue, finishedAt),
        [collected, mode, window, t, overdue],
      )

      const acknowledge = React.useCallback((sessionId) => {
        if (!finishedAt.delete(sessionId)) return
        saveFinished()
        setCompletionVersion((value) => value + 1)
      }, [])

      const hidePreview = React.useCallback(() => {
        if (previewTimer.current !== 0) {
          clearTimeout(previewTimer.current)
          previewTimer.current = 0
        }
        previewToken.current += 1
        setPreview(null)
      }, [])

      React.useEffect(() => hidePreview, [hidePreview])

      const trackPointer = React.useCallback((event) => {
        pointer.current = { x: event.clientX, y: event.clientY }
      }, [])

      const hoverCard = React.useCallback(
        (item) => {
          if (previewTimer.current !== 0) clearTimeout(previewTimer.current)
          previewTimer.current = setTimeout(() => {
            previewTimer.current = 0
            const token = (previewToken.current += 1)
            const width = 400
            const height = 380
            const x = pointer.current.x
            const y = pointer.current.y
            // Sit beside the pointer and cover whatever is underneath: the
            // popover vanishes on leave, so occlusion costs nothing.
            const left = Math.max(8, x + 16 + width > window.innerWidth - 8 ? x - width - 16 : x + 16)
            const below = y + 14
            const top = Math.max(8, below + height > window.innerHeight - 8 ? y - height - 14 : below)
            setPreview({ id: item.id, name: item.name, ws: item.ws, state: item.state, left, top, result: null })
            void Promise.resolve(props.loadPreview(item.id)).then((result) => {
              if (previewToken.current !== token) return
              setPreview((current) => (current === null || current.id !== item.id ? current : { ...current, result }))
            })
          }, 320)
        },
        [props],
      )

      const startRename = React.useCallback((id, title) => {
        setEditing({ id, value: title })
      }, [])

      const changeRename = React.useCallback((value) => {
        setEditing((current) => (current === null ? current : { ...current, value }))
      }, [])

      const cancelRename = React.useCallback(() => setEditing(null), [])

      const commitRename = React.useCallback(() => {
        const current = editing
        setEditing(null)
        if (current === null) return
        const title = current.value.trim()
        if (title === '') return
        void props.sessions
          .using(current.id, { source: 'sessionHubRename' }, (reference) => reference.binding.session.rename(title))
          .catch(() => {})
      }, [editing, props])

      const archiveSession = React.useCallback(
        (id) => {
          void props.workspaces.archiveSession(id).catch(() => {})
        },
        [props],
      )

      const openCreateMenu = React.useCallback((event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setMenu({ x: Math.max(8, rect.right - 260), y: rect.bottom + 8 })
      }, [])

      const createIn = React.useCallback(
        (workspaceId) => {
          setMenu(null)
          void props.sessions.create(workspaceId === '' ? {} : { workspaceId }).catch(() => {})
        },
        [props],
      )

      let shown = 0
      let hidden = 0
      const sections = built.sections.map((section) => {
        const cards = []
        for (const entry of section.cards) {
          if (shown >= MAX_ROWS) {
            hidden += 1
            continue
          }
          shown += 1
          const titled = typeof entry.row.title === 'string' ? entry.row.title.trim() : ''
          const finish = finishedAt.get(entry.row.id)
          cards.push({
            id: entry.row.id,
            name: titled !== '' ? titled : t('row.blank'),
            state: entry.state,
            stateLabel: t(STATE_LABEL[entry.state]),
            // A finished session is timed from when it finished; anything else
            // from its last activity.
            time:
              entry.state === 'done' && finish !== undefined
                ? overdue(entry.row.id)
                  ? unhandledTime(finish, t)
                  : relTime(finish, t)
                : relTime(entry.row.updatedAt, t),
            urgent: entry.state === 'done' && overdue(entry.row.id),
            canAcknowledge: entry.state === 'done',
            blank: isBlank(entry.row),
            cwd: entry.row.cwd,
            // Previewing borrows the live binding, so a dormant Session is not woken.
            live: entry.row.agentAvailable === true,
            editing: editing !== null && editing.id === entry.row.id,
            editingValue: editing !== null && editing.id === entry.row.id ? editing.value : '',
            ws: section.hub ? '' : entry.ws,
          })
        }
        return { key: section.key, label: section.label, hub: section.hub, alert: section.alert, cards }
      })

      const model = {
        t,
        skin: props.skin,
        totals,
        counts: built.counts,
        sections: sections.filter((section) => section.cards.length > 0),
        hidden,
        mode,
        window,
        fontSize,
        setMode,
        setWindow,
        setFontSize,
        acknowledge,
        preview,
        hoverCard,
        trackPointer,
        hidePreview,
        editing,
        startRename,
        changeRename,
        cancelRename,
        commitRename,
        archiveSession,
        menu,
        openCreateMenu,
        closeCreateMenu: () => setMenu(null),
        createIn,
        hubWorkspaceId: (() => {
          const wanted = normalize(HUB_PATH)
          const hub = workspaceState !== undefined && Array.isArray(workspaceState.items)
            ? workspaceState.items.find((item) => {
                const path = normalize(item.path)
                return path === wanted || item.title === HUB_TITLE || path.endsWith('/.dsh-hub')
              })
            : undefined
          return hub === undefined ? '' : hub.workspaceId
        })(),
        workspaceItems: workspaceState !== undefined && Array.isArray(workspaceState.items) ? workspaceState.items : [],
        openSession: props.openSession,
      }

      return props.skin.view ? props.skin.view(model) : SessionHubView(model)
    }

    function SessionHubIcon(props) {
      const size = typeof props.size === 'number' && props.size > 0 ? props.size : 16
      const dot = (cy) => h('circle', { key: 'd' + cy, cx: 3.2, cy, r: 1.25, fill: 'currentColor' })
      const bar = (y, width) =>
        h('rect', { key: 'b' + y, x: 6.2, y, width, height: 1.5, rx: 0.75, fill: 'currentColor', opacity: 0.85 })
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': true,
          focusable: 'false',
          style: { display: 'block' },
        },
        dot(3.6),
        bar(2.85, 7.3),
        dot(8),
        bar(7.25, 5.6),
        dot(12.4),
        bar(11.65, 3.9),
      )
    }

    /* ------------------------------------------------------------------ *
     * 6. 注册                                                             *
     * ------------------------------------------------------------------ */

    const inject = ['slots', 'locale', 'sessions', 'workspaces', 'uiWorkspace']

    const emptyResult = (kind, status) => ({ kind, status: status === undefined ? 0 : status, lines: [], count: 0, lastType: '' })

    // Hover is a repeated gesture: moving across a row re-enters the same card.
    const previewCache = new Map()
    const PREVIEW_TTL_MS = 15000

    const HTML_HINT =
      /<(?:!doctype|html|head|body|div|span|p|br|table|thead|tbody|tr|td|th|ul|ol|li|section|article|header|footer|h[1-6]|a|img|pre|code|style|script|meta|link)\b/iu

    function decodeEntities(text) {
      return text
        .replace(/&nbsp;/gu, ' ')
        .replace(/&lt;/gu, '<')
        .replace(/&gt;/gu, '>')
        .replace(/&quot;/gu, '"')
        .replace(/&#0?39;/gu, "'")
        .replace(/&amp;/gu, '&')
    }

    /**
     * Sessions that produce documents put raw markup in their messages; pasted
     * into a 400px popover that is unreadable. Strip it only when the text really
     * looks like markup, so code containing `<` survives. Markdown is kept: the
     * view renders it instead of showing the markers.
     */
    function toPlain(text) {
      if (typeof text !== 'string' || text === '') return ''
      const body = HTML_HINT.test(text) ? stripHtml(text) : text
      return body.trim().slice(0, 1200)
    }

    function stripHtml(text) {
      const stripped = text
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, ' ')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ' ')
        .replace(/<!--[\s\S]*?-->/gu, ' ')
        .replace(/<\/(?:p|div|section|article|li|tr|h[1-6]|pre|blockquote)>/giu, '\n')
        .replace(/<br\s*\/?>/giu, '\n')
        .replace(/<[^>]+>/gu, ' ')
      return decodeEntities(stripped)
        .replace(/[ \t]+\n/gu, '\n')
        .replace(/\n{3,}/gu, '\n\n')
        .replace(/[ \t]{2,}/gu, ' ')
    }

    /** Inline markdown: bold, italic, inline code, links (rendered as text). */
    function renderInline(text, prefix) {
      const nodes = []
      const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\n]*\))/gu
      let last = 0
      let match
      let index = 0
      while ((match = pattern.exec(text)) !== null) {
        if (match.index > last) nodes.push(text.slice(last, match.index))
        const token = match[0]
        const key = prefix + ':' + String(index++)
        if (token.startsWith('**')) nodes.push(h('strong', { key }, token.slice(2, -2)))
        else if (token.startsWith('`')) nodes.push(h('code', { key }, token.slice(1, -1)))
        else if (token.startsWith('[')) nodes.push(h('span', { key, className: 'sh-md-link' }, token.replace(/\]\([^)]*\)$/u, '').slice(1)))
        else nodes.push(h('em', { key }, token.slice(1, -1)))
        last = match.index + token.length
      }
      if (last < text.length) nodes.push(text.slice(last))
      return nodes
    }

    /**
     * Minimal block markdown: fenced code, headings, bullet/numbered lists,
     * quotes, pipe tables and paragraphs. No HTML injection — every text run is a
     * React text node, so a message containing markup can never become live DOM.
     */
    function renderMarkdown(text) {
      const lines = String(text).split('\n')
      const blocks = []
      let paragraph = []
      let fence = null
      let table = []
      const flush = () => {
        if (paragraph.length === 0) return
        const key = 'p' + String(blocks.length)
        blocks.push(h('p', { key }, renderInline(paragraph.join(' '), key)))
        paragraph = []
      }
      const flushTable = () => {
        if (table.length === 0) return
        blocks.push(renderTable(table, 't' + String(blocks.length)))
        table = []
      }
      for (const raw of lines) {
        const line = raw.replace(/\s+$/u, '')
        if (fence !== null) {
          if (/^\s*```/u.test(line)) {
            blocks.push(h('pre', { key: 'c' + String(blocks.length) }, fence.join('\n')))
            fence = null
          } else {
            fence.push(raw)
          }
          continue
        }
        if (/^\s*```/u.test(line)) {
          flushTable()
          flush()
          fence = []
          continue
        }
        if (/^\s*\|.*\|\s*$/u.test(line)) {
          flush()
          table.push(line)
          continue
        }
        flushTable()
        if (line.trim() === '') {
          flush()
          continue
        }
        const heading = /^\s{0,3}(#{1,6})\s+(.*)$/u.exec(line)
        if (heading !== null) {
          flush()
          const key = 'h' + String(blocks.length)
          blocks.push(h('div', { key, className: 'sh-md-h' }, renderInline(heading[2], key)))
          continue
        }
        const bullet = /^\s*[-*+]\s+(.*)$/u.exec(line)
        if (bullet !== null) {
          flush()
          const key = 'b' + String(blocks.length)
          blocks.push(h('div', { key, className: 'sh-md-li' }, renderInline(bullet[1], key)))
          continue
        }
        const numbered = /^\s*(\d+)[.)]\s+(.*)$/u.exec(line)
        if (numbered !== null) {
          flush()
          const key = 'n' + String(blocks.length)
          blocks.push(
            h(
              'div',
              { key, className: 'sh-md-li sh-md-li-num' },
              h('span', { className: 'sh-md-num' }, numbered[1] + '.'),
              renderInline(numbered[2], key),
            ),
          )
          continue
        }
        const quote = /^\s*>\s?(.*)$/u.exec(line)
        if (quote !== null) {
          flush()
          const key = 'q' + String(blocks.length)
          blocks.push(h('div', { key, className: 'sh-md-q' }, renderInline(quote[1], key)))
          continue
        }
        paragraph.push(line.trim())
      }
      flushTable()
      flush()
      if (fence !== null) blocks.push(h('pre', { key: 'c' + String(blocks.length) }, fence.join('\n')))
      return blocks
    }

    /**
     * A pipe table, drawn as a compact grid of flex rows: the popover is 400px
     * wide, so a real <table> would overflow before it ever became readable.
     */
    function renderTable(lines, prefix) {
      const rows = lines.map((line) =>
        line
          .trim()
          .replace(/^\|/u, '')
          .replace(/\|$/u, '')
          .split('|')
          .map((cell) => cell.trim()),
      )
      const isDivider = (cells) => cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/u.test(cell))
      let header = null
      let body = rows
      if (rows.length > 1 && isDivider(rows[1])) {
        header = rows[0]
        body = rows.slice(2)
      }
      const shown = body.slice(0, 6)
      const cellNodes = (cells, keyBase) =>
        cells.map((cell, index) => h('span', { key: keyBase + String(index), className: 'sh-md-td' }, renderInline(cell, keyBase + String(index))))
      return h(
        'div',
        { key: prefix, className: 'sh-md-table' },
        header === null
          ? null
          : h('div', { className: 'sh-md-tr sh-md-th' }, cellNodes(header, prefix + 'h')),
        shown.map((cells, rowIndex) =>
          h('div', { className: 'sh-md-tr', key: prefix + 'r' + String(rowIndex) }, cellNodes(cells, prefix + 'r' + String(rowIndex) + 'c')),
        ),
        body.length > shown.length ? h('div', { className: 'sh-md-tr sh-md-more' }, '…') : null,
      )
    }

    /**
     * Ask the Host half for one Session's tail.
     *
     * Every browser-side read path (page cursor, retained binding) failed for a
     * Session the panel is not displaying, so the Host answers instead: it reads
     * the folded model surface, which needs no Agent and no live cursor.
     */
    async function fetchPreview(sessionId) {
      const cached = previewCache.get(sessionId)
      if (cached !== undefined && Date.now() - cached.at < PREVIEW_TTL_MS) return cached.value
      try {
        const response = await fetch('/plugins/session-hub/preview?sessionId=' + encodeURIComponent(sessionId), {
          credentials: 'same-origin',
          cache: 'no-store',
        })
        if (!response.ok) return emptyResult('error', response.status)
        const payload = await response.json()
        const raw = payload !== null && typeof payload === 'object' && Array.isArray(payload.lines) ? payload.lines : []
        // Newest assistant reply only: the popover is a "where did it land"
        // glance, not a transcript.
        let latest = null
        for (const line of raw) {
          if (line === null || typeof line !== 'object' || typeof line.text !== 'string' || line.text === '') continue
          if (line.role !== 'assistant') continue
          latest = line
        }
        const lines = []
        if (latest !== null) {
          const text = toPlain(latest.text)
          if (text !== '') lines.push({ role: 'assistant', text })
        }
        const result = { kind: lines.length > 0 ? 'ready' : 'empty', lines, count: lines.length, lastType: '' }
        previewCache.set(sessionId, { at: Date.now(), value: result })
        if (previewCache.size > 100) {
          for (const key of [...previewCache.keys()].slice(0, 50)) previewCache.delete(key)
        }
        return result
      } catch {
        return emptyResult('error', -1)
      }
    }

    /**
     * Flatten history records into a short preview. Reasoning is dropped, tool
     * output is kept short: the popover answers "what happened", not "show log".
     */
    function previewLines(records) {
      const lines = []
      let lastType = ''
      if (!Array.isArray(records)) return { lines, count: 0, lastType }
      for (const record of records) {
        const event = record === undefined ? undefined : record.event
        if (event === undefined) continue
        lastType = String(event.type)
        const data = event.data
        if (event.type === 'user/message') {
          const text = blocksText(data === undefined ? undefined : data.content)
          if (text !== '') lines.push({ role: 'user', text })
        } else if (event.type === 'assistant/message') {
          const text = blocksText(data === undefined ? undefined : data.content)
          if (text !== '') lines.push({ role: 'assistant', text })
        } else if (event.type === 'tool/call') {
          lines.push({ role: 'tool', text: String(data === undefined ? '' : data.name) })
        } else if (event.type === 'tool/result') {
          const message = data === undefined || data === null ? undefined : data.message
          const text = blocksText(message === undefined ? undefined : message.content)
          if (text !== '') lines.push({ role: 'tool', text })
        }
      }
      return { lines: lines.slice(-8), count: records.length, lastType }
    }

    function blocksText(content) {
      if (!Array.isArray(content)) return ''
      const parts = []
      for (const block of content) {
        if (block !== null && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string') parts.push(block.text)
      }
      return parts.join('\n').trim()
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'session-hub: dictionaries')
      const t = ctx.locale.bind(NS)
      const skin = resolveSkin()
      const fontSize = resolveFont()

      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS,
            inject: () => ({
              sessionsSource: ctx.sessions.list,
              workspacesSource: ctx.workspaces.list,
              hubPath: HUB_PATH,
              skin,
              fontSize,
              openSession: (id) => ctx.uiWorkspace.openSession(id),
              loadPreview: (sessionId) => fetchPreview(sessionId),
              sessions: ctx.sessions,
              workspaces: ctx.workspaces,
            }),
          },
          SessionHubPage,
        ),
      )

      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: -10,
            locale: NS,
            label: () => t('panel'),
          },
          SessionHubIcon,
        ),
      )
    }

    return { inject, apply }
  },
})
