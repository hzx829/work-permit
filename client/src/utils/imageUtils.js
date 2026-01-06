/**
 * 图片处理工具函数
 * 用于压缩和优化图片，提高加载速度
 */

/**
 * 压缩图片
 * @param {File|Blob} file - 要压缩的图片文件
 * @param {Object} options - 压缩选项
 * @param {number} options.maxWidth - 最大宽度，默认 1200px
 * @param {number} options.maxHeight - 最大高度，默认 1200px
 * @param {number} options.quality - 压缩质量 0-1，默认 0.7
 * @param {string} options.mimeType - 输出格式，默认 'image/jpeg'
 * @returns {Promise<string>} - 压缩后的 Base64 字符串
 */
export function compressImage(file, options = {}) {
    const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.7,
        mimeType = 'image/jpeg'
    } = options;

    return new Promise((resolve, reject) => {
        // 如果文件小于 100KB，不需要压缩
        if (file.size < 100 * 1024) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // 计算缩放后的尺寸
                let { width, height } = img;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }

                // 创建 canvas 进行压缩
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                
                // 使用白色背景（避免 PNG 透明背景变黑）
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                
                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);

                // 转换为 Base64
                const compressedDataUrl = canvas.toDataURL(mimeType, quality);
                
                // 如果压缩后反而更大，使用原图
                if (compressedDataUrl.length > e.target.result.length) {
                    resolve(e.target.result);
                } else {
                    resolve(compressedDataUrl);
                }
            };
            img.onerror = () => reject(new Error('图片加载失败'));
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 批量压缩图片
 * @param {FileList|File[]} files - 文件列表
 * @param {Object} options - 压缩选项
 * @returns {Promise<Array<{url: string, name: string, uploadTime: string}>>}
 */
export async function compressImages(files, options = {}) {
    const results = [];
    
    for (const file of files) {
        try {
            const compressedUrl = await compressImage(file, options);
            results.push({
                url: compressedUrl,
                name: file.name,
                uploadTime: new Date().toISOString()
            });
        } catch (error) {
            console.error(`压缩图片 ${file.name} 失败:`, error);
            // 压缩失败时使用原图
            const reader = new FileReader();
            const url = await new Promise((resolve) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            results.push({
                url,
                name: file.name,
                uploadTime: new Date().toISOString()
            });
        }
    }
    
    return results;
}

/**
 * 生成图片缩略图（用于列表预览）
 * @param {string} base64Url - 原始 Base64 图片
 * @param {number} maxSize - 缩略图最大尺寸，默认 200px
 * @returns {Promise<string>} - 缩略图 Base64
 */
export function generateThumbnail(base64Url, maxSize = 200) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;
            
            // 计算缩略图尺寸
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = () => reject(new Error('生成缩略图失败'));
        img.src = base64Url;
    });
}

/**
 * 估算 Base64 图片大小（KB）
 * @param {string} base64Url - Base64 图片字符串
 * @returns {number} - 估算大小（KB）
 */
export function estimateBase64Size(base64Url) {
    if (!base64Url) return 0;
    // Base64 编码后大小约为原始数据的 4/3
    const base64Length = base64Url.length - (base64Url.indexOf(',') + 1);
    return Math.round((base64Length * 3) / 4 / 1024);
}
