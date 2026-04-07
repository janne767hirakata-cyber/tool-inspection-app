// js/inventory.js

const InventoryView = {
    render() {
        const template = document.getElementById('tmpl-inventory').content.cloneNode(true);
        const container = document.getElementById('view-container');
        container.innerHTML = '';
        container.appendChild(template);

        this.bindEvents();
        this.renderTable();
    },

    bindEvents() {
        document.getElementById('btn-add-item').addEventListener('click', () => {
            this.openModal();
        });

        const modal = document.getElementById('item-modal');
        const closeModalBtns = modal.querySelectorAll('.modal-close, #btn-cancel-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        });

        // 画像選択時の処理
        const imageInput = document.getElementById('item-image-input');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handleImageSelection(file);
                }
            });
        }

        document.getElementById('item-status').addEventListener('change', (e) => {
            const calGroup = document.getElementById('calibration-date-group');
            if (e.target.value === 'calibration') {
                calGroup.style.display = 'block';
            } else {
                calGroup.style.display = 'none';
            }
        });

        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });
    },

    async handleImageSelection(file) {
        try {
            const base64 = await this.resizeImage(file, 300, 300);
            this.showImagePreview(base64);
            document.getElementById('item-image-base64').value = base64;
        } catch (error) {
            console.error('Image processing error:', error);
            alert('画像の処理に失敗しました。');
        }
    },

    resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // 品質0.7で容量削減
                };
            };
            reader.onerror = error => reject(error);
        });
    },

    showImagePreview(base64) {
        const preview = document.getElementById('image-preview');
        const prompt = document.getElementById('upload-prompt');
        if (base64) {
            preview.src = base64;
            preview.style.display = 'block';
            prompt.style.display = 'none';
        } else {
            preview.style.display = 'none';
            prompt.style.display = 'flex';
        }
    },

    renderTable() {
        const items = StorageManager.getItems();
        const tbody = document.getElementById('inventory-tbody');
        
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">工具が登録されていません。</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            const typeLabel = item.type === 'equipment' ? '単品' : '消耗品';
            const locationLabel = item.location || 'A';
            
            const thumbHtml = item.image 
                ? `<img src="${item.image}" class="tool-thumb" alt="${item.name}">`
                : `<div class="tool-thumb-placeholder"><i class="ph ph-wrench"></i></div>`;

            let statusHtml = '';
            if (item.status === 'normal') statusHtml = `<span class="status-badge normal">通常</span>`;
            else if (item.status === 'borrowed') statusHtml = `<span class="status-badge borrowed">貸出中</span>`;
            else if (item.status === 'calibration') statusHtml = `<span class="status-badge calibration">校正中</span>`;
            
            return `
            <tr>
                <td>${thumbHtml}</td>
                <td><strong>${item.name}</strong></td>
                <td><span style="display:inline-block; padding: 2px 8px; background:var(--primary-light); color:var(--primary-color); border-radius:4px; font-weight:700;">${locationLabel}</span></td>
                <td>${typeLabel}</td>
                <td>${item.requiredQty}</td>
                <td>${statusHtml}</td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <button class="btn-icon" title="編集" onclick="InventoryView.editItem('${item.id}')">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon" style="color:var(--danger-color)" title="削除" onclick="InventoryView.deleteItem('${item.id}')">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
    },

    openModal(itemId = null) {
        document.getElementById('item-form').reset();
        document.getElementById('item-id').value = '';
        document.getElementById('item-image-base64').value = '';
        document.getElementById('calibration-date-group').style.display = 'none';
        document.getElementById('modal-title').textContent = itemId ? '工具の編集' : '新規工具の追加';
        this.showImagePreview(null);

        if (itemId) {
            const items = StorageManager.getItems();
            const item = items.find(i => i.id === itemId);
            if (item) {
                document.getElementById('item-id').value = item.id;
                document.getElementById('item-name').value = item.name;
                document.getElementById('item-type').value = item.type;
                document.getElementById('item-location').value = item.location || 'A';
                document.getElementById('item-required-qty').value = item.requiredQty;
                document.getElementById('item-paint').checked = item.needPaintCheck;
                document.getElementById('item-status').value = item.status;
                if (item.image) {
                    this.showImagePreview(item.image);
                    document.getElementById('item-image-base64').value = item.image;
                }
                if (item.status === 'calibration') {
                    document.getElementById('calibration-date-group').style.display = 'block';
                    document.getElementById('item-calibration-date').value = item.calibrationDate || '';
                }
            }
        }

        document.getElementById('item-modal').classList.add('active');
    },

    editItem(id) {
        this.openModal(id);
    },

    saveItem() {
        const id = document.getElementById('item-id').value;
        const imageBase64 = document.getElementById('item-image-base64').value;
        
        const itemData = {
            name: document.getElementById('item-name').value,
            type: document.getElementById('item-type').value,
            location: document.getElementById('item-location').value,
            requiredQty: parseInt(document.getElementById('item-required-qty').value, 10),
            needPaintCheck: document.getElementById('item-paint').checked,
            status: document.getElementById('item-status').value,
            calibrationDate: document.getElementById('item-calibration-date').value,
            image: imageBase64,
            currentQty: parseInt(document.getElementById('item-required-qty').value, 10),
        };

        if (id) {
            itemData.id = id;
            const existing = StorageManager.getItems().find(i => i.id === id);
            if (existing) itemData.currentQty = existing.currentQty;
        }

        StorageManager.saveItem(itemData);
        document.getElementById('item-modal').classList.remove('active');
        this.renderTable();
    },

    deleteItem(id) {
        if (confirm('この工具を削除してもよろしいですか？')) {
            StorageManager.deleteItem(id);
            this.renderTable();
        }
    }
};
