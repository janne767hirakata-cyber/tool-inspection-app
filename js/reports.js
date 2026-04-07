// js/reports.js

const ReportsView = {
    render() {
        const template = document.getElementById('tmpl-reports').content.cloneNode(true);
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        container.appendChild(template);

        this.renderHistory();
    },

    renderHistory() {
        const inspections = StorageManager.getInspections();
        const tbody = document.getElementById('reports-tbody');
        
        if (inspections.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">点検履歴がありません。</td></tr>';
            return;
        }

        tbody.innerHTML = inspections.map((record, index) => {
            const dateObj = new Date(record.date);
            const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
            
            // アラート（規定数割れ）があるかチェック
            const hasAlert = record.items.some(i => i.currentQty < i.requiredQty);
            const statusHtml = hasAlert 
                ? '<span class="status-badge alert">要補充あり</span>' 
                : '<span class="status-badge normal">正常</span>';

            return `
            <tr>
                <td><strong>${dateStr}</strong></td>
                <td>${record.inspector}</td>
                <td>${record.items.length} 項目</td>
                <td>${statusHtml}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="ReportsView.exportExcel('${record.id}')">
                        <i class="ph ph-file-xls mr-1"></i> Excel出力
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="ReportsView.printReport('${record.id}')">
                        <i class="ph ph-printer mr-1"></i> 印刷/PDF
                    </button>
                </td>
            </tr>
            `;
        }).join('');
    },

    exportExcel(inspectionId) {
        if (typeof XLSX === 'undefined') {
            alert('Excel出力ライブラリが読み込まれていません。ネットワーク接続を確認してください。');
            return;
        }

        const inspection = StorageManager.getInspections().find(i => i.id === inspectionId);
        if (!inspection) return;

        const dateObj = new Date(inspection.date);
        const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth()+1}/${dateObj.getDate()}`;

        // Excel用データの作成 (Header + Row + Items)
        const wb = XLSX.utils.book_new();

        // シート1: 提出用フォーマット
        const wsData = [
            ["月次工具・器具 点検報告書"],
            [""],
            ["点検日:", dateStr, "", "承認印欄"],
            ["点検者:", inspection.inspector, "", "　　　　　　"],
            [""],
            ["工具名", "規定数", "点検時数量", "状態", "塗色確認", "備考"]
        ];

        inspection.items.forEach(item => {
            let statusText = "通常";
            if(item.status === 'borrowed') statusText = "貸出中";
            if(item.status === 'calibration') statusText = "校正中";

            let paintText = item.needPaintCheck ? (item.paintChecked ? "確認済" : "未確認") : "不要";
            
            let note = "";
            if (item.currentQty < item.requiredQty) {
                note = "★規定数不足・要補充";
            }

            wsData.push([
                item.name,
                item.requiredQty,
                item.currentQty,
                statusText,
                paintText,
                note
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // 簡単なセル幅調整
        ws['!cols'] = [
            { wch: 25 }, // 工具名
            { wch: 10 }, // 規定数
            { wch: 10 }, // 確認数
            { wch: 12 }, // 状態
            { wch: 10 }, // 塗色
            { wch: 25 }  // 備考
        ];

        XLSX.utils.book_append_sheet(wb, ws, "点検結果");
        
        const fileName = `点検記録_${dateObj.getFullYear()}${String(dateObj.getMonth()+1).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    },

    printReport(inspectionId) {
        const inspection = StorageManager.getInspections().find(i => i.id === inspectionId);
        if (!inspection) return;

        const dateObj = new Date(inspection.date);
        const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth()+1}月${dateObj.getDate()}日`;

        // 印刷用の新しいウィンドウ/内容を構成 (簡易実装)
        let printWindow = window.open('', '_blank');
        
        let rowsHtml = inspection.items.map(item => {
            let statusText = "通常";
            if(item.status === 'borrowed') statusText = "貸出中";
            if(item.status === 'calibration') statusText = "校正中";

            let paintText = item.needPaintCheck ? (item.paintChecked ? "確認済" : "未確認") : "不要";
            let warningStyle = (item.currentQty < item.requiredQty) ? 'color: red; font-weight: bold;' : '';
            let note = (item.currentQty < item.requiredQty) ? "不足" : "";

            return `
                <tr>
                    <td>${item.name}</td>
                    <td style="text-align:center">${item.requiredQty}</td>
                    <td style="text-align:center; ${warningStyle}">${item.currentQty}</td>
                    <td style="text-align:center">${statusText}</td>
                    <td style="text-align:center">${paintText}</td>
                    <td style="color:red">${note}</td>
                </tr>
            `;
        }).join('');

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>点検記録の印刷</title>
                <style>
                    body { font-family: sans-serif; line-height: 1.5; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;}
                    h1 { text-align: center; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
                    .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .sign-box { border: 1px solid #333; width: 80px; height: 80px; display:flex; align-items:flex-end; justify-content:center; padding:5px; margin-left: auto; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    @media print {
                        .no-print { display: none; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <button class="no-print" onclick="window.print()" style="padding: 10px; background: #f97316; color: white; border: none; cursor:pointer; margin-bottom: 20px; border-radius: 4px;">このページを印刷 / PDF保存</button>
                <h1>月次 工期具点検 報告書</h1>
                <div class="header-info">
                    <div>
                        <p><strong>点検日：</strong> ${dateStr}</p>
                        <p><strong>点検者：</strong> ${inspection.inspector}</p>
                    </div>
                    <div>
                        <div style="font-size: 12px; margin-bottom: 5px; text-align:center;">承認印</div>
                        <div class="sign-box">印</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>工具・器具名</th>
                            <th style="text-align:center">規定数</th>
                            <th style="text-align:center">確認数</th>
                            <th style="text-align:center">状態</th>
                            <th style="text-align:center">塗色</th>
                            <th>備考</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }
};
