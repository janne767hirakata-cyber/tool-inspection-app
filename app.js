// js/app.js

const App = {
    init() {
        console.log('App initialization started');
        try {
            // ストレージの初期化（データがない場合のデフォルト投入）
            if (typeof StorageManager !== 'undefined' && StorageManager.init) {
                StorageManager.init();
            } else {
                console.warn('StorageManager not found or init missing');
            }
            
            this.bindNav();
            this.bindSidebar();
            
            // 初期ルートの設定
            const hash = window.location.hash.replace('#', '') || 'dashboard';
            this.router(hash);
            
            console.log('App initialized successfully');
        } catch (e) {
            console.error('App Init Error:', e);
            // 画面上にエラーを表示（デバッグ用）
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;bottom:0;right:0;background:rgba(255,0,0,0.8);color:white;padding:10px;z-index:9999;font-size:12px;';
            errorDiv.textContent = '起動エラー: ' + e.message;
            document.body.appendChild(errorDiv);
        }
    },

    bindNav() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // ハッシュ変更による自動ルーティングを補助するため、
                // モバイル表示時はサイドバーを閉じる処理のみを行う
                this.closeSidebar();
            });
        });

        // ハッシュ変更時にもルーティング
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
                    if (typeof DashboardView !== 'undefined') DashboardView.render();
                    break;
                case 'inventory':
                    if (typeof InventoryView !== 'undefined') InventoryView.render();
                    break;
                case 'inspection':
                    if (typeof InspectionView !== 'undefined') InspectionView.render();
                    break;
                case 'reports':
                    if (typeof ReportsView !== 'undefined') ReportsView.render();
                    break;
                case 'settings':
                    if (typeof SettingsView !== 'undefined') SettingsView.render();
                    break;
                default:
                    if (typeof DashboardView !== 'undefined') DashboardView.render();
            }
        } catch (e) {
            console.error(`Routing Error (${viewName}):`, e);
            const container = document.getElementById('view-container');
            if (container) {
                container.innerHTML = `
                    <div style="padding:24px; color:#c00; background:#fee; border:1px solid #fcc; border-radius:8px;">
                        <h3>画面の読み込み中にエラーが発生しました</h3>
                        <p>${e.message}</p>
                        <p style="font-size:12px; margin-top:8px;">コンソールログを確認してください。</p>
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
