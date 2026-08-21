const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const IMAGE_DIR = path.join(__dirname, '..', 'public', 'images');
const TARGET_SIZE_KB = 300; // 目标大小：300KB
const QUALITY = 80; // 初始质量

async function getImageFiles(dir) {
  const files = [];

  async function scan(directory) {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  return stats.size;
}

async function compressImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const originalSize = await getFileSize(inputPath);
  const originalSizeKB = Math.round(originalSize / 1024);

  // 如果已经小于目标大小，跳过
  if (originalSizeKB <= TARGET_SIZE_KB) {
    return { skipped: true, originalSizeKB };
  }

  console.log(`压缩中: ${path.basename(inputPath)} (${originalSizeKB} KB)`);

  try {
    // 创建临时输出路径
    const tempPath = inputPath + '.temp';

    // 使用 sharp 压缩
    let pipeline = sharp(inputPath);

    // 转换为 WebP 格式（更好的压缩率）
    if (ext === '.png') {
      await pipeline
        .webp({ quality: QUALITY, effort: 6 })
        .toFile(tempPath);
    } else {
      await pipeline
        .jpeg({ quality: QUALITY, progressive: true })
        .toFile(tempPath);
    }

    const compressedSize = await getFileSize(tempPath);
    const compressedSizeKB = Math.round(compressedSize / 1024);
    const savedKB = originalSizeKB - compressedSizeKB;
    const savedPercent = Math.round((savedKB / originalSizeKB) * 100);

    // 如果压缩后大小合适，替换原文件
    if (compressedSizeKB <= TARGET_SIZE_KB || savedPercent >= 30) {
      // 备份原文件
      const backupDir = path.join(__dirname, '..', 'public', 'images', '_backup');
      await fs.mkdir(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, path.basename(inputPath));
      await fs.copyFile(inputPath, backupPath);

      // 替换原文件
      await fs.rename(tempPath, inputPath);

      console.log(`  ✓ ${originalSizeKB} KB → ${compressedSizeKB} KB (省 ${savedPercent}%)`);

      return {
        success: true,
        originalSizeKB,
        compressedSizeKB,
        savedKB,
        savedPercent
      };
    } else {
      // 压缩效果不理想，删除临时文件
      await fs.unlink(tempPath);
      console.log(`  ⚠ 压缩效果不理想，跳过`);
      return { skipped: true, originalSizeKB };
    }

  } catch (error) {
    console.error(`  ✗ 压缩失败: ${error.message}`);
    return { error: true, message: error.message };
  }
}

async function optimizeImages() {
  console.log('===== 开始图片优化 =====\n');
  console.log(`目标目录: ${IMAGE_DIR}`);
  console.log(`目标大小: ${TARGET_SIZE_KB} KB\n`);

  // 检查是否安装了 sharp
  try {
    require.resolve('sharp');
  } catch (e) {
    console.error('❌ 未安装 sharp，请先运行: npm install sharp');
    process.exit(1);
  }

  const imageFiles = await getImageFiles(IMAGE_DIR);
  console.log(`找到 ${imageFiles.length} 个图片文件\n`);

  let compressed = 0;
  let skipped = 0;
  let errors = 0;
  let totalOriginalKB = 0;
  let totalCompressedKB = 0;

  for (const imagePath of imageFiles) {
    const result = await compressImage(imagePath);

    if (result.success) {
      compressed++;
      totalOriginalKB += result.originalSizeKB;
      totalCompressedKB += result.compressedSizeKB;
    } else if (result.skipped) {
      skipped++;
    } else if (result.error) {
      errors++;
    }
  }

  console.log('\n===== 优化完成 =====');
  console.log(`✓ 已压缩: ${compressed} 个`);
  console.log(`⚠ 已跳过: ${skipped} 个（小于 ${TARGET_SIZE_KB} KB 或压缩效果不理想）`);
  console.log(`✗ 失败: ${errors} 个`);

  if (compressed > 0) {
    const totalSavedKB = totalOriginalKB - totalCompressedKB;
    const totalSavedMB = (totalSavedKB / 1024).toFixed(2);
    const avgSavedPercent = Math.round((totalSavedKB / totalOriginalKB) * 100);

    console.log(`\n节省空间: ${totalSavedMB} MB (${avgSavedPercent}%)`);
    console.log(`原始大小: ${(totalOriginalKB / 1024).toFixed(2)} MB`);
    console.log(`压缩后: ${(totalCompressedKB / 1024).toFixed(2)} MB`);
  }

  console.log('\n备份位置: public/images/_backup/');
}

// 运行优化
optimizeImages().catch(console.error);
