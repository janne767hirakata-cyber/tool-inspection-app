// js/app.js

/**
 * アプリケーションの全体制御クラス
 * 初期化、ルーティング、エラーハンドリングを担います。
 */
const App = {
    init() {
        console.log('--- App Initialization Started ---');
        console.log('UserAgent:', navigator.userAgent);
        console.log('Location:', window.location.href);

        // グローバルエラーハンドラーの登録
        this.setupGlobalErrorHandlers();

        try {
            // 1. ストレージの初期化
            console.log('Step 1: Initializing Storage...');
            this.checkStorage();
            
            // 2. コンポーネントの有効性チェック
            console.log('Step 2: Validating Components...');
            this.validateComponents();

            // 3. イベントバインド
            console.log('Step 3: Binding Events...');
            this.bindNav();
            this.bindSidebar();
            
            // 4. 初期ルートの実行
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            console.log('Step 4: Initial Routing to:', hash);
            this.router(hash);
            
            // 5. ローディング表示を確実に消す
            this.hideLoading();

            console.log('--- App Initialized Successfully ---');
        } catch (e) {
            console.error('Fatal Initialization Error:', e);
            this.hideLoading();
            this.showFatalError(e.message);
        }
    },

    /**
     * グローバルなJSエラーをキャッチして画面に表示します。
     * これにより、原因不明の「真っ白」や「フリーズ」を防ぎます。
     */
    setupGlobalErrorHandlers() {
        window.onerror = (msg, url, lineNo, columnNo, error) => {
            const errorMsg = `[Runtime Error] ${msg}\nFile: ${url}\nLine: ${lineNo}:${columnNo}`;
            console.error(errorMsg);
            this.hideLoading();
            // すでに致命的エラー画面が出ていない場合のみ表示
            if (!document.getElementById('fatal-error-box')) {
                this.showFatalError(msg + ` (at ${url}:${lineNo})`);
            }
            return false;
        };

        window.onunhandledrejection = (event) => {
            console.error('[Promise Rejection]', event.reason);
            this.hideLoading();
            this.showFatalError('非同期処理でエラーが発生しました: ' + event.reason);
        };
    },

    hideLoading() {
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
            console.log('Loading screen hidden');
        }
    },

    checkStorage() {
        if (typeof StorageManager !== 'undefined' && StorageManager.init) {
            StorageManager.init();
            console.log('StorageManager ready');
        } else {
            throw new Error('StorageManager (js/storage.js) が見つかりません。ファイルが正しくアップロードされているか確認してください。');
        }
    },

    validateComponents() {
        const required = {
            'DashboardView': 'js/dashboard.js',
            'InventoryView': 'js/inventory.js',
            'InspectionView': 'js/inspection.js',
            'ReportsView': 'js/reports.js',
            'SettingsView': 'js/settings.js'
        };

        const missing = [];
        for (const [name, path] of Object.entries(required)) {
            if (typeof window[name] === 'undefined') {
                missing.push(`${name} (${path})`);
            }
        }

        if (missing.length > 0) {
            throw new Error('以下のファイルが読み込まれていないか、壊れています:\n' + missing.join('\n'));
        }
        console.log('All View components found');
    },

    showFatalError(msg) {
        const container = document.getElementById('view-container') || document.body;
        container.innerHTML = `
            <div id="fatal-error-box" style="padding:32px; max-width:600px; margin:40px auto; color:#b91c1c; background:#fef2f2; border:2px solid #fee2e2; border-radius:12px; font-family:sans-serif; line-height:1.6; animation: fadeIn 0.3s ease;">
                <h2 style="margin-top:0; display:flex; align-items:center; gap:12px;">
                    <i class="ph-fill ph-warning-circle" style="font-size:32px;"></i>
                    起動エラー
                </h2>
                <p>申し訳ありません。アプリの起動中に問題が発生しました：</p>
                <div style="background:white; padding:16px; border-radius:8px; border:1px solid #fecaca; font-family:monospace; font-size:13px; white-space:pre-wrap; margin:20px 0; overflow-x:auto;">${msg}</div>
                <div style="font-size:14px; color:#7f1d1d; border-top:1px solid #fee2e2; padding-top:20px;">
                    <strong>解決のためのチェックリスト:</strong>
                    <ul style="margin:8px 0; padding-left:20px;">
                        <li>GitHubに <code>js</code> フォルダ内の全てのファイルがアップロードされているか。</li>
                        <li>ファイル名の大文字・小文字が <code>index.html</code> の指定（すべて小文字を推奨）と一致しているか。</li>
                        <li>ブラウザのキャッシュをクリアして再読み込みしてください。</li>
                    </ul>
                </div>
                <button onclick="location.reload()" style="margin-top:24px; background:#b91c1c; color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:600; width:100%;">
                    ページを再読み込みする
                </button>
            </div>
        `;
    },

    bindNav() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.closeSidebar();
            });
        });

        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            this.router(hash);
            this.closeSidebar();
        });
    },

    bindSidebar() {
        const toggleBtn = document.getElementById('sidebar-toggle');
        const overlay = document.getElementById('sidebar-overlay');
        const sidebar = document.querySelector('.sidebar');

        if (toggleBtn && sidebar && overlay) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
            overlay.addEventListener('click', () => {
                this.closeSidebar();
            });
        }
    },

    closeSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    },

    router(viewName) {
        console.log(`Routing: Switching to [${viewName}]`);
        try {
            // ナビゲーションの活性状態を更新
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === viewName) {
                    item.classList.add('active');
                }
            });

            // ビューの切り替え
            const container = document.getElementById('view-container');
            if (!container) throw new Error('critical error: view-container missing in DOM');

            // 表示タイトルの更新
            const titleMap = {
                'dashboard': 'ホーム',
                'inventory': '工具マスター管理',
                'inspection': '月次点検',
                'reports': '履歴・出力',
                'settings': '設定・連携'
            };
            const titleEl = document.getElementById('view-title');
            if (titleEl) titleEl.textContent = titleMap[viewName] || 'ホーム';

            // レンダリング実行
            switch(viewName) {
                case 'dashboard': DashboardView.render(); break;
                case 'inventory': InventoryView.render(); break;
                case 'inspection': InspectionView.render(); break;
                case 'reports': ReportsView.render(); break;
                case 'settings': SettingsView.render(); break;
                default: DashboardView.render();
            }
            
            // スクロール位置を一番上へ
            window.scrollTo(0, 0);
            console.log(`View [${viewName}] rendered successfully`);
        } catch (e) {
            console.error(`Router Error (${viewName}):`, e);
            this.showViewError(viewName, e.message);
        }
    },

    showViewError(view, msg) {
        const container = document.getElementById('view-container');
        if (container) {
            container.innerHTML = `
                <div style="padding:32px; background:#fff1f2; border:1px solid #fda4af; border-radius:12px; color:#9f1239;">
                    <h3 style="margin-top:0;">画面の表示中にエラーが発生しました</h3>
                    <p style="font-family:monospace; background:white; padding:8px; border-radius:4px; margin:12px 0;">${msg}</p>
                    <button onclick="location.hash='#dashboard'; location.reload();" class="btn btn-primary">ホームへ戻る</button>
                </div>
            `;
        }
    }
};

// DOM構築完了時に起動
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
