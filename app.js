// js/app.js

const App = {
    init() {
        console.log('App initialization started. Current location:', window.location.href);
        try {
            // ストレージの初期化
            this.checkStorage();
            
            // 各コンポーネントが読み込まれているかチェック
            this.validateComponents();

            this.bindNav();
            this.bindSidebar();
            
            // 初期ルートの設定
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            console.log('Initial routing to:', hash);
            this.router(hash);
            
            // 正常に起動したら「読み込み中」表示を消す（もしあれば）
            const loadingEl = document.getElementById('app-loading');
            if (loadingEl) loadingEl.style.display = 'none';

            console.log('App initialized successfully');
        } catch (e) {
            console.error('App Init Error:', e);
            this.showFatalError(e.message);
        }
    },

    checkStorage() {
        try {
            if (typeof StorageManager !== 'undefined' && StorageManager.init) {
                StorageManager.init();
                console.log('StorageManager initialized');
            } else {
                throw new Error('StorageManager (js/storage.js) が読み込まれていないか、初期化に失敗しました。');
            }
        } catch (e) {
            console.error('Storage Check Error:', e);
            throw new Error('ストレージの初期化に失敗しました。ブラウザの設定（Cookie/ローカルストレージ）を確認してください。: ' + e.message);
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
            throw new Error('以下のファイルが読み込まれていません:\n' + missing.join('\n') + '\n\nGitHubに全てのファイルがアップロードされているか、パスが正しいか（大文字小文字など）確認してください。');
        }
        console.log('All components validated');
    },

    showFatalError(msg) {
        const container = document.getElementById('view-container') || document.body;
        container.innerHTML = `
            <div style="padding:32px; max-width:600px; margin:40px auto; color:#b91c1c; background:#fef2f2; border:2px solid #fee2e2; border-radius:12px; font-family:sans-serif; line-height:1.6;">
                <h2 style="margin-top:0; display:flex; align-items:center; gap:8px;">
                    <svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2L1,21H23L12,2Z"/></svg>
                    起動エラー
                </h2>
                <p>アプリケーションの起動中に問題が発生しました：</p>
                <div style="background:white; padding:12px; border-radius:6px; border:1px solid #fecaca; font-family:monospace; white-space:pre-wrap; margin:16px 0;">${msg}</div>
                <p style="font-size:14px; color:#7f1d1d;">
                    <strong>解決のヒント:</strong><br>
                    1. GitHubに <code>js</code> フォルダとファイルが全てアップロードされているか確認してください。<br>
                    2. ファイル名の大文字・小文字が <code>index.html</code> での指定と一致しているか確認してください。<br>
                    3. ブラウザの「再読み込み」を試してください。
                </p>
                <button onclick="location.reload()" style="background:#b91c1c; color:white; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:600;">ページを再読み込み</button>
            </div>
        `;
        const loadingEl = document.getElementById('app-loading');
        if (loadingEl) loadingEl.style.display = 'none';
    },

    bindNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
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

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });
        }

        if (overlay) {
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
        console.log(`Routing to view: ${viewName}`);
        try {
            // ナビのActive更新
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === viewName) {
                    item.classList.add('active');
                }
            });

            // タイトル更新
            const titleMap = {
                'dashboard': 'ホーム',
                'inventory': '工具マスター管理',
                'inspection': '月次点検',
                'reports': '履歴・出力',
                'settings': '設定・連携'
            };
            const title = titleMap[viewName] || 'ホーム';
            const titleEl = document.getElementById('view-title');
            if (titleEl) titleEl.textContent = title;

            // 各ビューのレンダリング
            const container = document.getElementById('view-container');
            if (!container) throw new Error('view-container not found');

            switch(viewName) {
                case 'dashboard':
                    DashboardView.render();
                    break;
                case 'inventory':
                    InventoryView.render();
                    break;
                case 'inspection':
                    InspectionView.render();
                    break;
                case 'reports':
                    ReportsView.render();
                    break;
                case 'settings':
                    SettingsView.render();
                    break;
                default:
                    DashboardView.render();
            }
        } catch (e) {
            console.error(`Routing Error (${viewName}):`, e);
            const container = document.getElementById('view-container');
            if (container) {
                container.innerHTML = `
                    <div style="padding:24px; color:#c00; background:#fee; border:1px solid #fcc; border-radius:8px;">
                        <h3>画面の切り替え中にエラーが発生しました</h3>
                        <p>${e.message}</p>
                        <button onclick="location.hash='#dashboard'; location.reload();" style="margin-top:12px; padding:6px 12px; cursor:pointer;">ホームへ戻る</button>
                    </div>
                `;
            }
        }
    }
};

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
