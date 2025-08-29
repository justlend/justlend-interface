#/bin/bash

version=$1
branch=$2
tag=$3
ORIGIN_NAME=$4
SIGN_NAME=$5
pubenv=""
BucketPath=$6
BucketNameDev=$7
BucketNameTest=$8


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
    aws s3 cp s3://$BucketNameDev/$BucketPath/$ORIGIN_NAME:$version.zip $ORIGIN_NAME:$version:$tag.zip
       # 设置 GPG 环境
    # 加上签名、
     gpg --batch --yes --armor --sign --local-user 4FF7BF7C69D8ACB33A02FBF775819DD47FBFC6A7 $ORIGIN_NAME:$version:$tag.zip
     gpg --batch --yes --armor --detach-sign --local-user 4FF7BF7C69D8ACB33A02FBF775819DD47FBFC6A7 $ORIGIN_NAME:$version:$tag.zip

    zip $SIGN_NAME:$version:$tag.zip $ORIGIN_NAME:$version:$tag.zip $ORIGIN_NAME:$version:$tag.zip.asc
    
    # 上传到 dev+qa 桶里
    python3 scripts/s3up1.py $SIGN_NAME:$version:$tag.zip  $BucketPath $BucketNameTest
    python3 scripts/s3up1.py $SIGN_NAME:$version:$tag.zip  $BucketPath $BucketNameDev

    echo "upload $SIGN_NAME:$version:$tag.zip success";

    echo "upload deploy files to $pubenv success";
    /bin/jq -n --arg env "$pubenv" --arg ver "$version" '{env: $env, ver: $ver}' > pub.json;
    cat pub.json;
    # 上传到 dev+qa 桶，前者触发 codepipeline
    python3 scripts/s3up1.py pub.json  $BucketPath $BucketNameTest;
    #python3 scripts/s3up2.py pub.json;
    echo "upload pub.json success";
    #chmod a+x scripts/wait.sh
    #scripts/wait.sh $version $pubenv;
    # 检查返回值
    if [ $? -eq 0 ]; then
        echo "depoly发布成功，版本号: $version"
    else
        echo "depoly发布失败，请检查发布状态"
        exit 1
    fi
else
    echo "no need to publish";
fi
