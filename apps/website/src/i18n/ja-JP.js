export const jaJP = {
  brand: {
    name: 'Raiznet',
  },
  seo: {
    title: 'Raiznet | つながる農業のための分散ネットワーク',
    description:
      'Raiznet はセンサー、サーバー、栽培者を local-first ネットワークでつなぎ、栽培監視と集合的な農業知能を支えます。',
  },
  nav: {
    label: 'メインナビゲーション',
    home: 'Raiznet ホーム',
    projects: 'プロジェクト',
    how: '仕組み',
    download: 'ダウンロード',
    docs: 'ドキュメント',
    network: 'raiznet ネットワーク',
    safraSense: 'SafraSense',
    menu: 'メニュー',
  },
  navSub: {
    docs: 'ガイド · プロトコル · ADR',
    network: 'ダッシュボード · arateki:v1',
    download: 'Node 24 · pnpm',
    safraSense: 'ESP32 ファームウェア',
  },
  actions: {
    dashboard: 'ダッシュボードを開く',
    download: 'サーバーをダウンロード',
    docs: 'ドキュメントを読む',
    themeDark: 'ダークテーマを有効化',
    themeLight: 'ライトテーマを有効化',
    languageToggle: '言語を変更',
  },
  topBand: {
    items: ['無料 · いつでも', 'サブスク不要', '登録不要', 'アクティベーションキー不要'],
    note: 'Arateki が明日消えても、あなたのネットワークは生き続けます。',
  },
  card: {
    peerNote: '純粋な peer-to-peer',
    noCentral: '中央サーバーなし',
    youNode: 'あなた',
    status: 'ステータス',
    info: '情報',
  },
  carousel: {
    previous: '前のスライド',
    next: '次のスライド',
    goTo: 'スライドへ移動',
  },
  hero: {
    title: 'Raiznet',
    status: ['サブスクなし', '従来型ログインなし', 'ローカルネットワークで動作', 'データはあなたの鍵の下に'],
    slides: [
      {
        eyebrow: '接続農業のための Arateki オープンネットワーク',
        title: '栽培する人のための生きたネットワーク。データはいつも自分の手元に。',
        copy:
          'センサー、サーバー、栽培者のための local-first メッシュです。各読み取りは署名でき、ノード間で複製でき、中央クラウドに依存せず読めます。',
        visualTitle: 'raiznet:public:arateki:v1',
        visualMeta: '8 peers 同期中 · 124 デバイス',
        metric: '99.4%',
        metricLabel: '複製',
      },
      {
        eyebrow: 'ローカルアクセスとリモートアクセス',
        title: 'ダッシュボード、API、アプリからネットワークを追跡。',
        copy:
          'サーバーは、公開を選んだデータ用の公開エンドポイントと、所有者データ用のローカルエンドポイントを公開します。Arateki ネットワークダッシュボードも同じ構造で作られています。',
        visualTitle: 'GET /v1/devices',
        visualMeta: ':3000 で公開 · :3001 でローカル',
        metric: '12s',
        metricLabel: '最終読み取り',
      },
      {
        eyebrow: 'フィールド単位のプライバシー',
        title: '各読み取りが、外に出すもの、暗号化するもの、ローカルに残すものを決めます。',
        copy:
          'pH、導電率、温度、湿度、水位は、送信先ごとに平文、暗号化、省略という異なるポリシーを持てます。',
        visualTitle: 'policy.water_ph = plain',
        visualMeta: 'policy.air_humidity = encrypted',
        metric: '3',
        metricLabel: '処理方式',
      },
      {
        eyebrow: 'H3 マップと集合知',
        title: '栽培データは農場をさらさず地域の文脈になります。',
        copy:
          '位置情報は、所有者が粒度を選ぶ H3 セルを使います。その結果、ローカル LLM、研究者、協同組合が実際のパターンを見つけるための基盤になります。',
        visualTitle: 'H3 8a2a107fffff',
        visualMeta: '地域クラスター · k-anon を製品ルールに',
        metric: 'H3',
        metricLabel: 'プライベート地図',
      },
      {
        eyebrow: 'AI · MCP · 教材',
        title: 'AI がデータをガイド、回答、栽培知識へ変えます。',
        copy:
          'MCP により、AI は読み取り、栽培サイクル、地域統計を参照し、推奨、レポート、署名付き教材をネットワーク上で生成・共有できます。',
        visualTitle: '@raiznet/mcp',
        visualMeta: 'ガイド · レポート · ベストプラクティス',
        metric: 'AI',
        metricLabel: '応用知識',
      },
      {
        eyebrow: '登録のいらないアイデンティティ',
        title: '12 個の単語でユーザー権限を復元。',
        copy:
          'アイデンティティは Ed25519 鍵と BIP-39 シードフレーズから生まれます。中央ログインサーバー、必須 API キー、管理アカウントへの依存はありません。',
        visualTitle: 'owner_pubkey',
        visualMeta: 'BIP-39 · Ed25519 · デバイス署名',
        metric: '12',
        metricLabel: '単語',
      },
    ],
  },
  events: {
    eyebrow: 'エフェメリス · ライブ',
    titleStart: 'ネットワークが',
    titleEmphasis: 'いま見ている',
    titleEnd: 'もの。',
    items: [
      {
        title: '14 ノードで pH が低下',
        body: 'Cariri 地域では夜明けに雨が降り、酸性度も一緒に上がりました。',
        tech: '14 ノード · H3 クラスター · pH delta -0.6 / 4h',
      },
      {
        title: '異常な熱の動き',
        body: 'Petrolina の地点は正午前に 36C を超えました。',
        tech: '38 ノード · z-score +2.1 sigma',
      },
      {
        title: '現在 - ライブ読み取り',
        body: '北東部の農業環境は安定しています。午後の灌水に良い時間帯です。',
        tech: '124 デバイス · 18 都市',
      },
    ],
  },
  projects: {
    eyebrow: 'エコシステム',
    title: 'ひとつのネットワーク、複数の入り口。',
    copy:
      'このランディングページは、すでに存在するものを整理しています: SafraSense ハードウェア、Raiznet サーバー、Arateki ネットワークダッシュボード、公開技術ドキュメント。',
    items: [
      {
        icon: 'chip',
        title: 'SafraSense Aqua',
        copy: '水、環境、栽培運用を測定するタワー、ベンチ、デバイス向けの ESP32 ファームウェア。',
        meta: 'ESP32 · BIP-39 アイデンティティ · 署名付きテレメトリ',
      },
      {
        icon: 'node',
        title: 'Raiznet サーバー',
        copy: '読み取りを受け取り、公開データとローカルデータを分離し、SQLite に索引化して P2P メッシュに参加するノード。',
        meta: '署名付き HTTP · SQLite · 独自レプリケーション',
      },
      {
        icon: 'dashboard',
        title: 'Arateki ダッシュボード',
        copy: '公式ネットワーク内のデバイス、peer、フィルター、同期状態を追跡するためのネットワークビュー。',
        meta: 'raiznet:public:arateki:v1',
      },
      {
        icon: 'docs',
        title: 'ドキュメント',
        copy: 'ノードを実行または統合したい人向けのガイド、プロトコル、プライバシーモデル、スキーマ、ADR。',
        meta: 'VitePress · オープンプロトコル',
      },
    ],
  },
  how: {
    eyebrow: 'センサーから知能へ',
    title: 'ネットワークが成長しても流れはシンプルです。',
    steps: [
      {
        title: 'センサーが測定して署名',
        copy: 'ESP32 は pH、導電率、温度、湿度、水位を収集します。デバイスは送信前にブロックへ署名します。',
      },
      {
        title: 'ローカルノードが受信',
        copy: 'ノート PC、Raspberry Pi、VPS 上のサーバーが署名を検証し、公開データと非公開データを別々のデータベースに保存します。',
      },
      {
        title: 'ネットワークが複製',
        copy: '公開できるものは append-only の署名付きイベントログに入り、ネットワーク topic を通じて peer 間で複製されます。',
      },
      {
        title: 'ダッシュボードが解釈',
        copy: 'インターフェースは読み取り、フィルター、H3 マップ、メッシュ状態、栽培運用に役立つ履歴を表示します。',
      },
      {
        title: '知識が戻る',
        copy: 'ローカル LLM、研究者、地域カタログは、生産者の主権を奪わずにパターンを抽出できます。',
      },
    ],
  },
  download: {
    eyebrow: 'ノードから始める',
    title: '一般的なマシンで有効な Raiznet を実行。',
    copy:
      'サーバーはネットワークを試す最短ルートです。公開エンドポイントとローカルエンドポイントを公開し、自分のアイデンティティを生成し、センサーを受け取る基盤を準備します。',
    github: 'GitHub を開く',
    guide: 'インストールガイド',
    terminalLabel: 'インストールコマンド',
    commands: [
      '$ git clone https://github.com/arateki/raiznet',
      '$ cd raiznet',
      '$ pnpm install',
      '$ pnpm build',
      '$ pnpm --filter @raiznet/server dev',
    ],
  },
  principles: {
    eyebrow: '原則',
    title: 'ネットワークは生き続けるために所有者へ依存しません。',
    copy:
      'Raiznet は従来型 IoT プラットフォームの壊れやすい点を避けます。アイデンティティはクライアントで生まれ、書き込みは署名され、非公開データは公開メッシュに入りません。',
    items: [
      {
        title: 'Local-first',
        copy: '同じ Wi-Fi 上のセンサーとコンピューターがあれば、インターネットなしでも運用できます。',
      },
      {
        title: 'データ主権',
        copy: '鍵はユーザーの手元に残ります。Arateki が道を外れても、データはユーザーのノードに残ります。',
      },
      {
        title: 'フィールド単位のプライバシー',
        copy: '各値は送信先ごとに公開、暗号化、省略を選べます。デバイスの存在は公開でも、読み取りまで公開する必要はありません。',
      },
    ],
  },
  footer: {
    madeBy: 'Raiznet · Arateki による · 栽培する人のためのオープンプロトコル',
    github: 'github.com/arateki/raiznet',
  },
};
