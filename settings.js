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
        document.getElementById('setting-webhook-url').value = settings.webhookUrl || "";
    },

    bindEvents() {
        // Webhook URLの保存
        document.getElementById('settings-webhook-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const url = document.getElementById('setting-webhook-url').value.trim();
            StorageManager.saveSettings({ webhookUrl: url });
            
            const msg = document.getElementById('webhook-save-msg');
            msg.style.display = 'inline';
            setTimeout(() => { msg.style.display = 'none'; }, 3000);
        });

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
        document.getElementById('btn-import-data').addEventListener('click', () => {
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
};
