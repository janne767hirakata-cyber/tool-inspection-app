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
                paintChecked: false,
                status: item.status,
                calibrationDate: item.calibrationDate,
                image: item.image
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
            const paintInput = record.needPaintCheck 
                ? `<div class="checkbox-wrapper">
                    <input type="checkbox" id="paint-${index}">
                    <label for="paint-${index}">確認済</label>
                   </div>`
                : `<span class="text-muted">不要</span>`;

            const statusSelect = `
                <select class="form-control" style="width: auto;" id="status-${index}">
                    <option value="normal" ${record.status === 'normal' ? 'selected' : ''}>通常</option>
                    <option value="borrowed" ${record.status === 'borrowed' ? 'selected' : ''}>貸出中</option>
                    <option value="calibration" ${record.status === 'calibration' ? 'selected' : ''}>校正中</option>
                </select>
            `;

            const thumbHtml = record.image 
                ? `<img src="${record.image}" class="tool-thumb" style="width:48px;height:48px;">`
                : `<div class="tool-thumb-placeholder" style="width:48px;height:48px;"><i class="ph ph-wrench"></i></div>`;

            return `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                        ${thumbHtml}
                        <div>
                            <div style="font-weight:700; color:var(--secondary-color);">${record.name}</div>
                            <div style="font-size:12px; color:var(--text-muted);">${record.location}エリア</div>
                        </div>
                    </div>
                </td>
                <td style="font-weight:600;">${record.requiredQty}</td>
                <td>
                    <input type="number" id="qty-${index}" class="qty-input" value="${record.currentQty}" min="0">
                </td>
                <td>${paintInput}</td>
                <td>${statusSelect}</td>
            </tr>
            `;
        }).join('');
    },

    submitInspection() {
        if (!confirm('点検データを保存して完了しますか？')) return;

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

        this.currentInspection.records.forEach(r => {
            const item = StorageManager.getItems().find(i => i.id === r.id);
            if (item) {
                item.currentQty = r.currentQty;
                item.status = r.status;
                StorageManager.saveItem(item);
            }
        });

        const savedRecord = StorageManager.saveInspection({
            inspector: this.currentInspection.inspector,
            items: this.currentInspection.records
        });

        const settings = StorageManager.getSettings();
        
        // Webhook送信処理
        if (settings.webhookUrl) {
            this.sendToWebhook(settings.webhookUrl, savedRecord);
        }

        // 完了メッセージとメール送信の選択
        this.showCompletionModal(savedRecord, settings.supervisorEmail);
    },

    sendToWebhook(url, record) {
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        }).catch(e => console.error('Webhook Error:', e));
    },

    showCompletionModal(record, email) {
        const hasAlerts = record.items.some(i => i.currentQty < i.requiredQty || (i.needPaintCheck && !i.paintChecked));
        const alertText = hasAlerts ? '【注意】在庫不足または未確認の項目があります。' : '全ての項目が正常に点検されました。';

        if (confirm(`点検が完了しました！\n\n${alertText}\n\n助役へ報告メールを送信しますか？`)) {
            this.sendEmail(record, email);
        }
        App.router('reports');
    },

    sendEmail(record, toEmail) {
        const date = new Date().toLocaleDateString('ja-JP');
        const subject = encodeURIComponent(`【工器具点検報告】${date} 実施者: ${record.inspector}`);
        
        let bodyText = `助役様\n\nお疲れ様です。本日分の工器具点検が完了しましたので報告いたします。\n\n`;
        bodyText += `■点検日: ${date}\n`;
        bodyText += `■実施者: ${record.inspector}\n\n`;
        bodyText += `■点検概要:\n`;
        
        record.items.forEach(item => {
            const isOk = item.currentQty >= item.requiredQty;
            const statusIcon = isOk ? '○' : '!!';
            bodyText += `${statusIcon} ${item.name}: ${item.currentQty}/${item.requiredQty} (状態: ${item.status})\n`;
        });

        bodyText += `\n詳細はアプリの履歴画面よりご確認ください。\n以上、よろしくお願いいたします。`;
        
        const mailto = `mailto:${toEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;
        window.location.href = mailto;
    }
};
