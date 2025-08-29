#!/bin/bash

version=$1
pubenv=$2

# 配置参数
URL="http://127.0.0.1:18115/ver.txt"  # 替换为实际URL
TARGET="$version"                            # 目标字符串
MAX_ATTEMPTS=5                       # 最大尝试次数
WAIT_DURATION=30                      # 修复时间（秒）

# 初始化计数器
attempt=1

while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo $URL
    echo "尝试 $attempt/$MAX_ATTEMPTS: $(date)"
    
    # 执行curl请求并获取结果（最多等待5秒）
    response=$(curl -s -m 5 $URL)
    exit_code=$?

    # 检查请求是否成功
    if [ $exit_code -ne 0 ]; then
        echo "错误: curl请求失败，退出码 $exit_code"
        response="ERROR"
    fi

    # 比较返回结果与目标字符串
    if [ "$response" = "$TARGET" ]; then
        echo "成功: 返回值匹配 '$TARGET'"
        exit 0
    else
        echo "返回值为 '$response'，不等于 '$TARGET'"
        echo "等待 ($WAIT_DURATION 秒)..."
        sleep $WAIT_DURATION
    fi

    # 增加计数器
    attempt=$((attempt + 1))
done

exit 1