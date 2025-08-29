#/bin/bash

# 脚本用法，用来下载指定版本的文件
# chmod a+x ./fetch.sh
# ./fetch.sh 0173bad

# 检查是否提供了版本参数
if [ -z "$1" ]; then
    echo "错误: 请提供版本号作为第一个参数"
    echo "用法: $0 0173bad"
    exit 1
fi

# 获取版本参数
version="$1"

# 构建S3源路径
source_path="s3://tronlink-test/build:${version}.zip"

# 执行S3复制操作
echo "开始从S3复制文件: ${source_path}"
aws s3 cp "${source_path}" ./build:${version}.zip

# 检查命令执行状态
if [ $? -eq 0 ]; then
    echo "文件复制成功，已保存为 ./build:${version}.zip"
else
    echo "文件复制失败，请检查AWS CLI配置和S3路径"
    exit 1
fi    