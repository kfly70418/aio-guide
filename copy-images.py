import os
import shutil
import sys
sys.stdout.reconfigure(encoding='utf-8')

source_dir = r"D:\BaiduNetdiskDownload\新建文件夹\redesigned_images"
target_dir = r"D:\Websites\aio-guide\public\images\articles\agent-concepts"

# 确保目标目录存在
os.makedirs(target_dir, exist_ok=True)

# 复制所有图片
count = 0
for filename in os.listdir(source_dir):
    if filename.endswith(('.png', '.webp', '.jpg', '.jpeg')):
        source_path = os.path.join(source_dir, filename)
        target_path = os.path.join(target_dir, filename)
        shutil.copy2(source_path, target_path)
        count += 1
        print(f"Copied: {filename}")

print(f"\nDone! Total files: {count}")
print(target_dir)
