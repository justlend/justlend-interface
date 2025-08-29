import hashlib
import os
import sys


def calculate_md5(file_path):
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except FileNotFoundError:
        print(f"错误: 文件 {file_path} 未找到。")
        return None


def verify_md5(file_path):
    if not os.path.exists(file_path):
        print(f"错误: 输入的文本文件 {file_path} 不存在。")
        return
    count = 0
    with open(file_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 2:
                print(f"错误: 行 {line.strip()} 格式不正确。")
                continue
            recorded_md5 = parts[0]
            file_to_check = parts[1]
            current_md5 = calculate_md5(file_to_check)
            if current_md5 is not None and current_md5 != recorded_md5:
                print(f"错误: 文件 {file_to_check} 的 MD5 值不匹配。记录的 MD5: {recorded_md5}，实际的 MD5: {current_md5}")
            else:
                count += 1
    print(f"成功: {count} 个文件的 MD5 值匹配。")

if __name__ == "__main__":
    verify_md5(sys.argv[1])
    