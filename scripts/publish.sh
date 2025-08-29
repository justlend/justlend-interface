#/bin/bash

version=$1
branch=$2
tag=$3
ORIGIN_NAME=$4
SIGN_NAME=$5
pubenv=""
BucketPath=$6
BucketName=$7

echo "version: $version"
echo "branch: $branch"
echo "tag: $tag"
echo "ORIGIN_NAME: $ORIGIN_NAME"
echo "SIGN_NAME: $SIGN_NAME"


if [[ $branch = "test/usTest1" ]]; then
    pubenv="ustest1"
elif [[ $branch = "f/cicdtest" ]]; then
    pubenv="ustest"    
elif [[ $branch = "f/cicdtestshell" ]]; then
    pubenv="ustest"       
fi

pubenv="ustest"  

if [[ $tag != "" ]]; then
    pubenv="stage" # 如果有 tag，则会发布到 stage 环境
fi

echo "pubenv: $pubenv"

if [[ "$pubenv" != "" ]]; then
    pwd
    ls -al

    # 从第一个桶下载

    aws s3 cp s3://$BucketName/$BucketPath/$ORIGIN_NAME:$version_dev.zip $ORIGIN_NAME:$version:$tag.zip
       # 设置 GPG 环境
    #cd  /data/downloads/$CI_PROJECT_NAME
    rm -rf $ORIGIN_NAME
    # unzip -o $ORIGIN_NAME:$version:$tag.zip
    # echo "unzip $SIGN_NAME:$version:$tag.zip success";
    unzip -o $ORIGIN_NAME:$version:$tag.zip
    echo "unzip $ORIGIN_NAME:$version:$tag.zip success";
    echo "now path:"
    pwd
    ls -l 
    echo "pwd ls -l end";
    ls -l /data/defi/test/lend3/justlend-app/build/
    cd $ORIGIN_NAME/
    echo "now path:" 
    pwd
    sudo cp -rf *  /data/defi/test/lend3/justlend-app/build/
    cd ..
    echo "now path:"
    pwd
    sudo cp -r ver.txt  /data/defi/test/lend3/justlend-app/build/ver.txt

    echo "cd to $ORIGIN_NAME success";

    echo "cp build to some path"
    sudo nginx -s reload
    echo "nginx reload success";

    chmod a+x scripts/wait.sh
    cd scripts
    ./wait.sh $version $pubenv;
    # 检查返回值
    if [ $? -eq 0 ]; then
        echo "publish发布成功，版本号: $version"
    else
        echo "publish发布失败，请检查发布状态 $version"
        exit 1
    fi
else
    echo "no need to publish";
fi
