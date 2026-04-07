// js/settings.js

const SettingsView = {
    render() {
        const template = document.getElementById('tmpl-settings').content.cloneNode(true);
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        container.appendChild(template);

        this.bindEvents();
        this.loadSettings();
    },

    loadSettings() {
        const settings = StorageManager.getSettings();
        const webhookInput = document.getElementById('setting-webhook-url');
        if (webhookInput) webhookInput.value = settings.webhookUrl || "";
        
        const emailInput = document.getElementById('setting-supervisor-email');
        if (emailInput) emailInput.value = settings.supervisorEmail || "";
    },

    bindEvents() {
        // Webhook URLの保存
        const webhookForm = document.getElementById('settings-webhook-form');
        if (webhookForm) {
            webhookForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const url = document.getElementById('setting-webhook-url').value.trim();
                StorageManager.saveSettings({ webhookUrl: url });
                
                const msg = document.getElementById('webhook-save-msg');
                msg.style.display = 'inline';
                setTimeout(() => { msg.style.display = 'none'; }, 3000);
            });
        }

        // メール設定の保存
        const emailForm = document.getElementById('settings-email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('setting-supervisor-email').value.trim();
                StorageManager.saveSettings({ supervisorEmail: email });
                
                const msg = document.getElementById('email-save-msg');
                msg.style.display = 'inline';
                setTimeout(() => { msg.style.display = 'none'; }, 3000);
            });
        }

        // データのエクスポート（バックアップ）
        document.getElementById('btn-export-data').addEventListener('click', () => {
            const data = StorageManager.exportData();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const dlAnchorElem = document.createElement('a');
            dlAnchorElem.setAttribute("href", dataStr);
            dlAnchorElem.setAttribute("download", `inspection_backup_${new Date().getTime()}.json`);
            dlAnchorElem.click();
        });

        // データのインポート（復元）
        const importBtn = document.getElementById('btn-import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const fileInput = document.getElementById('file-import-data');
                const file = fileInput.files[0];
                
                if(!file) {
                    alert('バックアップファイル (.json) を選択してください。');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const jsonData = JSON.parse(e.target.result);
                        const success = StorageManager.importData(jsonData);
                        if(success) {
                            alert('データの読み込みに成功しました！アプリをリロードします。');
                            window.location.reload();
                        } else {
                            alert('不正なファイルフォーマットです。読み込めませんでした。');
                        }
                    } catch(err) {
                        alert('ファイルの解析に失敗しました。正しいJSONファイルか確認してください。');
                    }
                };
                reader.readAsText(file);
            });
        }
    }
};
