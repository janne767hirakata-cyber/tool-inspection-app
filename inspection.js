// js/inspection.js

const InspectionView = {
    currentInspection: null,

    render() {
        const template = document.getElementById('tmpl-inspection').content.cloneNode(true);
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        container.appendChild(template);

        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('btn-start-inspection').addEventListener('click', () => {
            const inspectorName = document.getElementById('inspector-name').value.trim();
            if (!inspectorName) {
                alert('点検実施者名を入力してください。');
                return;
            }
            this.startInspection(inspectorName);
        });

        const submitBtn = document.getElementById('btn-submit-inspection');
        if(submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitInspection();
            });
        }
    },

    startInspection(inspectorName) {
        document.getElementById('inspection-start-card').style.display = 'none';
        document.getElementById('inspection-form-container').style.display = 'block';
        
        const now = new Date();
        document.getElementById('current-inspection-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月の点検作業`;

        const items = StorageManager.getItems();
        
        // 点検用データの初期化
        this.currentInspection = {
            inspector: inspectorName,
            records: items.map(item => ({
                id: item.id,
                name: item.name,
                location: item.location || 'A',
                type: item.type,
                requiredQty: item.requiredQty,
                currentQty: item.currentQty,
                needPaintCheck: item.needPaintCheck,
                paintChecked: false, // 今回の点検での確認結果
                status: item.status,
                calibrationDate: item.calibrationDate
            }))
        };

        this.renderInspectionTable();
    },

    renderInspectionTable() {
        const tbody = document.getElementById('inspection-tbody');
        
        if (this.currentInspection.records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">点検対象の工具がありません。</td></tr>';
            return;
        }

        tbody.innerHTML = this.currentInspection.records.map((record, index) => {
            // 塗色チェックボックス
            const paintInput = record.needPaintCheck 
                ? `<input type="checkbox" id="paint-${index}" style="width:20px;height:20px;accent-color:var(--primary-color)">
                   <label for="paint-${index}" style="margin-left:8px">確認</label>`
                : `<span class="text-muted">不要</span>`;

            // 状態セレクト
            const statusSelect = `
                <select class="form-control" style="width: auto;" id="status-${index}">
                    <option value="normal" ${record.status === 'normal' ? 'selected' : ''}>通常</option>
                    <option value="borrowed" ${record.status === 'borrowed' ? 'selected' : ''}>貸出中</option>
                    <option value="calibration" ${record.status === 'calibration' ? 'selected' : ''}>校正中</option>
                </select>
            `;

            return `
            <tr>
                <td><strong>${record.name}</strong></td>
                <td><span style="display:inline-block; padding: 2px 8px; background:var(--primary-light); color:var(--primary-hover); border-radius:4px; font-weight:bold;">${record.location}</span></td>
                <td>${record.requiredQty}</td>
                <td>
                    <input type="number" id="qty-${index}" class="qty-input" value="${record.currentQty}" min="0">
                </td>
                <td>
                    <div style="display:flex;align-items:center;">
                        ${paintInput}
                    </div>
                </td>
                <td>${statusSelect}</td>
            </tr>
            `;
        }).join('');
    },

    submitInspection() {
        if (!confirm('点検データを保存して完了しますか？')) return;

        // 画面の入力値を records に反映
        this.currentInspection.records.forEach((record, index) => {
            record.currentQty = parseInt(document.getElementById(`qty-${index}`).value, 10);
            
            const paintCb = document.getElementById(`paint-${index}`);
            if (paintCb) {
                record.paintChecked = paintCb.checked;
            }

            const statusSel = document.getElementById(`status-${index}`);
            if (statusSel) {
                record.status = statusSel.value;
            }
        });

        // マスターデータの更新 (個数・状態)
        this.currentInspection.records.forEach(r => {
            const item = StorageManager.getItems().find(i => i.id === r.id);
            if (item) {
                item.currentQty = r.currentQty;
                item.status = r.status;
                StorageManager.saveItem(item);
            }
        });

        // 履歴の保存
        const savedRecord = StorageManager.saveInspection({
            inspector: this.currentInspection.inspector,
            items: this.currentInspection.records
        });

        // Power Automate Webhookへの送信処理
        const settings = StorageManager.getSettings();
        if (settings.webhookUrl) {
            // UIを送信中にする（簡易的）
            const btn = document.getElementById('btn-submit-inspection');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> データ送信中...';
            btn.disabled = true;

            fetch(settings.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    inspectionId: savedRecord.id,
                    date: savedRecord.date,
                    inspector: savedRecord.inspector,
                    items: savedRecord.items
                })
            }).then(response => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                if(response.ok) {
                    alert('点検が完了し、Power Automateへのデータ送信に成功しました！');
                    App.router('reports');
                } else {
                    alert('保存は完了しましたが、Power Automateへの送信でエラーが発生しました（ステータス: ' + response.status + '）');
                    App.router('reports');
                }
            }).catch(error => {
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('保存は完了しましたが、Power Automateとの通信に失敗しました。URLやネットワークを確認してください。\n' + error);
                App.router('reports');
            });
        } else {
            alert('点検が完了しました！履歴画面へ移動します。');
            App.router('reports');
        }
    }
};
