#!/bin/bash
bucket_name="tadeumen-terraform-backend"
encrypt_config="{\"Rules\":[{\"ApplyServerSideEncryptionByDefault\":{\"SSEAlgorithm\":\"AES256\"}}]}"
region="us-east-1"
terraform_user="terraform_be_user"
bucket_url_prefix=""
bucket_user_arn=""

to_log(){
    msg=$1
    timestamp=$(date '+%Y%m%d%H%M%S')
    echo "[${timestamp}] $1"
}

create_bucket(){
    if [[ "${region}" == "us-east-1" ]] ; then
        cli_output=$(aws s3api create-bucket --bucket "${bucket_name}" --region "${region}")
    else
        cli_output=$(aws s3api create-bucket --bucket "${bucket_name}" --region "${region}" --create-bucket-configuration "LocationConstraint=${region}")
    fi
    bucket_url_prefix=$(echo ${cli_output} | jq '.Location' | sed "s/'//g" | sed "s/\"//g" | sed "s/\///g")
    if [[ ${bucket_url_prefix} != ${bucket_name} ]] ; then
        to_log "Error Creating Bucket : ${bucket_name}"
        exit 1
    else
        to_log "Success Creating Bucket : ${bucket_name}"
    fi
}

add_bucket_encryption(){
    aws s3api put-bucket-encryption --bucket "${bucket_name}" --server-side-encryption-configuration="${encrypt_config}"
}

setup_terraform_user(){
    cli_output=$(aws iam create-user --user-name "${terraform_user}")
    bucket_user_arn=$(echo ${cli_output} | jq '.User.Arn')

    if [[ "${bucket_user_arn}" == "" ]] ; then
        to_log "Error Creating User : ${terraform_user}"
    else
        to_log "Success Creating User : ${terraform_user}"

        aws iam attach-user-policy --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess --user-name "${terraform_user}"
        if [[ $? -ne 0 ]] ; then
            to_log "Error Attaching User Policy AmazonS3FullAccess to ${terraform_user}"
            exit 1
        else
            to_log "Success Attaching User Policy AmazonS3FullAccess to ${terraform_user}"
        fi

        aws iam attach-user-policy --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess --user-name "${terraform_user}"
        if [[ $? -ne 0 ]] ; then
            to_log "Error Attaching User Policy AmazonDynamoDBFullAccess to ${terraform_user}"
            exit 1
        else
            to_log "Success Attaching User Policy AmazonDynamoDBFullAccess to ${terraform_user}"
        fi
        
        sleep 5

        json_policy="{\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"AWS\":${bucket_user_arn}},\"Action\":\"s3:*\",\"Resource\":\"arn:aws:s3:::${bucket_name}\"}]}"
        aws s3api put-bucket-policy --bucket "${bucket_name}" --policy ${json_policy}
        if [[ $? -ne 0 ]] ; then
            to_log "Error Attaching Bucket Policy to ${bucket_name}"
            exit 1
        else
            to_log "Success Attaching Bucket Policy to ${bucket_name}"
        fi
    fi

}

# Create Bucket
create_bucket
add_bucket_encryption
setup_terraform_user